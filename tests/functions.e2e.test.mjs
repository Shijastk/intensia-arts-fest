// End-to-end tests for the Cloud Functions against the local emulators (auth, database,
// functions). Run with:  npm run test:functions
// Uses the demo-intensia project id, so nothing can reach production.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken, signInWithCredential, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, get, set } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

const PROJECT_ID = 'demo-intensia';
let app, auth, db, fns, env, ownerUid;

const call = (name, data) => httpsCallable(fns, name)(data).then(r => r.data);
const asAdmin = (fn) => env.withSecurityRulesDisabled(ctx => fn(ctx.database()));
// withSecurityRulesDisabled does not return the callback's value, so capture it.
const readAdmin = async (path) => {
  let value;
  await asAdmin(async adb => { value = (await get(ref(adb, path))).val(); });
  return value;
};
const expectError = async (promise, code) => {
  await assert.rejects(promise, (err) => { assert.equal(err.code, `functions/${code}`, err.message); return true; });
};
const waitFor = async (check, ms = 10000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await check()) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
};
const loginStaff = async (username, password, festId = 'f1') => {
  const { token } = await call('staffLogin', { festId, username, password });
  await signOut(auth);
  const cred = await signInWithCustomToken(auth, token);
  // Wait until the database connection is using the new session (own profile readable).
  const { staffId } = (await cred.user.getIdTokenResult()).claims;
  const ready = await waitFor(() => get(ref(db, `fests/${festId}/staff/${staffId}`)).then(() => true, () => false), 5000);
  assert.ok(ready, 'database session ready');
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: { rules: readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9000 }
  });
  app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key', databaseURL: `http://127.0.0.1:9000?ns=${PROJECT_ID}` }); // same namespace as the test env and functions
  auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  fns = getFunctions(app, 'asia-southeast1');
  connectFunctionsEmulator(fns, '127.0.0.1', 5001);

  // A Google-signed-in fest owner (the Auth emulator accepts unsigned test credentials).
  const cred = await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: 'owner-sub', email: 'owner@example.com', email_verified: true })));
  ownerUid = cred.user.uid;
  await signOut(auth);

  await env.clearDatabase();
  await asAdmin(adb => set(ref(adb, '/'), {
    users: { [ownerUid]: { email: 'owner@example.com', name: 'Owner', role: 'admin', festId: 'f1' } },
    fests: {
      f1: {
        name: 'Fest One', adminUid: ownerUid,
        staff: {
          legacy: { id: 'legacy', role: 'JUDGE', username: 'JudgeL', password: 'Legacy123', judgePanel: 'Stage 1' },
          off: { id: 'off', role: 'GREEN_ROOM', username: 'offline', password: 'pw1234', isDisabled: true },
          lock: { id: 'lock', role: 'GREEN_ROOM', username: 'locky', password: 'correct-horse' }
        },
        programs: {
          p1: {
            name: 'Group Song', status: 'PENDING', isResultPublished: false, judgePanel: 'Stage 1',
            teams: [
              { id: 't1', teamName: 'Red', score: 7, participants: [{ name: 'Asha', chestNumber: '101', codeLetter: 'A', score: 7 }] },
              { id: 't2', teamName: 'Blue', score: 8, participants: [{ name: 'Bilal', chestNumber: '201', codeLetter: 'B', score: 8 }] }
            ]
          }
        }
      }
    }
  }));
});

after(async () => {
  await signOut(auth).catch(() => {});
  await deleteApp(app);
  await env?.cleanup();
});

test('staffLogin rejects wrong passwords with a generic error', async () => {
  await expectError(call('staffLogin', { festId: 'f1', username: 'JudgeL', password: 'nope' }), 'unauthenticated');
  await expectError(call('staffLogin', { festId: 'f1', username: 'nobody', password: 'x' }), 'unauthenticated');
  await expectError(call('staffLogin', { festId: 'f1', username: 'offline', password: 'pw1234' }), 'permission-denied');
});

test('legacy plaintext password still works once, and is migrated to a bcrypt hash', async () => {
  // Username is matched case-insensitively and trimmed (mobile keyboards).
  await loginStaff(' judgel ', 'Legacy123');
  const token = await auth.currentUser.getIdTokenResult();
  assert.equal(token.claims.festId, 'f1');
  assert.equal(token.claims.staffId, 'legacy');
  assert.equal(token.claims.role, undefined, 'role is not trusted from the token');

  assert.equal(await readAdmin('fests/f1/staff/legacy/password'), null, 'plaintext removed');
  const secret = await readAdmin('staffSecrets/f1/legacy');
  assert.match(secret.passwordHash, /^\$2[aby]\$10\$/);

  // Second login uses the hash.
  await loginStaff('JudgeL', 'Legacy123');
  await expectError(call('staffLogin', { festId: 'f1', username: 'JudgeL', password: 'Legacy1234' }), 'unauthenticated');

  // The judge session can read its own panel's program but not staff secrets.
  await loginStaff('JudgeL', 'Legacy123');
  assert.ok((await get(ref(db, 'fests/f1/programs/p1'))).exists());
  await assert.rejects(get(ref(db, 'staffSecrets/f1/legacy')));
});

test('accounts lock after 10 failed attempts', async () => {
  for (let i = 0; i < 10; i++) {
    await expectError(call('staffLogin', { festId: 'f1', username: 'locky', password: 'wrong' }), 'unauthenticated');
  }
  await expectError(call('staffLogin', { festId: 'f1', username: 'locky', password: 'correct-horse' }), 'resource-exhausted');
});

test('only the fest admin can manage staff; passwords are never stored in profiles', async () => {
  await loginStaff('JudgeL', 'Legacy123');
  await expectError(call('manageStaff', { festId: 'f1', action: 'create', staff: { role: 'ADMIN', username: 'evil', password: 'evil123' } }), 'permission-denied');
  await expectError(call('manageStaff', { festId: 'f1', action: 'update', staffId: 'legacy', staff: { role: 'ADMIN' } }), 'permission-denied');
  await expectError(call('uploadImage', { festId: 'f1', imageBase64: 'aGVsbG8=' }), 'permission-denied');
  await expectError(call('migrateSecurity', {}), 'permission-denied');

  await signOut(auth);
  await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: 'owner-sub', email: 'owner@example.com', email_verified: true })));
  const { id } = await call('manageStaff', { festId: 'f1', action: 'create', staff: { role: 'TEAM_LEADER', username: 'red', password: 'red-pass', teamName: 'Red' } });
  const profile = await readAdmin(`fests/f1/staff/${id}`);
  assert.equal(profile.password, undefined);
  assert.equal(profile.teamName, 'Red');
  await expectError(call('manageStaff', { festId: 'f1', action: 'create', staff: { role: 'JUDGE', username: 'RED', password: 'x1234' } }), 'already-exists');

  // Editing without a password keeps the old one; the owner cannot manage another fest.
  await call('manageStaff', { festId: 'f1', action: 'update', staffId: id, staff: { teamName: 'Red', password: '' } });
  await expectError(call('manageStaff', { festId: 'f2', action: 'create', staff: { role: 'JUDGE', username: 'j', password: 'x1234' } }), 'permission-denied');

  await loginStaff('red', 'red-pass');
  assert.ok(auth.currentUser.uid.startsWith('staff_'));
});

test('team leaders change only their own team, without seeing or touching scores', async () => {
  await loginStaff('red', 'red-pass');
  await assert.rejects(get(ref(db, 'fests/f1/programs/p1')), 'team leaders cannot read private programs');

  await call('teamLeaderUpdateTeam', {
    festId: 'f1', programId: 'p1',
    team: { teamName: 'Red', participants: [{ name: 'Asha', chestNumber: '101' }, { name: 'Chitra', chestNumber: '102' }] }
  });
  const program = await readAdmin('fests/f1/programs/p1');
  const red = program.teams.find(t => t.teamName === 'Red');
  assert.deepEqual(red.participants.map(p => p.chestNumber), ['101', '102']);
  assert.equal(red.participants[0].codeLetter, 'A', 'existing codes kept');
  assert.equal(red.participants[0].score, 7, 'existing scores kept');
  assert.equal(program.teams.find(t => t.teamName === 'Blue').participants.length, 1, 'other team untouched');

  await expectError(call('teamLeaderUpdateTeam', { festId: 'f1', programId: 'p1', team: { teamName: 'Blue', participants: [] } }), 'permission-denied');

  // The trigger publishes a copy without unpublished scores or code letters.
  const mirrored = await waitFor(async () => {
    const pub = (await get(ref(db, 'publicFests/f1/programs/p1'))).val();
    return pub && pub.teams?.find(t => t.teamName === 'Red')?.participants?.length === 2;
  });
  assert.ok(mirrored, 'public mirror updated');
  const pub = (await get(ref(db, 'publicFests/f1/programs/p1'))).val();
  const pubRed = pub.teams.find(t => t.teamName === 'Red');
  assert.equal(pubRed.score, undefined);
  assert.equal(pubRed.participants[0].score, undefined);
  assert.equal(pubRed.participants[0].codeLetter, undefined);
});

// Security tests for database.rules.json. Run with the Realtime Database emulator:
//   npm run test:rules
// Uses a demo- project id, so nothing can ever reach the production project.
// Free (Spark) plan model: staff log in without Firebase Auth, so staff writes are open inside
// an existing fest; Google accounts, fest ownership and the fest list stay protected.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, get, set, update, remove } from 'firebase/database';

const PROJECT_ID = 'demo-intensia';
let env;

const google = (uid, extra = {}) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'google.com' }, email: `${uid}@example.com`, ...extra }).database();
const superAdmin = () => google('super', { superAdmin: true });
const anon = () => env.unauthenticatedContext().database();

const program = (overrides = {}) => ({
  id: 'p1', festId: 'f1', name: 'Solo Song', category: 'A', status: 'JUDGING', judgePanel: 'Stage 1',
  isPublished: false, isResultPublished: false,
  teams: [{ id: 't1', teamName: 'Red', score: 0, participants: [{ name: 'Asha', chestNumber: '101', codeLetter: 'A', score: 0 }] }],
  ...overrides
});

const seed = {
  users: {
    owner1: { email: 'owner1@example.com', name: 'Owner One', role: 'admin', festId: 'f1', createdAt: '2026-01-01' },
    owner2: { email: 'owner2@example.com', name: 'Owner Two', role: 'admin', festId: 'f2', createdAt: '2026-01-01' },
    banned: { email: 'banned@example.com', name: 'Banned', role: 'admin', festId: 'f3', isActive: false }
  },
  fests: {
    f1: {
      name: 'Fest One', adminUid: 'owner1', createdAt: '2026-01-01',
      settings: { festName: 'Fest One' },
      students: { s1: { name: 'Asha', chestNumber: '101', teamName: 'Red' } },
      staff: {
        judge1: { id: 'judge1', role: 'JUDGE', username: 'judge1', judgePanel: 'Stage 1', passwordHash: 'a'.repeat(64), passwordSalt: 'b'.repeat(32) },
        judge2: { id: 'judge2', role: 'JUDGE', username: 'judge2', judgePanel: 'Stage 2' },
        gr1: { id: 'gr1', role: 'GREEN_ROOM', username: 'gr' },
        tl1: { id: 'tl1', role: 'TEAM_LEADER', username: 'red', teamName: 'Red' },
        adm1: { id: 'adm1', role: 'ADMIN', username: 'coadmin' },
        off1: { id: 'off1', role: 'JUDGE', username: 'old', judgePanel: 'Stage 1', isDisabled: true }
      },
      programs: { p1: program(), p2: program({ id: 'p2', judgePanel: 'Stage 2' }) }
    },
    f2: {
      name: 'Fest Two', adminUid: 'owner2',
      staff: { judgeX: { id: 'judgeX', role: 'JUDGE', username: 'x' } },
      programs: { q1: program({ id: 'q1', festId: 'f2' }) }
    },
    f3: { name: 'Fest Three', adminUid: 'banned', programs: { r1: program({ id: 'r1', festId: 'f3' }) } }
  },
  superAdmins: { super2: true }
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: { rules: readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9000 }
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => { await set(ref(ctx.database(), '/'), seed); });
});

test('1. the fest list, user profiles and unknown paths stay private', async () => {
  const db = anon();
  for (const path of ['fests', 'users', 'users/owner1', 'fests/f1', 'superAdmins', 'staffSecrets', 'somethingElse']) {
    await assertFails(get(ref(db, path)));
  }
  for (const path of ['fests/f1/settings', 'fests/f1/programs', 'fests/f1/students', 'fests/f1/staff', 'fests/f1/name']) {
    await assertSucceeds(get(ref(db, path)));
  }
  await assertFails(get(ref(google('owner1'), 'fests')));
  await assertFails(get(ref(google('owner1'), 'users/owner2')));
});

test('2. staff passwords: only salted hashes can be stored', async () => {
  const db = anon();
  await assertFails(update(ref(db, 'fests/f1/staff/judge1'), { password: 'plain' }));
  await assertFails(set(ref(db, 'fests/f1/staff/n1'), { username: 'n', role: 'JUDGE', password: 'plain' }));
  await assertFails(set(ref(db, 'fests/f1/staff/n1'), { username: 'n', role: 'JUDGE', passwordHash: 'short', passwordSalt: 'b'.repeat(32) }));
  await assertFails(set(ref(db, 'fests/f1/staff/n1'), { username: 'n', role: 'OWNER', passwordHash: 'a'.repeat(64), passwordSalt: 'b'.repeat(32) }));
  await assertSucceeds(set(ref(google('owner1'), 'fests/f1/staff/n1'), { username: 'n', role: 'JUDGE', passwordHash: 'c'.repeat(64), passwordSalt: 'd'.repeat(32) }));
  // Legacy plain-text passwords may be removed (migration), never written.
  await env.withSecurityRulesDisabled(async (ctx) => { await set(ref(ctx.database(), 'fests/f1/staff/old'), { username: 'o', role: 'JUDGE', password: '1234' }); });
  await assertSucceeds(update(ref(db, 'fests/f1/staff/old'), { password: null, passwordHash: 'e'.repeat(64), passwordSalt: 'f'.repeat(32) }));
});

test('3. staff work (no Firebase login) is possible inside an existing fest only', async () => {
  const db = anon();
  await assertSucceeds(update(ref(db, 'fests/f1/programs/p1'), { status: 'COMPLETED', isResultPublished: true }));
  await assertSucceeds(set(ref(db, 'fests/f1/programs/p1/teams/0/score'), 88));
  await assertSucceeds(set(ref(db, 'fests/f1/students/s2'), { name: 'Binu' }));
  await assertSucceeds(update(ref(db, 'fests/f1/settings'), { festName: 'Fest One!' }));
  await assertSucceeds(update(ref(db, 'fests/f1'), { 'programs/p2/status': 'CANCELLED', 'students/s1': null }));
  // Not in a fest that does not exist (no new fests or junk data).
  await assertFails(set(ref(db, 'fests/nofest/programs/x'), program()));
  await assertFails(set(ref(db, 'fests/nofest/settings'), { festName: 'x' }));
  await assertFails(set(ref(db, 'fests/nofest'), { name: 'x', adminUid: 'someone' }));
});

test('4. fest ownership cannot be taken over and fests cannot be deleted', async () => {
  const db = anon();
  await assertFails(set(ref(db, 'fests/f1/adminUid'), 'attacker'));
  await assertFails(set(ref(google('owner2'), 'fests/f1/adminUid'), 'owner2'));
  await assertFails(remove(ref(db, 'fests/f1')));
  await assertFails(remove(ref(google('owner1'), 'fests/f2')));
  await assertFails(set(ref(google('owner1'), 'fests/f2'), { name: 'mine', adminUid: 'owner1' }));
});

test('5. basic validation still applies', async () => {
  const db = anon();
  await assertFails(set(ref(db, 'fests/f1/programs/p1/status'), 'HACKED'));
  await assertFails(set(ref(db, 'fests/f1/programs/p1/isResultPublished'), 'yes'));
  await assertFails(set(ref(db, 'fests/f1/students/s3'), { chestNumber: '1' }));
  await assertFails(set(ref(db, 'fests/f1/staff/judge1/role'), 'SUPER'));
});

test('6. Google accounts: own profile only, cannot self-activate or point at another fest', async () => {
  await assertSucceeds(update(ref(google('owner1'), 'users/owner1'), { name: 'New Name' }));
  await assertFails(update(ref(google('owner1'), 'users/owner2'), { name: 'x' }));
  await assertFails(update(ref(google('banned'), 'users/banned'), { isActive: true }));
  await assertFails(update(ref(google('owner1'), 'users/owner1'), { festId: 'f2' }));
  await assertFails(update(ref(anon(), 'users/owner1'), { name: 'x' }));
  await assertSucceeds(set(ref(google('newbie'), 'fests/newfest'), { name: 'New', adminUid: 'newbie', createdAt: '2026-11-03' }));
  await assertFails(set(ref(google('banned'), 'fests/bannedfest'), { name: 'New', adminUid: 'banned' }));
});

test('7. Super Admin (claim or /superAdmins entry) manages every fest; nobody can add themselves', async () => {
  for (const db of [superAdmin(), google('super2')]) {
    await assertSucceeds(get(ref(db, 'fests')));
    await assertSucceeds(get(ref(db, 'users')));
  }
  await assertSucceeds(remove(ref(google('super2'), 'fests/f3')));
  await assertSucceeds(update(ref(google('super2'), 'users/banned'), { isActive: true }));
  await assertFails(set(ref(google('owner1'), 'superAdmins/owner1'), true));
  await assertFails(set(ref(anon(), 'superAdmins/x'), true));
  await assertSucceeds(get(ref(google('super2'), 'superAdmins/super2')));
});

test('8. custom fonts: public read, validated', async () => {
  const font = { family: 'Anek Malayalam', dataUrl: 'data:font/woff2;base64,AAAA' };
  await assertSucceeds(set(ref(google('owner1'), 'fests/f1/customFonts/x1'), font));
  await assertSucceeds(get(ref(anon(), 'fests/f1/customFonts')));
  await assertFails(set(ref(anon(), 'fests/nofest/customFonts/x2'), font));
  await assertFails(set(ref(google('owner1'), 'fests/f1/customFonts/x3'), { family: 'Bad"};x{', dataUrl: font.dataUrl }));
  await assertFails(set(ref(google('owner1'), 'fests/f1/customFonts/x4'), { family: 'Ok', dataUrl: 'javascript:alert(1)' }));
  await assertFails(set(ref(google('owner1'), 'fests/f1/customFonts/x5'), { ...font, extra: 'nope' }));
});

// Security tests for database.rules.json. Run with the Realtime Database emulator:
//   npm run test:rules
// Uses a demo- project id, so nothing can ever reach the production project.
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, get, set, update, remove } from 'firebase/database';

const PROJECT_ID = 'demo-intensia';
let env;

const google = (uid, extra = {}) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'google.com' }, email: `${uid}@example.com`, ...extra }).database();
const staff = (festId, staffId, extra = {}) => env.authenticatedContext(`staff_${festId}_${staffId}`, { firebase: { sign_in_provider: 'custom' }, festId, staffId, ...extra }).database();
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
        judge1: { id: 'judge1', role: 'JUDGE', username: 'judge1', judgePanel: 'Stage 1' },
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
  publicFests: { f1: { programs: { p1: { id: 'p1', name: 'Solo Song' } } } },
  staffSecrets: { f1: { judge1: { passwordHash: '$2b$10$abcdefghijklmnopqrstuv' } } }
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

// 1. Unauthenticated users cannot read /fests or /users
test('1. unauthenticated users cannot read private data', async () => {
  const db = anon();
  for (const path of ['fests', 'users', 'fests/f1', 'fests/f1/staff', 'fests/f1/programs', 'fests/f1/programs/p1', 'fests/f1/students', 'staffSecrets', 'publicFests']) {
    await assertFails(get(ref(db, path)));
  }
  await assertSucceeds(get(ref(db, 'publicFests/f1')));
  await assertSucceeds(get(ref(db, 'fests/f1/settings')));
});

// 2. Staff credentials cannot be downloaded
test('2. password hashes are unreadable and passwords cannot be stored in profiles', async () => {
  for (const db of [anon(), google('owner1'), superAdmin(), staff('f1', 'judge1')]) {
    await assertFails(get(ref(db, 'staffSecrets')));
    await assertFails(get(ref(db, 'staffSecrets/f1/judge1')));
    await assertFails(set(ref(db, 'staffSecrets/f1/judge1/passwordHash'), 'x'));
  }
  await assertFails(update(ref(superAdmin(), 'fests/f1/staff/judge1'), { password: 'plain' }));
  // Only the manageStaff function (Admin SDK) creates or edits staff; clients cannot.
  await assertFails(set(ref(google('owner1'), 'fests/f1/staff/new1'), { role: 'ADMIN', username: 'evil' }));
  await assertFails(update(ref(staff('f1', 'judge1'), 'fests/f1/staff/judge1'), { role: 'ADMIN' }));
});

// 3. Staff cannot access another fest
test('3. staff and admins are confined to their own fest', async () => {
  const judge = staff('f1', 'judge1');
  await assertFails(get(ref(judge, 'fests/f2/programs/q1')));
  await assertFails(get(ref(judge, 'fests/f2/staff')));
  await assertFails(set(ref(judge, 'fests/f2/programs/q1/teams/0/score'), 99));
  // A token for f1 cannot be pointed at f2's staff ids either.
  await assertFails(get(ref(staff('f1', 'judgeX'), 'fests/f1/programs/p1')));
  const owner1 = google('owner1');
  await assertFails(get(ref(owner1, 'fests/f2/programs')));
  await assertFails(update(ref(owner1, 'fests/f2/settings'), { festName: 'hacked' }));
  await assertFails(get(ref(owner1, 'fests')));
});

// 4. Judges cannot use admin functionality
test('4. judges are limited to scoring their own panel', async () => {
  const judge = staff('f1', 'judge1');
  await assertFails(update(ref(judge, 'fests/f1/settings'), { festName: 'x' }));
  await assertFails(get(ref(judge, 'fests/f1/programs')));
  await assertFails(get(ref(judge, 'fests/f1/staff')));
  await assertFails(set(ref(judge, 'fests/f1/programs/p1/isResultPublished'), true));
  await assertFails(set(ref(judge, 'fests/f1/programs/p1/isPublished'), true));
  await assertFails(remove(ref(judge, 'fests/f1/programs/p1')));
  await assertFails(set(ref(judge, 'fests/f1/programs/p1/name'), 'Renamed'));
  await assertFails(get(ref(judge, 'fests/f1/programs/p2')), 'other panel');
  await assertFails(set(ref(judge, 'fests/f1/programs/p2/teams/0/score'), 9));
  await assertFails(set(ref(judge, 'fests/f1/programs/p1/teams/0/participants/0/name'), 'Someone else'));
  await assertFails(set(ref(judge, 'fests/f1/programs/p1/teams/0/participants/0/codeLetter'), 'Z'));
  // Extra claims in the token are ignored: role comes from the database.
  await assertFails(update(ref(staff('f1', 'judge1', { role: 'ADMIN' }), 'fests/f1/settings'), { festName: 'x' }));
});

// 5. Green room cannot use admin tools
test('5. green room is limited to codes and allocation', async () => {
  const gr = staff('f1', 'gr1');
  await assertSucceeds(get(ref(gr, 'fests/f1/programs')));
  await assertFails(update(ref(gr, 'fests/f1/settings'), { festName: 'x' }));
  await assertFails(set(ref(gr, 'fests/f1/students/s2'), { name: 'X' }));
  await assertFails(set(ref(gr, 'fests/f1/programs/p1/resultPublishedOrder'), 5));
  await assertFails(set(ref(gr, 'fests/f1/programs/p1/isResultPublished'), true));
  await assertFails(set(ref(gr, 'fests/f1/programs/p1/teams/0/participants/0/score'), 10));
  await assertFails(set(ref(gr, 'fests/f1/programs/p1/teams/0/score'), 10));
  await assertFails(set(ref(gr, 'fests/f1/programs/p9'), program({ id: 'p9' })));
  await assertFails(get(ref(gr, 'staffSecrets/f1')));
});

// 6 & 7. Browser-side role / festId / flags cannot escalate privileges
test('6-7. forged sessions, roles and fest ids are rejected', async () => {
  // A random Google account (e.g. someone who edited localStorage to role=admin, festId=f1)
  const stranger = google('stranger');
  await assertFails(get(ref(stranger, 'fests/f1/programs')));
  await assertFails(update(ref(stranger, 'fests/f1/settings'), { festName: 'x' }));
  // Cannot claim someone else's fest through the profile
  await assertFails(set(ref(stranger, 'users/stranger'), { role: 'admin', festId: 'f1' }));
  await assertFails(update(ref(google('owner1'), 'users/owner1'), { festId: 'f2' }));
  // Cannot make themselves Super Admin or reactivate themselves
  await assertFails(update(ref(google('owner1'), 'users/owner1'), { isActive: true, superAdmin: true }));
  await assertFails(update(ref(google('banned'), 'users/banned'), { isActive: true }));
  await assertFails(set(ref(google('owner1'), 'users/owner1/role'), 'superadmin'));
  // Cannot hijack an existing fest or create one owned by someone else
  await assertFails(set(ref(stranger, 'fests/f1'), { name: 'mine', adminUid: 'stranger' }));
  await assertFails(set(ref(stranger, 'fests/new-1'), { name: 'n', adminUid: 'owner1' }));
  await assertFails(update(ref(google('owner1'), 'fests/f1'), { adminUid: 'stranger' }));
  // A fest owner cannot read other users' profiles
  await assertFails(get(ref(google('owner1'), 'users/owner2')));
  // Anonymous or non-Google sign-ins cannot act as fest owners
  await assertFails(get(ref(env.authenticatedContext('owner1', { firebase: { sign_in_provider: 'anonymous' } }).database(), 'fests/f1/programs')));
  // Disabled staff and deactivated owners lose access immediately
  await assertFails(get(ref(staff('f1', 'off1'), 'fests/f1/programs/p1')));
  await assertFails(get(ref(google('banned'), 'fests/f3/programs')));
});

// 8. Unpublished scores are protected
test('8. unpublished scores are only visible to admins, green room and the assigned judge', async () => {
  const tl = staff('f1', 'tl1');
  await assertFails(get(ref(tl, 'fests/f1/programs')));
  await assertFails(get(ref(tl, 'fests/f1/programs/p1')));
  await assertFails(get(ref(anon(), 'fests/f1/programs/p1/teams')));
  await assertSucceeds(get(ref(tl, 'publicFests/f1/programs')));
  await assertSucceeds(get(ref(tl, 'fests/f1/staff/tl1')));
  await assertFails(get(ref(tl, 'fests/f1/staff/judge1')));
});

// 9. Unauthorized writes are rejected
test('9. unauthorized writes are rejected', async () => {
  for (const db of [anon(), staff('f1', 'tl1'), google('stranger')]) {
    await assertFails(set(ref(db, 'fests/f1/programs/p1/teams/0/participants/0/score'), 99));
    await assertFails(set(ref(db, 'publicFests/f1/programs/p1/name'), 'x'));
    await assertFails(set(ref(db, 'users/owner1/isActive'), false));
    await assertFails(remove(ref(db, 'fests/f1')));
  }
  await assertFails(set(ref(superAdmin(), 'publicFests/f1/programs/p1/name'), 'x'));
  await assertFails(set(ref(google('owner1'), 'fests/f1/programs/p1/status'), 'BOGUS'));
});

// 10. Valid users can still do their jobs
test('10. legitimate workflows keep working', async () => {
  const owner = google('owner1');
  await assertSucceeds(get(ref(owner, 'fests/f1/programs')));
  await assertSucceeds(get(ref(owner, 'fests/f1/staff')));
  await assertSucceeds(update(ref(owner, 'fests/f1/programs/p1'), { name: 'Solo Song (Boys)', isResultPublished: true, resultPublishedOrder: 1 }));
  await assertSucceeds(set(ref(owner, 'fests/f1/programs/p3'), program({ id: 'p3' })));
  await assertSucceeds(update(ref(owner, 'fests/f1/settings'), { festName: 'Renamed' }));
  await assertSucceeds(set(ref(owner, 'fests/f1/students/s2'), { name: 'Ravi', chestNumber: '102', teamName: 'Red' }));
  await assertSucceeds(get(ref(owner, 'users/owner1')));

  // New convenor: create own fest, then link it
  const newbie = google('newbie');
  await assertSucceeds(set(ref(newbie, 'users/newbie'), { email: 'n@example.com', name: 'N', role: 'admin', createdAt: '2026-10-31' }));
  await assertSucceeds(set(ref(newbie, 'fests/new-fest-1234'), { name: 'New Fest', adminUid: 'newbie', createdAt: '2026-10-31' }));
  await assertSucceeds(update(ref(newbie, 'users/newbie'), { festId: 'new-fest-1234' }));

  // Co-admin staff account (role ADMIN) manages the fest
  await assertSucceeds(update(ref(staff('f1', 'adm1'), 'fests/f1/programs/p1'), { venue: 'Hall 2' }));

  // Judge submits scores for their panel (same shape JudgesPage writes)
  const judge = staff('f1', 'judge1');
  await assertSucceeds(get(ref(judge, 'fests/f1/programs/p1')));
  const scored = program().teams.map(t => ({ ...t, score: 9, grade: 'A', rank: 1, points: 8, participants: t.participants.map(p => ({ ...p, score: 9, grade: 'A', rank: 1, points: 8 })) }));
  await assertSucceeds(update(ref(judge, 'fests/f1/programs/p1'), { status: 'COMPLETED', isPublished: false, teams: scored }));

  // Green room assigns codes, reveals them and allocates to a judge panel
  const gr = staff('f1', 'gr1');
  const coded = program().teams.map(t => ({ ...t, participants: t.participants.map(p => ({ ...p, codeLetter: 'B', isCodeRevealed: true })) }));
  await assertSucceeds(update(ref(gr, 'fests/f1/programs/p2'), { teams: coded }));
  await assertSucceeds(update(ref(gr, 'fests/f1/programs/p2'), { status: 'JUDGING', isAllocatedToJudge: true, judgePanel: 'Stage 1' }));
  await assertSucceeds(get(ref(gr, 'fests/f1/staff')));

  // Staff read their own profile; everyone reads public results
  await assertSucceeds(get(ref(judge, 'fests/f1/staff/judge1')));
  await assertSucceeds(get(ref(anon(), 'publicFests/f1/programs')));

  // Super Admin sees and manages everything (except password hashes)
  const sa = superAdmin();
  await assertSucceeds(get(ref(sa, 'fests')));
  await assertSucceeds(get(ref(sa, 'users')));
  await assertSucceeds(update(ref(sa, 'users/owner2'), { isActive: false }));
  await assertSucceeds(get(ref(sa, 'fests/f2/programs')));
});

// Custom fonts for posters/certificates
test('11. custom fonts: public read, admin-only write, validated', async () => {
  const font = { family: 'Anek Malayalam', dataUrl: 'data:font/woff2;base64,AAAA' };
  await assertSucceeds(set(ref(google('owner1'), 'fests/f1/customFonts/x1'), font));
  await assertSucceeds(get(ref(anon(), 'fests/f1/customFonts')));
  await assertFails(set(ref(anon(), 'fests/f1/customFonts/x2'), font));
  await assertFails(set(ref(staff('f1', 'judge1'), 'fests/f1/customFonts/x2'), font));
  await assertFails(set(ref(google('stranger'), 'fests/f1/customFonts/x2'), font));
  await assertFails(set(ref(google('owner1'), 'fests/f1/customFonts/x3'), { family: 'Bad"};x{', dataUrl: font.dataUrl }));
  await assertFails(set(ref(google('owner1'), 'fests/f1/customFonts/x4'), { family: 'Ok', dataUrl: 'javascript:alert(1)' }));
  await assertFails(set(ref(google('owner1'), 'fests/f1/customFonts/x5'), { ...font, extra: 'nope' }));
});

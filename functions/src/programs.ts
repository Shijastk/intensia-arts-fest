import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onValueWritten } from 'firebase-functions/v2/database';
import { defineSecret } from 'firebase-functions/params';
import bcrypt from 'bcryptjs';
import {
  db, REGION, BCRYPT_COST, assertKey, assertString, optionalString,
  resolveCaller, assertFestAdmin, sanitizeProgramForPublic
} from './common';

const IMGBB_API_KEY = defineSecret('IMGBB_API_KEY');

const toList = (value: any): any[] => Array.isArray(value) ? value.filter(Boolean) : (value && typeof value === 'object' ? Object.values(value) : []);
const sameName = (a: unknown, b: unknown) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

/**
 * Team leaders only see the public (score-free) copy of programs, so they register
 * participants through this function. It changes nothing but the caller's own team, merges
 * by chest number inside a transaction (no lost updates), and never touches scores or codes.
 */
export const teamLeaderUpdateTeam = onCall({ region: REGION }, async (request) => {
  const data = (request.data || {}) as Record<string, any>;
  const festId = assertKey(data.festId, 'fest');
  const programId = assertKey(data.programId, 'program');
  const caller = await resolveCaller(request, festId);
  if (caller.staffRole !== 'TEAM_LEADER' || !caller.staffId) {
    throw new HttpsError('permission-denied', 'Only team leaders can register participants.');
  }
  const teamName = String((await db.ref(`fests/${festId}/staff/${caller.staffId}/teamName`).get()).val() || '').trim();
  if (!teamName) throw new HttpsError('failed-precondition', 'Your account has no team assigned.');

  const incomingTeam = data.team || {};
  if (!sameName(incomingTeam.teamName, teamName)) throw new HttpsError('permission-denied', 'You can only change your own team.');
  const incoming = toList(incomingTeam.participants).slice(0, 200).map((p: any) => ({
    name: assertString(p?.name, 'participant name', { max: 120 }),
    chestNumber: assertString(String(p?.chestNumber ?? ''), 'chest number', { max: 30 }),
    removalRequested: p?.removalRequested === true
  }));

  let rejected = '';
  const result = await db.ref(`fests/${festId}/programs/${programId}`).transaction((program: any) => {
    rejected = '';
    // The first run may see an uncached null; returning it unchanged lets RTDB retry with the real value.
    if (!program) return program;
    const teams = toList(program.teams);
    let index = teams.findIndex(t => sameName(t?.teamName, teamName));
    const existingParticipants = index >= 0 ? toList(teams[index].participants) : [];
    const byChest = new Map(existingParticipants.map((p: any) => [String(p.chestNumber), p]));
    const added = incoming.filter(p => !byChest.has(p.chestNumber));
    if (added.length > 0 && program.status && program.status !== 'PENDING') {
      rejected = 'This program has already started; new participants cannot be added.';
      return; // abort
    }

    // Existing participants keep every server-side field (codes, scores); only the
    // removal-request flag can be set by the team leader. Nobody is deleted here.
    const merged = existingParticipants.map((p: any) => {
      const update = incoming.find(i => i.chestNumber === String(p.chestNumber));
      return update?.removalRequested ? { ...p, removalRequested: true } : p;
    });
    for (const p of added) merged.push({ name: p.name, chestNumber: p.chestNumber });

    if (index < 0) {
      teams.push({ id: `team_${Date.now()}_${programId}`, teamName, participants: merged });
      index = teams.length - 1;
    } else {
      teams[index] = { ...teams[index], participants: merged };
    }
    return { ...program, teams };
  });

  if (rejected) throw new HttpsError('failed-precondition', rejected);
  if (!result.committed || !result.snapshot.exists()) throw new HttpsError('not-found', 'Program not found.');
  return { ok: true };
});

/** Keeps /publicFests/{festId}/programs in sync with the private program data. */
export const mirrorPublicProgram = onValueWritten(
  // Must match the database location. The local emulator's database is us-central1.
  { ref: '/fests/{festId}/programs/{programId}', region: process.env.FUNCTIONS_EMULATOR === 'true' ? 'us-central1' : REGION },
  async (event) => {
    const { festId, programId } = event.params;
    const target = db.ref(`publicFests/${festId}/programs/${programId}`);
    const after = event.data.after.val();
    if (!after) {
      await target.remove();
      return;
    }
    await target.set(sanitizeProgramForPublic({ ...after, id: programId, festId }));
  }
);

/** Uploads an image to ImgBB with a server-side key (the key never reaches the browser). */
export const uploadImage = onCall({ region: REGION, secrets: [IMGBB_API_KEY], memory: '512MiB' }, async (request) => {
  const data = (request.data || {}) as Record<string, any>;
  const festId = assertKey(data.festId, 'fest');
  await assertFestAdmin(request, festId);

  const imageBase64 = typeof data.imageBase64 === 'string' ? data.imageBase64.replace(/^data:[^;]+;base64,/, '') : '';
  if (!imageBase64 || !/^[A-Za-z0-9+/=\r\n]+$/.test(imageBase64)) throw new HttpsError('invalid-argument', 'Invalid image.');
  if (imageBase64.length > 9_500_000) throw new HttpsError('invalid-argument', 'Image is too large (max 7 MB).');
  const name = optionalString(data.fileName, 'file name', 120);

  const body = new URLSearchParams({ key: IMGBB_API_KEY.value(), image: imageBase64 });
  if (name) body.set('name', name.replace(/\.[^.]+$/, ''));
  const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body });
  const json: any = await response.json().catch(() => ({}));
  if (!response.ok || !json?.data?.url) {
    throw new HttpsError('internal', `Image upload failed: ${json?.error?.message || response.statusText}`);
  }
  return { url: String(json.data.url) };
});

/**
 * One-time (and re-runnable) security migration, Super Admin only:
 *  - hashes every remaining plaintext staff password into /staffSecrets and deletes it,
 *  - rebuilds the public program mirror.
 * Existing accounts keep working with their current passwords.
 */
export const migrateSecurity = onCall({ region: REGION, timeoutSeconds: 540, memory: '1GiB' }, async (request) => {
  if (request.auth?.token?.superAdmin !== true) throw new HttpsError('permission-denied', 'Super Admin only.');
  const onlyFest = request.data?.festId ? assertKey(request.data.festId, 'fest') : null;
  const dryRun = request.data?.dryRun === true;

  const festIds = onlyFest ? [onlyFest] : Object.keys((await db.ref('fests').get()).val() || {});
  const report = { fests: 0, passwordsMigrated: 0, alreadyHashed: 0, programsMirrored: 0, dryRun };

  for (const festId of festIds) {
    report.fests++;
    const staff = ((await db.ref(`fests/${festId}/staff`).get()).val() || {}) as Record<string, any>;
    for (const [staffId, member] of Object.entries(staff)) {
      if (!member || member.password === undefined || member.password === null) continue;
      const hashSnap = await db.ref(`staffSecrets/${festId}/${staffId}/passwordHash`).get();
      if (dryRun) { hashSnap.exists() ? report.alreadyHashed++ : report.passwordsMigrated++; continue; }
      if (!hashSnap.exists()) {
        const hash = await bcrypt.hash(String(member.password).trim(), BCRYPT_COST);
        await db.ref(`staffSecrets/${festId}/${staffId}`).update({ passwordHash: hash, migratedAt: Date.now() });
        report.passwordsMigrated++;
      } else {
        report.alreadyHashed++;
      }
      await db.ref(`fests/${festId}/staff/${staffId}/password`).remove();
    }

    const programs = ((await db.ref(`fests/${festId}/programs`).get()).val() || {}) as Record<string, any>;
    const mirror: Record<string, any> = {};
    for (const [programId, program] of Object.entries(programs)) {
      mirror[programId] = sanitizeProgramForPublic({ ...program, id: programId, festId });
      report.programsMirrored++;
    }
    if (!dryRun) await db.ref(`publicFests/${festId}/programs`).set(mirror);
  }
  return report;
});

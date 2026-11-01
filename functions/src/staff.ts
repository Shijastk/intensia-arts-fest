import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import bcrypt from 'bcryptjs';
import {
  db, adminAuth, REGION, BCRYPT_COST, STAFF_ROLES, StaffRole,
  assertKey, assertString, optionalString, normalizeUsername, safeEqual, staffUid,
  assertFestAdmin
} from './common';

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid username or password.';

const secretRef = (festId: string, staffId: string) => db.ref(`staffSecrets/${festId}/${staffId}`);

const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

/**
 * Verifies a staff member's username/password on the server and returns a Firebase
 * custom token. Passwords are stored as bcrypt hashes under /staffSecrets, which no
 * client can read. Legacy plaintext passwords are verified once, hashed, and removed.
 */
export const staffLogin = onCall({ region: REGION, maxInstances: 20 }, async (request) => {
  const data = (request.data || {}) as Record<string, unknown>;
  const festId = assertKey(data.festId, 'fest');
  const username = normalizeUsername(assertString(data.username, 'username', { max: 100 }));
  const password = assertString(data.password, 'password', { max: 200 });

  const staffSnap = await db.ref(`fests/${festId}/staff`).get();
  const staffList = (staffSnap.val() || {}) as Record<string, any>;
  const candidates = Object.entries(staffList).filter(([, s]) => s && normalizeUsername(s.username) === username);

  let matchedDisabled = false;
  for (const [staffId, staff] of candidates) {
    const secretSnap = await secretRef(festId, staffId).get();
    const secret = (secretSnap.val() || {}) as { passwordHash?: string; failedAttempts?: number; lockedUntil?: number };

    if (secret.lockedUntil && secret.lockedUntil > Date.now()) {
      throw new HttpsError('resource-exhausted', 'Too many failed attempts. Try again in 15 minutes.');
    }

    let ok = false;
    if (secret.passwordHash) {
      ok = await bcrypt.compare(password, secret.passwordHash);
    } else if (staff.password !== undefined && staff.password !== null) {
      // One-time migration of a legacy plaintext password.
      ok = safeEqual(String(staff.password).trim(), password);
      if (ok) {
        await secretRef(festId, staffId).update({ passwordHash: await hashPassword(password), migratedAt: Date.now() });
        await db.ref(`fests/${festId}/staff/${staffId}/password`).remove();
      }
    }

    if (!ok) {
      const failedAttempts = (secret.failedAttempts || 0) + 1;
      await secretRef(festId, staffId).update(
        failedAttempts >= MAX_FAILED_ATTEMPTS
          ? { failedAttempts: 0, lockedUntil: Date.now() + LOCKOUT_MS }
          : { failedAttempts }
      );
      continue;
    }

    if (staff.isDisabled === true) {
      matchedDisabled = true;
      continue;
    }
    if (!STAFF_ROLES.includes(staff.role)) {
      throw new HttpsError('failed-precondition', 'This account has no valid role. Ask the admin to fix it.');
    }

    await secretRef(festId, staffId).update({ failedAttempts: 0, lockedUntil: null, lastLoginAt: Date.now() });

    // Claims identify the account only. Role, panel, team and disabled state are always
    // re-read from the database by the security rules, so admin changes apply immediately.
    const token = await adminAuth.createCustomToken(staffUid(festId, staffId), {
      festId,
      staffId,
      username: String(staff.username).slice(0, 100),
      displayName: String(staff.displayName || staff.username).slice(0, 100)
    });
    return { token };
  }

  if (matchedDisabled) throw new HttpsError('permission-denied', 'This account has been disabled by the administrator.');
  logger.info('Staff login failed', { festId, candidates: candidates.length });
  throw new HttpsError('unauthenticated', INVALID_CREDENTIALS);
});

const sanitizeStaffProfile = (input: Record<string, unknown>) => {
  const role = input.role as StaffRole;
  if (!STAFF_ROLES.includes(role)) throw new HttpsError('invalid-argument', 'Invalid role.');
  const profile: Record<string, unknown> = {
    role,
    username: assertString(input.username, 'username', { max: 100 }),
    judgePanel: role === 'JUDGE' ? optionalString(input.judgePanel, 'judge panel') ?? null : null,
    teamName: role === 'TEAM_LEADER' ? optionalString(input.teamName, 'team name') ?? null : null,
    panelName: optionalString(input.panelName, 'panel name') ?? null,
    stage: optionalString(input.stage, 'stage') ?? null,
    displayName: optionalString(input.displayName, 'display name') ?? null
  };
  if (input.isDisabled !== undefined) profile.isDisabled = input.isDisabled === true;
  return profile;
};

/**
 * Create / update / delete staff accounts. Only the fest admin may call it. Passwords are
 * hashed here and never written to the readable staff profile.
 */
export const manageStaff = onCall({ region: REGION }, async (request) => {
  const data = (request.data || {}) as Record<string, any>;
  const festId = assertKey(data.festId, 'fest');
  const action = data.action as 'create' | 'update' | 'delete';
  const caller = await assertFestAdmin(request, festId);
  const canManageAdmins = caller.isSuperAdmin || caller.isFestOwner;

  const staffRoot = db.ref(`fests/${festId}/staff`);
  const existingAll = ((await staffRoot.get()).val() || {}) as Record<string, any>;

  const assertUniqueUsername = (username: string, exceptId?: string) => {
    const clash = Object.entries(existingAll).some(([id, s]) => id !== exceptId && s && normalizeUsername(s.username) === normalizeUsername(username));
    if (clash) throw new HttpsError('already-exists', 'That username is already used in this fest.');
  };

  if (action === 'create') {
    const profile = sanitizeStaffProfile(data.staff || {});
    const password = assertString(data.staff?.password, 'password', { min: 4, max: 200 });
    if (profile.role === 'ADMIN' && !canManageAdmins) throw new HttpsError('permission-denied', 'Only the fest owner can create admin accounts.');
    assertUniqueUsername(profile.username as string);
    const staffId = staffRoot.push().key as string;
    await secretRef(festId, staffId).set({ passwordHash: await hashPassword(password), updatedAt: Date.now() });
    await staffRoot.child(staffId).set({ ...profile, id: staffId, festId, isDisabled: profile.isDisabled ?? false, createdAt: Date.now() });
    return { id: staffId };
  }

  const staffId = assertKey(data.staffId, 'staff id');
  const existing = existingAll[staffId];
  if (!existing) throw new HttpsError('not-found', 'Staff account not found.');
  if (caller.staffId === staffId) throw new HttpsError('permission-denied', 'You cannot change your own account.');
  if (existing.role === 'ADMIN' && !canManageAdmins) throw new HttpsError('permission-denied', 'Only the fest owner can change admin accounts.');

  if (action === 'delete') {
    await staffRoot.child(staffId).remove();
    await secretRef(festId, staffId).remove();
    return { id: staffId };
  }

  if (action === 'update') {
    const updates = (data.staff || {}) as Record<string, unknown>;
    const merged = sanitizeStaffProfile({ ...existing, ...updates });
    if (merged.role === 'ADMIN' && !canManageAdmins) throw new HttpsError('permission-denied', 'Only the fest owner can create admin accounts.');
    assertUniqueUsername(merged.username as string, staffId);
    if (typeof updates.password === 'string' && updates.password.trim() !== '') {
      const password = assertString(updates.password, 'password', { min: 4, max: 200 });
      await secretRef(festId, staffId).set({ passwordHash: await hashPassword(password), updatedAt: Date.now() });
    } else if (existing.password !== undefined && existing.password !== null) {
      // Keep a not-yet-migrated account working: hash its legacy password before removing it.
      const hasHash = (await secretRef(festId, staffId).child('passwordHash').get()).exists();
      if (!hasHash) {
        await secretRef(festId, staffId).update({ passwordHash: await hashPassword(String(existing.password).trim()), migratedAt: Date.now() });
      }
    }
    await staffRoot.child(staffId).update({ ...merged, password: null, updatedAt: Date.now() });
    return { id: staffId };
  }

  throw new HttpsError('invalid-argument', 'Unknown action.');
});

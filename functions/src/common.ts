import { initializeApp, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { createHash, timingSafeEqual } from 'crypto';

if (getApps().length === 0) initializeApp();

export const db = getDatabase();
export const adminAuth = getAuth();

// Same location as the Realtime Database instance (asia-southeast1).
export const REGION = 'asia-southeast1';

export const STAFF_ROLES = ['GREEN_ROOM', 'JUDGE', 'TEAM_LEADER', 'ADMIN'] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export const BCRYPT_COST = 10;

// RTDB keys cannot contain . $ # [ ] / and must be non-empty.
const KEY_PATTERN = /^[^.$#\[\]\/\x00-\x1F\x7F]{1,128}$/;

export const assertKey = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !KEY_PATTERN.test(value)) {
    throw new HttpsError('invalid-argument', `Invalid ${field}.`);
  }
  return value;
};

export const assertString = (value: unknown, field: string, { min = 1, max = 200 } = {}): string => {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `Invalid ${field}.`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new HttpsError('invalid-argument', `${field} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
};

export const optionalString = (value: unknown, field: string, max = 100): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return assertString(value, field, { min: 1, max });
};

export const normalizeUsername = (value: unknown) => String(value ?? '').trim().toLowerCase();

/** Constant-time comparison for legacy plaintext passwords during migration. */
export const safeEqual = (a: string, b: string) => {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
};

/** Stable Firebase Auth uid for a staff account (always <= 128 chars). */
export const staffUid = (festId: string, staffId: string) =>
  'staff_' + createHash('sha256').update(`${festId}/${staffId}`).digest('hex').slice(0, 40);

export interface CallerContext {
  uid: string;
  isSuperAdmin: boolean;
  isFestOwner: boolean;
  staffId?: string;
  staffRole?: StaffRole;
}

/**
 * Resolves who the caller is for a given fest, using only server-side data:
 * the verified ID token (custom claims) plus the database records.
 */
export const resolveCaller = async (request: CallableRequest<unknown>, festId: string): Promise<CallerContext> => {
  const auth = request.auth;
  if (!auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  const token = auth.token as Record<string, any>;
  const ctx: CallerContext = { uid: auth.uid, isSuperAdmin: token.superAdmin === true, isFestOwner: false };

  if (typeof token.staffId === 'string' && token.festId === festId) {
    const staffSnap = await db.ref(`fests/${festId}/staff/${token.staffId}`).get();
    const staff = staffSnap.val();
    if (staff && staff.isDisabled !== true && STAFF_ROLES.includes(staff.role)) {
      ctx.staffId = token.staffId;
      ctx.staffRole = staff.role;
    }
  }

  if (token.firebase?.sign_in_provider === 'google.com') {
    const [ownerSnap, activeSnap] = await Promise.all([
      db.ref(`fests/${festId}/adminUid`).get(),
      db.ref(`users/${auth.uid}/isActive`).get()
    ]);
    ctx.isFestOwner = ownerSnap.val() === auth.uid && activeSnap.val() !== false;
  }

  return ctx;
};

export const isFestAdmin = (ctx: CallerContext) => ctx.isSuperAdmin || ctx.isFestOwner || ctx.staffRole === 'ADMIN';

export const assertFestAdmin = async (request: CallableRequest<unknown>, festId: string) => {
  const ctx = await resolveCaller(request, festId);
  if (!isFestAdmin(ctx)) throw new HttpsError('permission-denied', 'Only the fest admin can do this.');
  return ctx;
};

const SCORE_FIELDS = ['score', 'grade', 'points', 'rank'];
const CODE_FIELDS = ['codeLetter', 'isCodeRevealed'];

/**
 * Public copy of a program. Unpublished results (scores, grades, points, ranks) and the
 * anonymous judging code letters are removed so they can only be read by authorised staff.
 */
export const sanitizeProgramForPublic = (program: any) => {
  if (!program || typeof program !== 'object') return null;
  const published = program.isResultPublished === true;
  const strip = (obj: any, fields: string[]) => {
    if (!obj || typeof obj !== 'object') return obj;
    const copy = { ...obj };
    for (const f of fields) delete copy[f];
    return copy;
  };
  const toList = (value: any): any[] => Array.isArray(value) ? value : (value && typeof value === 'object' ? Object.values(value) : []);

  const teams = toList(program.teams).filter(Boolean).map((team: any) => {
    const participants = toList(team.participants).filter(Boolean).map((p: any) =>
      published ? p : strip(p, [...CODE_FIELDS, ...SCORE_FIELDS])
    );
    return { ...strip(team, published ? [] : SCORE_FIELDS), participants };
  });

  return { ...program, teams };
};

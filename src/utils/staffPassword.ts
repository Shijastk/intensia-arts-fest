// Staff passwords are stored on the staff record as a salted PBKDF2-SHA-256 hash, never as
// plain text. The check runs in the browser (the free Spark plan has no server), so the hash
// is readable by the login page; the salt and many iterations make guessing it slow.
const ITERATIONS = 100_000;

const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');

export const newPasswordSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

export const hashStaffPassword = async (password: string, salt: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: ITERATIONS },
    key,
    256
  );
  return toHex(bits);
};

/** The fields to store for a new password. */
export const staffPasswordFields = async (password: string) => {
  const passwordSalt = newPasswordSalt();
  return { passwordSalt, passwordHash: await hashStaffPassword(password, passwordSalt) };
};

/** True when `password` matches the record (hashed, or a legacy plain-text password). */
export const staffPasswordMatches = async (
  staff: { passwordHash?: string; passwordSalt?: string; password?: string | number | null },
  password: string
): Promise<boolean> => {
  if (staff.passwordHash && staff.passwordSalt) {
    return (await hashStaffPassword(password, staff.passwordSalt)) === staff.passwordHash;
  }
  if (staff.password !== undefined && staff.password !== null) {
    return String(staff.password).trim() === password;
  }
  return false;
};

export const normalizeUsername = (username: unknown) => String(username ?? '').trim().toLowerCase();

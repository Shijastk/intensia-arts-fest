import { auth, db, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { User } from '../types';
import { normalizeUsername, staffPasswordMatches } from '../utils/staffPassword';
import { describeError } from '../utils/errorReporting';

// UI-only selection of which fest a Super Admin is viewing. It grants nothing: the
// database rules check the verified superAdmin custom claim on every request.
const SUPER_ADMIN_FEST_KEY = 'Intensia_super_admin_fest';

// Staff sessions (no Firebase Auth on the free plan): which staff record this browser logged
// in as. The password hash is kept so a password change or account removal ends the session.
const STAFF_SESSION_KEY = 'Intensia_staff_session';
type StaffSession = { festId: string; staffId: string; check: string };

const readStaffSession = (): StaffSession | null => {
  try {
    const value = JSON.parse(localStorage.getItem(STAFF_SESSION_KEY) || 'null');
    return value && typeof value.festId === 'string' && typeof value.staffId === 'string' ? value : null;
  } catch { return null; }
};
const writeStaffSession = (session: StaffSession | null) => {
  try {
    if (session) localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(STAFF_SESSION_KEY);
  } catch { /* storage unavailable */ }
};
const passwordCheck = (staff: any) => String(staff?.passwordHash ?? staff?.password ?? '');

const staffUser = (festId: string, staffId: string, staff: any): User => ({
  uid: `staff:${festId}:${staffId}`,
  staffId,
  username: staff.username,
  role: staff.role,
  festId,
  displayName: staff.displayName || staff.username,
  ...(staff.judgePanel && { judgePanel: staff.judgePanel }),
  ...(staff.teamName && { teamName: staff.teamName })
});

/** Super Admin = Google account listed under /superAdmins/{uid} or with the superAdmin claim. */
export const isSuperAdminUser = async (user: FirebaseUser, forceRefresh = false): Promise<boolean> => {
  const token = await user.getIdTokenResult(forceRefresh);
  if (token.signInProvider !== 'google.com') return false;
  if (token.claims.superAdmin === true) return true;
  const snap = await get(ref(db, `superAdmins/${user.uid}`)).catch(() => null);
  return snap?.val() === true;
};

export const authService = {
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      writeStaffSession(null);
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.isActive === false) {
          await signOut(auth);
          return { success: false, error: 'Your account has been deactivated by the system administrator.' };
        }
        return { success: true, festId: userData.festId, isNewUser: false };
      } else {
        await set(userRef, {
          email: user.email,
          name: user.displayName,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        return { success: true, festId: null, isNewUser: true };
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Staff / Judge / Green Room / Team Leader login with the username and password the fest
   * admin created. Checked against the salted hash on the staff record.
   */
  async loginStaff(username: string, pass: string, specificFestId?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!specificFestId) {
      return { success: false, error: "Use your fest's staff login link (…/fests/<fest-id>/login)." };
    }
    try {
      const snapshot = await get(ref(db, `fests/${specificFestId}/staff`));
      const all = (snapshot.val() || {}) as Record<string, any>;
      const wanted = normalizeUsername(username);
      const password = String(pass).trim();
      let disabled = false;
      for (const [staffId, staff] of Object.entries(all)) {
        if (!staff || normalizeUsername(staff.username) !== wanted) continue;
        if (!(await staffPasswordMatches(staff, password))) continue;
        if (staff.isDisabled === true) { disabled = true; continue; }
        if (auth.currentUser) await signOut(auth);
        writeStaffSession({ festId: specificFestId, staffId, check: passwordCheck(staff) });
        return { success: true, user: staffUser(specificFestId, staffId, staff) };
      }
      return { success: false, error: disabled ? 'This account has been disabled by the administrator.' : 'Invalid username or password.' };
    } catch (error: any) {
      console.error('Staff login error:', error);
      return { success: false, error: describeError(error) };
    }
  },

  /**
   * Builds the app user from the Google session (admins) or the saved staff login, which is
   * re-checked against the database every time (removed / disabled accounts are logged out).
   */
  async resolveSession(firebaseUser: FirebaseUser | null): Promise<User | null> {
    if (!firebaseUser) {
      const session = readStaffSession();
      if (!session) return null;
      const snap = await get(ref(db, `fests/${session.festId}/staff/${session.staffId}`));
      const staff = snap.val();
      if (!staff || staff.isDisabled === true || passwordCheck(staff) !== session.check) {
        writeStaffSession(null);
        return null;
      }
      return staffUser(session.festId, session.staffId, staff);
    }
    const provider = (await firebaseUser.getIdTokenResult()).signInProvider;

    if (provider === 'google.com') {
      const isSuperAdmin = await isSuperAdminUser(firebaseUser);
      const snap = await get(ref(db, `users/${firebaseUser.uid}`)).catch(() => null);
      const profile = snap?.val() || {};
      if (profile.isActive === false) {
        await signOut(auth);
        return null;
      }
      let selectedFest = '';
      try { selectedFest = isSuperAdmin ? sessionStorage.getItem(SUPER_ADMIN_FEST_KEY) || '' : ''; } catch { /* storage unavailable */ }
      return {
        uid: firebaseUser.uid,
        username: firebaseUser.email || 'admin',
        role: 'admin',
        festId: selectedFest || profile.festId || '',
        displayName: isSuperAdmin && selectedFest ? 'Supreme Admin' : (firebaseUser.displayName || 'Fest Convenor'),
        ...(isSuperAdmin && { isSuperAdmin: true })
      };
    }

    // Any other Firebase session (old anonymous / custom-token staff logins): end it.
    await signOut(auth);
    return authService.resolveSession(null);
  },

  setSuperAdminFest(festId: string | null) {
    try {
      if (festId) sessionStorage.setItem(SUPER_ADMIN_FEST_KEY, festId);
      else sessionStorage.removeItem(SUPER_ADMIN_FEST_KEY);
    } catch { /* storage unavailable */ }
  },

  async createFestForAdmin(userId: string, festName: string) {
    try {
      const festId = festName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
      const festRef = ref(db, `fests/${festId}`);
      await set(festRef, {
        name: festName,
        adminUid: userId,
        createdAt: new Date().toISOString()
      });
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, { festId });
      return { success: true, festId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async logout() {
    authService.setSuperAdminFest(null);
    writeStaffSession(null);
    await signOut(auth);
  }
};

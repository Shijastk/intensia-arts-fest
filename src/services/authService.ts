import { auth, db, functions, googleProvider } from '../config/firebase';
import { signInWithCustomToken, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { User } from '../types';

// UI-only selection of which fest a Super Admin is viewing. It grants nothing: the
// database rules check the verified superAdmin custom claim on every request.
const SUPER_ADMIN_FEST_KEY = 'Intensia_super_admin_fest';

const callableMessage = (error: any, fallback: string) => {
  // Callable errors look like { code: 'functions/unauthenticated', message: '...' }.
  if (error?.code === 'functions/unavailable' || error?.code === 'functions/internal') {
    return error?.message && error.message !== 'internal' ? error.message : fallback;
  }
  return error?.message || fallback;
};

export const authService = {
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
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
   * Staff / Judge / Green Room / Team Leader login. Credentials are verified by the
   * staffLogin Cloud Function (bcrypt hashes the browser can never read), which returns a
   * custom token for a Firebase session scoped to this fest.
   */
  async loginStaff(username: string, pass: string, specificFestId?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!specificFestId) {
      return { success: false, error: "Use your fest's staff login link (…/fests/<fest-id>/login)." };
    }
    try {
      const staffLogin = httpsCallable<{ festId: string; username: string; password: string }, { token: string }>(functions, 'staffLogin');
      const { data } = await staffLogin({ festId: specificFestId, username: String(username).trim(), password: String(pass).trim() });
      if (auth.currentUser) await signOut(auth);
      const credential = await signInWithCustomToken(auth, data.token);
      const user = await authService.resolveSession(credential.user);
      if (!user) return { success: false, error: 'Login succeeded but the staff profile could not be loaded.' };
      return { success: true, user };
    } catch (error: any) {
      console.error('Staff login error:', error);
      return { success: false, error: callableMessage(error, 'Login failed. Please try again.') };
    }
  },

  /**
   * Builds the app user from the verified Firebase session only (token claims + the
   * database). Nothing stored in localStorage/sessionStorage is trusted.
   */
  async resolveSession(firebaseUser: FirebaseUser | null): Promise<User | null> {
    if (!firebaseUser) return null;
    const tokenResult = await firebaseUser.getIdTokenResult();
    const claims = tokenResult.claims as Record<string, any>;
    const provider = tokenResult.signInProvider;

    if (typeof claims.staffId === 'string' && typeof claims.festId === 'string') {
      const snap = await get(ref(db, `fests/${claims.festId}/staff/${claims.staffId}`));
      const staff = snap.val();
      if (!staff || staff.isDisabled === true) {
        await signOut(auth);
        return null;
      }
      return {
        uid: firebaseUser.uid,
        staffId: claims.staffId,
        username: staff.username,
        role: staff.role,
        festId: claims.festId,
        displayName: staff.displayName || staff.username,
        ...(staff.judgePanel && { judgePanel: staff.judgePanel }),
        ...(staff.teamName && { teamName: staff.teamName })
      };
    }

    if (provider === 'google.com') {
      const isSuperAdmin = claims.superAdmin === true;
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

    // Legacy anonymous sessions (old staff login) carry no identity: end them.
    await signOut(auth);
    return null;
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
    await signOut(auth);
  }
};

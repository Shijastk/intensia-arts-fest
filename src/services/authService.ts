import { auth, db } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { User } from '../types';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // 1. Admin Google Sign-In
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.isActive === false) {
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
      console.error("Google auth error:", error);
      return { success: false, error: error.message };
    }
  },

  // 2. Staff / Judge Login (Username & Password)
  async loginStaff(username: string, pass: string, specificFestId?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const festsRef = ref(db, 'fests');
      const snapshot = await get(festsRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'No festivals found in database.' };
      }

      const festsData = snapshot.val();
      let foundUser: any = null;
      let targetFestId = '';

      const festIdsToCheck = specificFestId ? [specificFestId] : Object.keys(festsData);

      for (const festId of festIdsToCheck) {
        // Checking in the generic 'staff' node where we save them now
        const staffList = festsData[festId]?.staff;
        if (staffList) {
          for (const staffKey of Object.keys(staffList)) {
            const staffMember = staffList[staffKey];
            if (staffMember.username === username && staffMember.password === pass) {
              if (staffMember.isDisabled) {
                return { success: false, error: 'This account has been disabled by the administrator.' };
              }
              foundUser = staffMember;
              targetFestId = festId;
              break;
            }
          }
        }
        if (foundUser) break;
      }

      if (!foundUser) {
        return { success: false, error: 'Invalid username or password.' };
      }

      const userObj: User = {
        uid: foundUser.id || username,
        username: foundUser.username,
        role: foundUser.role, // 'JUDGE' | 'GREEN_ROOM' | 'TEAM_LEADER'
        festId: targetFestId,
        displayName: foundUser.displayName || foundUser.username,
        ...(foundUser.judgePanel && { judgePanel: foundUser.judgePanel }),
        ...(foundUser.teamName && { teamName: foundUser.teamName })
      };

      return { success: true, user: userObj };
    } catch (error: any) {
      console.error("Staff login error:", error);
      return { success: false, error: error.message };
    }
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
    await signOut(auth);
  }
};
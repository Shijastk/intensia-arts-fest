import { ref, get, push, set, update, remove } from 'firebase/database';
import { db } from '../config/firebase';
import { Staff } from '../types';
import { appDialog } from '../components/ui/AppDialog';
import { describeError } from '../utils/errorReporting';
import { normalizeUsername, staffPasswordFields } from '../utils/staffPassword';

// Staff accounts are written straight to the database by the fest admin (no Cloud
// Functions on the free plan). Passwords are stored only as salted hashes.
const STAFF_ROLES: Staff['role'][] = ['GREEN_ROOM', 'JUDGE', 'TEAM_LEADER', 'ADMIN'];

const fail = (message: string): false => {
  appDialog.alert(message, { variant: 'danger', title: 'Staff account not saved' });
  return false;
};

const optional = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : null;
};

// Only known profile fields are stored; panel / team only apply to their own role.
const profileFields = (input: Partial<Staff> & Record<string, any>) => {
  const role = input.role as Staff['role'];
  return {
    role,
    username: String(input.username ?? '').trim(),
    judgePanel: role === 'JUDGE' ? optional(input.judgePanel) : null,
    teamName: role === 'TEAM_LEADER' ? optional(input.teamName) : null,
    panelName: optional(input.panelName),
    stage: optional(input.stage),
    displayName: optional(input.displayName)
  };
};

const usernameTaken = async (festId: string, username: string, exceptId?: string) => {
  const snapshot = await get(ref(db, `fests/${festId}/staff`));
  const all = (snapshot.val() || {}) as Record<string, any>;
  return Object.entries(all).some(([id, s]) => id !== exceptId && s && normalizeUsername(s.username) === normalizeUsername(username));
};

export const staffService = {
  async getAllStaffs(festId: string): Promise<Staff[]> {
    try {
      const snapshot = await get(ref(db, `fests/${festId}/staff`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data) as Staff[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching staffs:", error);
      return [];
    }
  },

  async addStaff(festId: string, staff: Omit<Staff, 'id'>): Promise<boolean> {
    try {
      const profile = profileFields(staff);
      const password = String(staff.password ?? '').trim();
      if (!STAFF_ROLES.includes(profile.role)) return fail('Choose a role for this account.');
      if (!profile.username) return fail('Enter a username.');
      if (password.length < 4) return fail('The password must have at least 4 characters.');
      if (await usernameTaken(festId, profile.username)) return fail('That username is already used in this fest.');

      const staffRef = push(ref(db, `fests/${festId}/staff`));
      await set(staffRef, {
        ...profile,
        ...(await staffPasswordFields(password)),
        id: staffRef.key,
        festId,
        isDisabled: staff.isDisabled === true,
        createdAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error("Error adding staff:", error);
      return fail(describeError(error));
    }
  },

  async updateStaff(festId: string, id: string, updates: Partial<Staff>): Promise<boolean> {
    try {
      const snapshot = await get(ref(db, `fests/${festId}/staff/${id}`));
      const existing = snapshot.val();
      if (!existing) return fail('This staff account no longer exists.');

      const profile = profileFields({ ...existing, ...updates });
      if (!STAFF_ROLES.includes(profile.role)) return fail('Choose a role for this account.');
      if (!profile.username) return fail('Enter a username.');
      if (await usernameTaken(festId, profile.username, id)) return fail('That username is already used in this fest.');

      const changes: Record<string, unknown> = { ...profile, updatedAt: Date.now() };
      if (updates.isDisabled !== undefined) changes.isDisabled = updates.isDisabled === true;
      const password = typeof updates.password === 'string' ? updates.password.trim() : '';
      if (password) {
        if (password.length < 4) return fail('The password must have at least 4 characters.');
        Object.assign(changes, await staffPasswordFields(password), { password: null });
      } else if (existing.password !== undefined && existing.password !== null && !existing.passwordHash) {
        // Replace a legacy plain-text password with its hash; the staff member keeps it.
        Object.assign(changes, await staffPasswordFields(String(existing.password).trim()), { password: null });
      }
      await update(ref(db, `fests/${festId}/staff/${id}`), changes);
      return true;
    } catch (error) {
      console.error("Error updating staff:", error);
      return fail(describeError(error));
    }
  },

  async deleteStaff(festId: string, id: string): Promise<boolean> {
    try {
      await remove(ref(db, `fests/${festId}/staff/${id}`));
      return true;
    } catch (error) {
      console.error("Error deleting staff:", error);
      return fail(describeError(error));
    }
  }
};

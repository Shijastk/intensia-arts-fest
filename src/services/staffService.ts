import { ref, get } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { Staff } from '../types';
import { appDialog } from '../components/ui/AppDialog';
import { describeError } from '../utils/errorReporting';

// Staff accounts are created and changed only by the manageStaff Cloud Function, which
// checks that the caller is the fest admin and stores passwords as bcrypt hashes.
const manageStaff = httpsCallable<Record<string, unknown>, { id: string }>(functions, 'manageStaff');

const errorMessage = (error: any) => (error ? describeError(error) : 'The staff account could not be saved.');

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
      await manageStaff({ festId, action: 'create', staff });
      return true;
    } catch (error) {
      console.error("Error adding staff:", error);
      appDialog.alert(errorMessage(error), { variant: 'danger', title: 'Staff account not saved' });
      return false;
    }
  },

  async updateStaff(festId: string, id: string, updates: Partial<Staff>): Promise<boolean> {
    try {
      await manageStaff({ festId, action: 'update', staffId: id, staff: updates });
      return true;
    } catch (error) {
      console.error("Error updating staff:", error);
      appDialog.alert(errorMessage(error), { variant: 'danger', title: 'Staff account not saved' });
      return false;
    }
  },

  async deleteStaff(festId: string, id: string): Promise<boolean> {
    try {
      await manageStaff({ festId, action: 'delete', staffId: id });
      return true;
    } catch (error) {
      console.error("Error deleting staff:", error);
      appDialog.alert(errorMessage(error), { variant: 'danger', title: 'Staff account not saved' });
      return false;
    }
  }
};

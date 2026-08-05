import { ref, get, set, remove, update } from 'firebase/database';
import { db } from '../config/firebase';
import { Staff } from '../types';

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
      const id = `staff_${Date.now()}`;
      await set(ref(db, `fests/${festId}/staff/${id}`), { ...staff, id, festId });
      return true;
    } catch (error) {
      console.error("Error adding staff:", error);
      return false;
    }
  },

  async updateStaff(festId: string, id: string, updates: Partial<Staff>): Promise<boolean> {
    try {
      await update(ref(db, `fests/${festId}/staff/${id}`), updates);
      return true;
    } catch (error) {
      console.error("Error updating staff:", error);
      return false;
    }
  },

  async deleteStaff(festId: string, id: string): Promise<boolean> {
    try {
      await remove(ref(db, `fests/${festId}/staff/${id}`));
      return true;
    } catch (error) {
      console.error("Error deleting staff:", error);
      return false;
    }
  }
};
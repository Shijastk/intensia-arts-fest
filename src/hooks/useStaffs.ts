import { useState, useEffect } from 'react';
import { Staff, User } from '../types';
import { staffService } from '../services/staffService';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

export const useStaffs = (festId: string | null, currentUser?: User | null) => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const role = String(currentUser?.role || '').toLowerCase().replace('_', '');
  // Admins and green room may list all staff; everyone else may only read their own profile.
  const ownStaffId = role === 'admin' || role === 'greenroom' ? null : currentUser?.staffId || null;

  useEffect(() => {
    if (!festId || (currentUser && role !== 'admin' && role !== 'greenroom' && !ownStaffId)) {
      setStaffs([]);
      return;
    }

    // Real-time listener for staffs
    const staffRef = ref(db, ownStaffId ? `fests/${festId}/staff/${ownStaffId}` : `fests/${festId}/staff`);
    const unsubscribe = onValue(staffRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (ownStaffId) {
          setStaffs([{ ...data, id: ownStaffId } as Staff]);
          return;
        }
        const staffsArray = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setStaffs(staffsArray as Staff[]);
      } else {
        setStaffs([]);
      }
    }, (error) => {
      console.error('Firebase Subscription Error (Staff):', error);
      setStaffs([]);
    });

    return () => unsubscribe();
  }, [festId, ownStaffId, role, currentUser]);

  const addStaff = async (data: Omit<Staff, 'id'>) => {
    if (!festId) return false;
    return await staffService.addStaff(festId, data);
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    if (!festId) return false;
    return await staffService.updateStaff(festId, id, updates);
  };

  const deleteStaff = async (id: string) => {
    if (!festId) return false;
    return await staffService.deleteStaff(festId, id);
  };

  return { staffs, addStaff, updateStaff, deleteStaff };
};

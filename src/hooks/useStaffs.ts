import { useState, useEffect } from 'react';
import { Staff } from '../types';
import { staffService } from '../services/staffService';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

export const useStaffs = (festId: string | null) => {
  const [staffs, setStaffs] = useState<Staff[]>([]);

  useEffect(() => {
    if (!festId) {
      setStaffs([]);
      return;
    }

    // Real-time listener for staffs
    const staffRef = ref(db, `fests/${festId}/staff`);
    const unsubscribe = onValue(staffRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setStaffs(Object.values(data) as Staff[]);
      } else {
        setStaffs([]);
      }
    });

    return () => unsubscribe();
  }, [festId]);

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
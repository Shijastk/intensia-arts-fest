import { get, ref } from 'firebase/database';
import { db } from '../config/firebase';

export interface FestBackup {
  backupVersion: 1;
  exportedAt: string;
  festId: string;
  fest: any;
  users: Record<string, any>;
  staff: Record<string, any>;
}

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const safeFilename = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'fest';

/** Exports the complete Firebase data stored under one fest, plus its linked users. */
export const downloadFestBackup = async (festId: string, festName?: string) => {
  if (!festId) throw new Error('Fest ID is required');

  const [festSnapshot, usersSnapshot] = await Promise.all([
    get(ref(db, `fests/${festId}`)),
    get(ref(db, 'users'))
  ]);

  if (!festSnapshot.exists()) throw new Error('Fest data was not found');

  const fest = festSnapshot.val();
  const allUsers = usersSnapshot.exists() ? (usersSnapshot.val() || {}) : {};
  const users: Record<string, any> = {};

  Object.entries(allUsers).forEach(([uid, user]) => {
    if ((user as any)?.festId === festId) users[uid] = user;
  });

  const backup: FestBackup = {
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    festId,
    fest,
    users,
    staff: fest?.staffs || fest?.staff || {}
  };

  const date = new Date().toISOString().slice(0, 10);
  downloadJson(`artsflow_${safeFilename(festName || fest?.name || festId)}_${date}.json`, backup);
};

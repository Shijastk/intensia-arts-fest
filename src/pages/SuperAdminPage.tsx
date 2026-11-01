import React, { useState, useEffect } from 'react';
import { ref, get, remove, update } from 'firebase/database';
import { db, auth, functions, googleProvider } from '../config/firebase';
import { Shield, Trash2, Power, PowerOff, Layout, ExternalLink, LogOut, Download } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { downloadFestBackup } from '../utils/supremeAdminBackup';
import { appDialog } from '../components/ui/AppDialog';

export const SuperAdminPage = ({ onEnterFest }: { onEnterFest?: (festId: string) => void }) => {
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [fests, setFests] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [backupFestId, setBackupFestId] = useState<string | null>(null);

  // Super Admin access requires a Google sign-in whose ID token carries the superAdmin
  // custom claim. The claim can only be set server-side (functions/scripts/set-super-admin.mjs)
  // and the database rules check it on every request, so nothing in the browser can fake it.
  const checkSuperAdmin = async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    const token = await user.getIdTokenResult(true);
    return token.signInProvider === 'google.com' && token.claims.superAdmin === true;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async () => {
      try {
        const ok = await checkSuperAdmin();
        setIsAuthenticated(ok);
        if (ok) fetchData(); else setLoading(false);
      } catch (err) {
        console.error('Super Admin session check failed:', err);
        setIsAuthenticated(false);
        setLoading(false);
      } finally {
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await signInWithPopup(auth, googleProvider);
      if (!(await checkSuperAdmin())) {
        await signOut(auth);
        appDialog.alert('This Google account is not authorised for Supreme Admin access.');
        return;
      }
      setIsAuthenticated(true);
      fetchData();
    } catch (err: any) {
      appDialog.alert('Supreme Admin Login Failed: ' + err.message);
    }
  };

  const handleMigration = async () => {
    if (migrating) return;
    if (!await appDialog.confirm('Run the security migration? It hashes every remaining plaintext staff password (staff keep their current passwords) and rebuilds the public results copy. It is safe to run more than once.', { variant: 'warning', title: 'Run security migration', confirmText: 'Run migration' })) return;
    setMigrating(true);
    try {
      const migrate = httpsCallable(functions, 'migrateSecurity', { timeout: 540000 });
      const { data } = await migrate({});
      appDialog.alert('Migration finished:\n' + JSON.stringify(data, null, 2), { variant: 'success', title: 'Migration finished' });
      fetchData();
    } catch (err: any) {
      appDialog.alert('Migration failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setMigrating(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    let usersData: any = {};
    let festsData: any = {};
    let fetchError = '';
    try {
      const usersSnap = await get(ref(db, 'users'));
      if (usersSnap.exists()) usersData = usersSnap.val();
    } catch (err: any) {
      console.warn("Permission denied on users node", err);
      fetchError = "The database rejected reading the 'users' list. This account may be missing the superAdmin claim.";
    }
    try {
      const festsSnap = await get(ref(db, 'fests'));
      if (festsSnap.exists()) festsData = festsSnap.val();
    } catch (err: any) {
      console.warn("Permission denied on fests node", err);
      fetchError = "The database rejected reading users and fests. This account may be missing the superAdmin claim.";
    }
    if (fetchError) setErrorMsg(fetchError);
    setFests(festsData);
    const usersList = Object.keys(usersData).map(uid => ({ uid, ...usersData[uid] }));
    const mergedUsers = [...usersList];
    Object.keys(festsData).forEach(festId => {
      const fest = festsData[festId];
      if (fest.adminUid) {
        const exists = mergedUsers.find(u => u.uid === fest.adminUid);
        if (!exists) mergedUsers.push({ uid: fest.adminUid, name: 'Unknown (Fest Creator)', email: 'Unknown', role: 'admin', festId, isActive: true });
      }
    });
    setUsers(mergedUsers);
    setLoading(false);
  };

  const handleDownloadBackup = async (festId: string, festName: string) => {
    if (backupFestId) return;
    setBackupFestId(festId);
    try {
      await downloadFestBackup(festId, festName);
    } catch (error: any) {
      console.error('Fest backup export failed:', error);
      appDialog.alert(`Backup export failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setBackupFestId(null);
    }
  };

  const handleDeactivate = async (uid: string, currentStatus: boolean) => {
    if (await appDialog.confirm(`Are you sure you want to ${currentStatus === false ? 'activate' : 'deactivate'} this user?`, { variant: currentStatus === false ? 'primary' : 'danger', title: currentStatus === false ? 'Activate user' : 'Deactivate user', confirmText: currentStatus === false ? 'Activate' : 'Deactivate' })) {
      try {
        await update(ref(db, `users/${uid}`), { isActive: currentStatus === false ? true : false });
        fetchData();
      } catch (error: any) {
        appDialog.alert("Action failed! Your Firebase Database rules are blocking writes. Please update the rules in Firebase Console first.");
        console.error('Error updating status', error);
      }
    }
  };

  const handleDelete = async (uid: string, festId: string) => {
    if (await appDialog.confirm('Are you SURE you want to completely DELETE this user? If they have a fest, it will be orphaned unless you delete it manually.', { variant: 'danger', title: 'Delete user', confirmText: 'Delete user' })) {
      try {
        await remove(ref(db, `users/${uid}`));
        fetchData();
      } catch (error: any) {
        appDialog.alert("Action failed! Your Firebase Database rules are blocking deletes. Please update the rules in Firebase Console first.");
        console.error('Error deleting user', error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
          <div className="flex justify-center mb-6"><Shield className="h-16 w-16 text-indigo-500" /></div>
          <h2 className="text-2xl font-bold text-white text-center mb-6">Supreme Admin Access</h2>
          <button type="submit" disabled={authChecking} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors">{authChecking ? 'Checking session...' : 'Sign in with Google'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3"><Shield className="h-8 w-8 text-indigo-500" /><h1 className="text-3xl font-bold">Supreme Admin Dashboard</h1></div>
          <div className="flex gap-4">
            <button onClick={fetchData} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700">Refresh Data</button>
            <button onClick={handleMigration} disabled={migrating} className="px-4 py-2 bg-amber-900/40 hover:bg-amber-800/50 text-amber-200 disabled:opacity-50 rounded-lg text-sm transition-colors border border-amber-800">{migrating ? 'Migrating...' : 'Run Security Migration'}</button>
            <button onClick={async () => { await signOut(auth); setIsAuthenticated(false); }} className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg text-sm transition-colors border border-red-900"><LogOut className="h-4 w-4" />Logout</button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading system data...</div>
        ) : errorMsg ? (
          <div className="p-8 bg-red-900/50 border border-red-500 rounded-xl text-red-200"><h3 className="font-bold text-lg mb-2">Database Error</h3><p>{errorMsg}</p><p className="mt-4 text-sm text-red-300">Make sure this account has the superAdmin claim (sign out and in again after it is granted).</p></div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-900/50 border-b border-gray-700"><th className="p-4 font-semibold text-gray-300">User Info</th><th className="p-4 font-semibold text-gray-300">Role</th><th className="p-4 font-semibold text-gray-300">Fest Details</th><th className="p-4 font-semibold text-gray-300">Joined</th><th className="p-4 font-semibold text-gray-300">Status</th><th className="p-4 font-semibold text-gray-300 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => {
                    const fest = user.festId ? fests[user.festId] : null;
                    const isActive = user.isActive !== false;
                    return (
                      <tr key={user.uid} className="hover:bg-gray-700/30 transition-colors">
                        <td className="p-4"><div className="font-medium text-white">{user.name || 'No Name'}</div><div className="text-sm text-gray-400">{user.email}</div><div className="text-xs text-gray-500 font-mono mt-1" title="User ID">{user.uid}</div></td>
                        <td className="p-4"><span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs font-medium uppercase tracking-wider">{user.role || 'user'}</span></td>
                        <td className="p-4">
                          {fest ? (
                            <div><div className="font-medium text-white flex items-center gap-2"><Layout className="h-4 w-4 text-indigo-400" />{fest.name}</div><div className="text-xs text-gray-500 font-mono mt-1 mb-2" title="Fest ID">{user.festId}</div><div className="flex gap-3 text-xs"><div className="bg-gray-700 px-2 py-1 rounded"><span className="text-gray-400">Programs: </span><span className="font-bold text-white">{fest.programs ? Object.keys(fest.programs).length : 0}</span></div><div className="bg-gray-700 px-2 py-1 rounded"><span className="text-gray-400">Entries: </span><span className="font-bold text-white">{fest.programs ? Object.values(fest.programs).reduce((acc: number, prog: any) => { let count = 0; if (prog.teams) prog.teams.forEach((team: any) => { if (team.participants) count += team.participants.length; }); return acc + count; }, 0) : 0}</span></div></div></div>
                          ) : <span className="text-gray-500 italic">No Fest Created</span>}
                        </td>
                        <td className="p-4 text-sm text-gray-400">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{isActive ? 'Active' : 'Deactivated'}</span></td>
                        <td className="p-4"><div className="flex items-center justify-end gap-2">
                          {fest && <>
                            <button onClick={() => handleDownloadBackup(user.festId, fest.name || user.festId)} disabled={backupFestId === user.festId} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-wait rounded-lg transition-colors flex items-center justify-center" title="Download complete fest database as JSON"><Download className="h-4 w-4" /></button>
                            <button onClick={() => { if (onEnterFest && user.festId) { onEnterFest(user.festId); navigate(`/fests/${user.festId}/dashboard`); } }} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center justify-center" title="Enter Fest Dashboard as Admin"><ExternalLink className="h-4 w-4" /></button>
                          </>}
                          <button onClick={() => handleDeactivate(user.uid, isActive)} className={`p-2 rounded-lg transition-colors flex items-center justify-center ${isActive ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`} title={isActive ? "Deactivate User" : "Activate User"}>{isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</button>
                          <button onClick={() => handleDelete(user.uid, user.festId)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center" title="Delete User"><Trash2 className="h-4 w-4" /></button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {users.length === 0 && !loading && <div className="p-8 text-center text-gray-400">No users found in the system.</div>}
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Staff } from '../types';

interface StaffCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  festId: string;
  onSave: (staffData: Omit<Staff, 'id'>, editId?: string) => Promise<void>;
  editingStaff?: Staff | null;
}

export const StaffCredentialModal: React.FC<StaffCredentialModalProps> = ({
  isOpen,
  onClose,
  festId,
  onSave,
  editingStaff
}) => {
  const [role, setRole] = useState<'GREEN_ROOM' | 'JUDGE' | 'TEAM_LEADER'>('GREEN_ROOM');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [specificName, setSpecificName] = useState(''); // Used for Stage/Panel Name or Team Name
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingStaff) {
      setRole(editingStaff.role);
      setUsername(editingStaff.username);
      setPassword(editingStaff.password || '');
      // Determine what to show based on role
      setSpecificName(
        editingStaff.role === 'JUDGE' ? (editingStaff.judgePanel || editingStaff.panelName || editingStaff.stage || '') :
        editingStaff.role === 'TEAM_LEADER' ? (editingStaff.teamName || editingStaff.panelName || '') : ''
      );
    } else {
      setRole('GREEN_ROOM');
      setUsername('');
      setPassword('');
      setSpecificName('');
    }
  }, [editingStaff, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Base data
    const staffData: any = {
      festId,
      role,
      username,
      password
    };

    // Add role-specific data
    if (role === 'JUDGE') staffData.judgePanel = specificName;
    if (role === 'TEAM_LEADER') staffData.teamName = specificName;

    await onSave(staffData, editingStaff?.id);
    setIsSubmitting(false);
    onClose();
  };

  const generateCredentials = () => {
    const randomPass = Math.random().toString(36).slice(-6);
    setPassword(randomPass);
    if (!username) {
      setUsername(`${role.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
            {editingStaff ? 'Edit Staff Account' : 'Create Staff Account'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Select Role</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as any);
                setSpecificName(''); // Reset the field when role changes
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-bold"
              required
            >
              <option value="GREEN_ROOM">Green Room Manager</option>
              <option value="JUDGE">Judge Panel</option>
              <option value="TEAM_LEADER">Team Leader</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Password</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" required />
            </div>
          </div>
          
          <div className="flex justify-end mt-1">
            <button type="button" onClick={generateCredentials} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase underline">
              Auto-Generate Credentials
            </button>
          </div>

          {/* Conditional Input based on Role */}
          {role === 'JUDGE' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Assigned Stage / Panel Name
              </label>
              <input type="text" value={specificName} onChange={(e) => setSpecificName(e.target.value)} placeholder="e.g. Stage 1" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" required />
            </div>
          )}

          {role === 'TEAM_LEADER' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Team Name
              </label>
              <input type="text" value={specificName} onChange={(e) => setSpecificName(e.target.value)} placeholder="e.g. Prudentia" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" required />
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all hover:bg-slate-200">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
               {isSubmitting ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Create Staff')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
import React, { useEffect } from 'react';
import { Program } from '../types';

interface ProgramFormModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  editingProgram: Program | null;
  isGroup: boolean;
  setIsGroup: (val: boolean) => void;
  categories: string[];
  zones: string[];
}

export const ProgramFormModal: React.FC<ProgramFormModalProps> = ({
  show,
  onClose,
  onSave,
  editingProgram,
  isGroup,
  setIsGroup,
  categories,
  zones
}) => {
  useEffect(() => {
    if (editingProgram) {
      setIsGroup(editingProgram.isGroup || false);
    } else {
      setIsGroup(false);
    }
  }, [editingProgram, setIsGroup, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
            {editingProgram ? 'Edit Program' : 'Create New Program'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">✕</button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={onSave} className="flex flex-col overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Program Name</label>
              <input type="text" name="name" defaultValue={editingProgram?.name} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" placeholder="e.g. Oppana, Duffmuttu" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Category</label>
                <select name="category" defaultValue={editingProgram?.category || ''} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600">
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Zone <span className="text-slate-400 normal-case font-medium">(optional)</span></label>
                <select name="zone" defaultValue={editingProgram?.zone || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600">
                  <option value="">— No Zone —</option>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>

            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Duration (in minutes)</label>
              <input type="number" name="duration" min="5" defaultValue={editingProgram?.duration || 30} required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" placeholder="e.g. 30" />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Time and venue will be assigned later in the Schedule Manager.</p>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600" />
                <span className="text-xs font-black text-slate-800 uppercase">Is this a Group Event?</span>
              </label>

              {isGroup ? (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Total Groups Allowed</label>
                    <input type="number" name="groupCount" min="1" defaultValue={editingProgram?.groupCount || ''} required={isGroup} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" placeholder="Total slots" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Members per Group</label>
                    <input type="number" name="membersPerGroup" min="2" defaultValue={editingProgram?.membersPerGroup || ''} required={isGroup} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" placeholder="E.g., 7 for Oppana" />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Total Participants Allowed</label>
                  <input type="number" name="participantsCount" min="1" defaultValue={editingProgram?.participantsCount || ''} required={!isGroup} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" placeholder="Total single slots" />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all">
              {editingProgram ? 'Save Changes' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { GlobalStudent } from '../types';

interface StudentBulkEntryModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (students: Omit<GlobalStudent, 'id' | 'festId'>[]) => Promise<boolean>;
  availableTeams: string[];
  existingChestNumbers?: string[];
}

export const StudentBulkEntryModal: React.FC<StudentBulkEntryModalProps> = ({
  show,
  onClose,
  onSave,
  availableTeams,
  existingChestNumbers = [],
}) => {
  const [teamName, setTeamName] = useState('');
  const [startChest, setStartChest] = useState('');
  const [studentNames, setStudentNames] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const startNum = parseInt(startChest);
    if (isNaN(startNum)) {
      setError('Starting chest number must be a valid number.');
      return;
    }

    const names = studentNames.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length === 0) {
      setError('Please enter at least one student name.');
      return;
    }

    if (!teamName.trim()) {
      setError('Team Name is required.');
      return;
    }

    let currentChest = startNum;
    const studentsToSave = names.map((name) => {
      while (existingChestNumbers.includes(currentChest.toString())) {
        currentChest++;
      }
      const assignedChest = currentChest.toString();
      currentChest++;
      return {
        name,
        teamName: teamName.trim(),
        chestNumber: assignedChest,
      };
    });

    setIsSaving(true);

    const success = await onSave(studentsToSave);
    if (success) {
      setTeamName('');
      setStartChest('');
      setStudentNames('');
      onClose();
    } else {
      setError('Failed to save students. Please try again.');
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
            Bulk Add Students
          </h3>
          <button type="button" onClick={onClose} disabled={isSaving} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">✕</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Team Name (College)</label>
                <input 
                  type="text" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  list="team-suggestions"
                  required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" 
                  placeholder="Select or type new..." 
                />
                <datalist id="team-suggestions">
                  {availableTeams.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Starting Chest No.</label>
                <input 
                  type="number" 
                  value={startChest}
                  onChange={(e) => setStartChest(e.target.value)}
                  required 
                  min="1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600" 
                  placeholder="e.g. 1001" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-[10px] font-bold text-slate-600 uppercase">Student Names</label>
                 <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">One name per line</span>
              </div>
              <textarea 
                 value={studentNames}
                 onChange={(e) => setStudentNames(e.target.value)}
                 required 
                 rows={10}
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-mono" 
                 placeholder="John Doe&#10;Jane Smith&#10;Alice Johnson" 
              />
              {(() => {
                const startNum = parseInt(startChest);
                const namesList = studentNames.split('\n').map(n => n.trim()).filter(n => n);
                let hasSkipped = false;
                let currentChest = startNum;
                
                if (!isNaN(startNum) && namesList.length > 0) {
                  for (let i = 0; i < namesList.length; i++) {
                    if (existingChestNumbers.includes(currentChest.toString())) {
                      hasSkipped = true;
                    }
                    while (existingChestNumbers.includes(currentChest.toString())) {
                      currentChest++;
                    }
                    currentChest++;
                  }
                }

                if (hasSkipped) {
                  return (
                    <p className="text-[10px] text-amber-500 mt-1 font-bold leading-tight">
                      Warning: Some chest numbers were already taken and have been automatically skipped.
                    </p>
                  );
                }
                return (
                  <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">
                    Chest numbers will be auto-assigned starting from {startChest || 'X'}. E.g. First name gets {startChest || 'X'}, second gets {startChest ? parseInt(startChest) + 1 : 'X+1'}, etc.
                  </p>
                );
              })()}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2">
              {isSaving ? 'Saving...' : 'Save Students'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

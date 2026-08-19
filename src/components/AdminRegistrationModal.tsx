import React, { useState, useEffect, useMemo } from 'react';
import { Program, Staff } from '../types';

interface AdminRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  allPrograms: Program[];
  staffs?: Staff[];
  onSave: (teamName: string, participantName: string, chestNumber: string) => Promise<boolean>;
}

export const AdminRegistrationModal: React.FC<AdminRegistrationModalProps> = ({ isOpen, onClose, program, allPrograms, staffs = [], onSave }) => {
  const [teamName, setTeamName] = useState('');
  const [isNewTeam, setIsNewTeam] = useState(false);
  const [isNewParticipant, setIsNewParticipant] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [chestNumber, setChestNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Extract all unique participants and teams across all programs
  const existingData = useMemo(() => {
    const participants = new Map<string, { name: string; teamName: string }>();
    const teams = new Set<string>();
    
    // Always include teams explicitly created in the Staff list!
    staffs.forEach(s => {
      if (s.role === 'TEAM_LEADER' && s.teamName) {
        teams.add(s.teamName.trim());
      }
    });

    allPrograms.forEach(p => {
      (p.teams || []).forEach(t => {
        if (t.teamName) teams.add(t.teamName.trim());
        (t.participants || []).forEach(part => {
          if (part.chestNumber && !participants.has(part.chestNumber)) {
            participants.set(part.chestNumber, { name: part.name, teamName: (t.teamName || '').trim() });
          }
        });
      });
    });
    return { participants, teams: Array.from(teams).sort() };
  }, [allPrograms, staffs]);

  const teamParticipants = useMemo(() => {
    if (!teamName || isNewTeam) return [];
    return Array.from(existingData.participants.entries())
      .filter(([chest, data]) => data.teamName.toLowerCase() === teamName.trim().toLowerCase())
      .map(([chest, data]) => ({ chestNumber: chest, name: data.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamName, isNewTeam, existingData.participants]);

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setTeamName('');
      setIsNewTeam(false);
      setIsNewParticipant(false);
      setParticipantName('');
      setChestNumber('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teamName.trim() || !participantName.trim() || !chestNumber.trim()) {
      setError('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSave(teamName.trim(), participantName.trim(), chestNumber.trim());
      if (success) {
        onClose();
      } else {
        setError('Failed to add registration. The chest number might already exist in this program.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Manual Registration</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 truncate">For: {program.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold text-center">
              {error}
            </div>
          )}
          
          {/* 1. Team Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">1. Team Name / College</label>
            {!isNewTeam ? (
              <select
                value={teamName}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '__NEW__') {
                    setIsNewTeam(true);
                    setTeamName('');
                    setIsNewParticipant(true); // Must be new participant if new team
                    setParticipantName('');
                    setChestNumber('');
                  } else {
                    setTeamName(val);
                    setParticipantName('');
                    setChestNumber('');
                    setIsNewParticipant(false);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-bold appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select Team Name...</option>
                {existingData.teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
                <option value="__NEW__" className="font-bold text-indigo-600">+ Add New Team...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="Type new team name..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-bold"
                  required
                  autoFocus
                />
                <button 
                  type="button" 
                  onClick={() => { setIsNewTeam(false); setTeamName(''); }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* 2. Participant Selection / Entry */}
          {teamName && (
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">2. Participant</label>
              
              {!isNewParticipant && !isNewTeam ? (
                <select
                  value={chestNumber}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '__NEW__') {
                      setIsNewParticipant(true);
                      setChestNumber('');
                      setParticipantName('');
                    } else {
                      const selected = teamParticipants.find(p => p.chestNumber === val);
                      if (selected) {
                        setChestNumber(selected.chestNumber);
                        setParticipantName(selected.name);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-bold appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Participant...</option>
                  {teamParticipants.map(p => (
                    <option key={p.chestNumber} value={p.chestNumber}>
                      {p.name} (Chest #{p.chestNumber})
                    </option>
                  ))}
                  <option value="__NEW__" className="font-bold text-indigo-600">+ Add New Participant...</option>
                </select>
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-indigo-600">New Participant Details</span>
                    {!isNewTeam && (
                      <button 
                        type="button" 
                        onClick={() => setIsNewParticipant(false)}
                        className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Chest Number</label>
                    <input
                      type="text"
                      value={chestNumber}
                      onChange={e => setChestNumber(e.target.value)}
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Participant Name(s)</label>
                    <input
                      type="text"
                      value={participantName}
                      onChange={e => setParticipantName(e.target.value)}
                      placeholder={program.isGroup ? "e.g. John Doe, Jane Smith..." : "e.g. John Doe"}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 font-bold"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all hover:bg-slate-200">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
               {isSubmitting ? 'Registering...' : 'Register Participant'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

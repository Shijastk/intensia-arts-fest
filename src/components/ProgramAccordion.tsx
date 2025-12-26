
import React, { useState } from 'react';
import { Program, ProgramStatus } from '../types';
import { calculatePoints } from '../utils/pointsCalculator';

interface ProgramAccordionProps {
  program: Program;
  onUpdateStatus: (id: string, status: ProgramStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (program: Program) => void;
  onSelectParticipant: (name: string) => void;
  onPublish: (id: string) => void; // Controls Green Room Visibility
  onPublishResult: (id: string) => void; // Controls Public Result Visibility
  onRequestCancel: (id: string) => void;
  onUpdateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
}

export const ProgramAccordion: React.FC<ProgramAccordionProps> = ({
  program,
  onUpdateStatus,
  onDelete,
  onEdit,
  onSelectParticipant,
  onPublish,
  onPublishResult,
  onRequestCancel,
  onUpdateProgram
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const getStatusColor = (status: ProgramStatus) => {
    switch (status) {
      case ProgramStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case ProgramStatus.JUDGING: return 'bg-purple-100 text-purple-700 border-purple-200';
      case ProgramStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case ProgramStatus.CANCELLED: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as ProgramStatus;

    if (program.status === ProgramStatus.JUDGING && (nextStatus === ProgramStatus.PENDING || nextStatus === ProgramStatus.CANCELLED)) {
      setStatusError('Use "Recall (GR)" to change status from JUDGING');
      setTimeout(() => setStatusError(null), 3000);
      return;
    }

    if (nextStatus === ProgramStatus.CANCELLED) {
      onRequestCancel(program.id);
    } else {
      onUpdateStatus(program.id, nextStatus);
    }
  };

  // State for Admin Score Editing
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [editedTeams, setEditedTeams] = useState(program.teams);

  // Sync state if program updates externally
  React.useEffect(() => {
    setEditedTeams(program.teams);
  }, [program]);

  const handleScoreEdit = (teamId: string, chestNumber: string, field: 'score' | 'grade' | 'points' | 'rank', value: string) => {
    setEditedTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;

      if (!program.isGroup) {
        // Individual Program: Update specific participant
        const updatedParticipants = t.participants.map(p => {
          if (p.chestNumber === chestNumber) {
            const updates: any = { [field]: field === 'grade' ? value : Number(value) };

            // Auto-calculate points if score or grade changes
            if (field === 'score' || field === 'grade') {
              const newScore = field === 'score' ? Number(value) : (p.score || 0);
              const newGrade = field === 'grade' ? value : (p.grade || '');
              updates.points = calculatePoints(newScore, newGrade, false);
            }

            return { ...p, ...updates };
          }
          return p;
        });
        return { ...t, participants: updatedParticipants };
      } else {
        // Group Program
        const pIndex = t.participants.findIndex(p => p.chestNumber === chestNumber);
        if (pIndex === -1) return t;

        const limit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;

        // Determine chunk range
        // If standard group (not split), chunk is entire array
        // If split group, chunk is [start, end)
        let startIndex = 0;
        let endIndex = t.participants.length;

        if (t.participants.length > limit) {
          const chunkIndex = Math.floor(pIndex / limit);
          startIndex = chunkIndex * limit;
          endIndex = Math.min(startIndex + limit, t.participants.length);
        }

        const updatedParticipants = t.participants.map((p, idx) => {
          if (idx >= startIndex && idx < endIndex) {
            return {
              ...p,
              [field]: field === 'grade' ? value : Number(value)
            };
          }
          return p;
        });

        // Update Team Level fields only if it's NOT a split team scenario?
        // Actually, if we update a chunk, we shouldn't overwrite the team score with a partial score.
        // We will leave team.score as is for split teams to avoid ambiguity.
        // But for standard teams (one chunk), we update team score too.

        const isSplit = t.participants.length > limit;
        const updates: any = { participants: updatedParticipants };

        if (!isSplit) {
          updates[field] = field === 'grade' ? value : Number(value);
        }

        return { ...t, ...updates };
      }
    }));
  };

  const saveScores = async () => {
    if (!onUpdateProgram) {
      alert("Update function not available. Please contact support.");
      return;
    }

    const success = await onUpdateProgram(program.id, { teams: editedTeams });
    if (success) {
      setIsEditingScores(false);
      // Optional: Show success toast (not implemented)
    } else {
      alert("Failed to save scores to database.");
    }
  };

  return (
    <div className={`mb-3 transition-all duration-300 ${isOpen ? 'ring-2 ring-indigo-500/20' : ''}`}>
      <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-300 transition-colors">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 gap-4">
          {/* ... (Existing Header Button Code) ... */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex items-center space-x-4 text-left"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${program.isPublished ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
              {program.isPublished ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">{program.name}</h3>
                {program.isResultPublished && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Result Live</span>}
                {program.isPublished && <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">In Green Room</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{program.category}</span>
                {program.judgePanel && (
                  <span className="flex items-center text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 rounded-md border border-orange-100">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {program.judgePanel}
                  </span>
                )}
                {program.startTime && (
                  <span className="flex items-center text-[10px] text-indigo-600 font-bold">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {program.startTime}
                  </span>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center space-x-2">
            {/* ... (Existing Buttons) ... */}
            <button
              onClick={() => onPublish(program.id)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5 ${program.isPublished
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 hover:bg-indigo-200'
                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                }`}
              title={program.isPublished ? 'Click to recall from Green Room' : 'Click to send to Green Room'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {program.isPublished ? 'Recall (GR)' : 'Send to GR'}
            </button>

            {/* 2. PUBLIC RESULT TOGGLE (Only if Completed) */}
            {program.status === ProgramStatus.COMPLETED && (
              <>
                <button
                  onClick={() => {
                    if (window.confirm('Send this program back to judges for re-evaluation? This will allow judges to edit scores again.')) {
                      onUpdateStatus(program.id, ProgramStatus.JUDGING);
                    }
                  }}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                  title="Send back to judges for re-evaluation"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Re-evaluate
                </button>

                <button
                  onClick={() => onPublishResult(program.id)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5 ${program.isResultPublished
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                    }`}
                  title={program.isResultPublished ? 'Click to unpublish results' : 'Click to publish results to website'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {program.isResultPublished ? 'Result Live' : 'Publish Result'}
                </button>
              </>
            )}

            {statusError && <span className="text-[10px] text-red-600 font-bold animate-pulse whitespace-nowrap">{statusError}</span>}
            <select
              value={program.status}
              onChange={handleStatusChange}
              disabled={program.status === ProgramStatus.COMPLETED}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-colors ${getStatusColor(program.status)} text-slate-900 ${program.status === ProgramStatus.COMPLETED ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {program.status === ProgramStatus.COMPLETED && <option value={ProgramStatus.COMPLETED}>COMPLETED</option>}
              <option value={ProgramStatus.JUDGING}>JUDGING</option>
              <option value={ProgramStatus.PENDING}>PENDING</option>
              <option value={ProgramStatus.CANCELLED}>CANCELLED</option>
            </select>

            <button onClick={() => onEdit(program)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Schedule / Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>

            <button onClick={() => onDelete(program.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>

            <button onClick={() => setIsOpen(!isOpen)} className="p-1">
              <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="bg-slate-50 border-t border-slate-200 p-4">
            {/* EDIT SCORE TOGGLE FOR ADMINS */}
            {program.status === ProgramStatus.COMPLETED && (
              <div className="flex justify-end mb-3">
                {!isEditingScores ? (
                  <button
                    onClick={() => { setIsEditingScores(true); setEditedTeams(program.teams); }}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit Results
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIsEditingScores(false); setEditedTeams(program.teams); }}
                      className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveScores}
                      className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto bg-white rounded-lg border border-slate-100 shadow-sm">
              <table className="w-full text-left text-[11px] sm:text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2">Chest No / Code</th>
                    <th className="px-3 py-2">Team & Participants</th>
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2 text-center">Score</th>
                    <th className="px-3 py-2 text-center">Grade</th>
                    <th className="px-3 py-2 text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editedTeams.length > 0 ? (
                    // Logic Difference: Individual (Row per Participant) vs Group (Row per Team)
                    !program.isGroup ? (
                      // INDIVIDUAL ITEM: Flatten participants
                      editedTeams.flatMap(team => team.participants.map(p => ({ ...p, teamId: team.id, teamName: team.teamName }))).map((participant, flatIdx) => (
                        <tr key={`${participant.teamId}-${participant.chestNumber}-${flatIdx}`} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{participant.chestNumber}</span>
                              <span className="text-slate-400 text-[9px]">Code: {participant.codeLetter || '-'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-bold text-slate-700">{participant.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{participant.teamName}</p>
                            {/* Delete Participant Button */}
                            {(program.status !== ProgramStatus.COMPLETED || isEditingScores) && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to remove ${participant.name} from this program?`)) {
                                    // Find the team
                                    const team = program.teams.find(t => t.id === participant.teamId);
                                    if (team) {
                                      const newParticipants = team.participants.filter(p => p.chestNumber !== participant.chestNumber);
                                      let newTeams;
                                      if (newParticipants.length === 0) {
                                        // Remove empty team
                                        newTeams = program.teams.filter(t => t.id !== participant.teamId);
                                      } else {
                                        // Update team
                                        newTeams = program.teams.map(t =>
                                          t.id === participant.teamId ? { ...t, participants: newParticipants } : t
                                        );
                                      }
                                      if (onUpdateProgram) {
                                        await onUpdateProgram(program.id, { teams: newTeams });
                                        setEditedTeams(newTeams);
                                      }
                                    }
                                  }
                                }}
                                className="mt-1 text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 w-fit"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Remove
                              </button>
                            )}
                          </td>
                          {/* Rank */}
                          <td className="px-3 py-3 text-center text-red-500">
                            {`#${participant.rank || '-'}`}
                          </td>
                          {/* Score */}
                          <td className="px-3 py-3 text-center">
                            {isEditingScores ? (
                              <input
                                type="number"
                                step="0.1"
                                className="w-16 text-center border border-slate-300 rounded p-1"
                                value={participant.score || ''}
                                onChange={(e) => handleScoreEdit(participant.teamId, participant.chestNumber, 'score', e.target.value)}
                              />
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-bold text-slate-800">
                                  {participant.score !== undefined ? participant.score :
                                    (editedTeams.find(t => t.id === participant.teamId)?.score || '-')}
                                </span>
                              ) : '-'
                            )}
                          </td>
                          {/* Grade */}
                          <td className="px-3 py-3 text-center">
                            {isEditingScores ? (
                              <input
                                type="text"
                                className="w-12 text-center border border-slate-300 rounded p-1 uppercase"
                                value={participant.grade || ''}
                                onChange={(e) => handleScoreEdit(participant.teamId, participant.chestNumber, 'grade', e.target.value)}
                              />
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-bold text-emerald-600">{participant.grade || '-'}</span>
                              ) : '-'
                            )}
                          </td>

                          {/* Points */}
                          <td className="px-3 py-3 text-center">
                            {isEditingScores ? (
                              (() => {
                                const score = participant.score || 0;
                                const grade = participant.grade || '';
                                const points = calculatePoints(score, grade, false);
                                return (
                                  <div className="w-12 text-center bg-slate-100 border border-slate-300 rounded p-1 font-bold text-emerald-600">
                                    {points}
                                  </div>
                                );
                              })()
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-bold text-slate-800">{participant.points || '0'}</span>
                              ) : '-'
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      // GROUP ITEM: Row per Team (or Sub-Team if split)
                      editedTeams.flatMap(team => {
                        const limit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;
                        if (team.participants.length <= limit) {
                          return [{
                            ...team,
                            displayName: team.teamName,
                            displayScore: team.score,
                            displayGrade: team.grade,
                            displayPoints: team.points
                          }];
                        }

                        // Split logic
                        const subTeams = [];
                        const pList = team.participants;
                        let subIndex = 0;
                        for (let i = 0; i < pList.length; i += limit) {
                          const chunk = pList.slice(i, i + limit);
                          const suffix = String.fromCharCode(65 + subIndex);

                          // Use first participant's data as the "sub-team" data
                          const chunkScore = chunk[0].score;
                          const chunkGrade = chunk[0].grade;
                          const chunkPoints = chunk[0].points;

                          subTeams.push({
                            ...team,
                            participants: chunk,
                            displayName: `${team.teamName} ${suffix}`,
                            displayScore: chunkScore,
                            displayGrade: chunkGrade,
                            displayPoints: chunkPoints,
                            isVirtual: true,
                            virtualId: `${team.id}_sub${subIndex}`
                          });
                          subIndex++;
                        }
                        return subTeams;
                      }).map((team, idx) => (
                        <tr key={team.isVirtual ? team.virtualId : team.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{team.participants[0]?.chestNumber || 'N/A'}</span>
                              <span className="text-slate-400 text-[9px]">Code: {team.participants[0]?.codeLetter || '-'}</span>
                              {team.isVirtual && <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-1">Split Team</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-bold text-slate-700">{team.displayName}</p>
                            <div className="flex flex-col gap-1 mt-1">
                              {team.participants.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  {p.name}
                                </div>
                              ))}
                            </div>
                            {/* Delete Team Button */}
                            {(program.status !== ProgramStatus.COMPLETED || isEditingScores) && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to remove ${team.displayName} from this program?`)) {
                                    const newTeams = program.teams.filter(t => t.id !== team.id);
                                    if (onUpdateProgram) {
                                      await onUpdateProgram(program.id, { teams: newTeams });
                                      setEditedTeams(newTeams);
                                    }
                                  }
                                }}
                                className="mt-2 text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1 w-fit"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Remove Team
                              </button>
                            )}
                          </td>
                          {/* Rank */}
                          <td className="px-3 py-3 text-center text-red-500">
                            {`#${team.participants[0]?.rank || '-'}`}
                          </td>
                          {/* Score */}
                          <td className="px-3 py-3 text-center">
                            {isEditingScores ? (
                              <div className="flex flex-col items-center gap-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-16 text-center border border-slate-300 rounded p-1"
                                  value={team.displayScore || ''}
                                  onChange={(e) => handleScoreEdit(team.id, team.participants[0].chestNumber, 'score', e.target.value)}
                                />
                              </div>
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-bold text-slate-800">{team.displayScore || '-'}</span>
                              ) : '-'
                            )}
                          </td>
                          {/* Grade */}
                          <td className="px-3 py-3 text-center">
                            {isEditingScores ? (
                              <input
                                type="text"
                                className="w-12 text-center border border-slate-300 rounded p-1 uppercase"
                                value={team.displayGrade || ''}
                                onChange={(e) => handleScoreEdit(team.id, team.participants[0].chestNumber, 'grade', e.target.value)}
                              />
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-bold text-emerald-600">{team.displayGrade || '-'}</span>
                              ) : '-'
                            )}
                          </td>
                          {/* Points */}
                          <td className="px-3 py-3 text-center">
                            {isEditingScores ? (
                              (() => {
                                const score = team.displayScore || 0;
                                const grade = team.displayGrade || '';
                                // Check if this is truly a group program for points calculation
                                // The user says "calculate 4 point different", which is exactly 20% of 20 vs 10 maybe?
                                // If calculatePoints(..., true) gives max 20, calculatePoints(..., false) gives max 10.
                                // If the user sees 'less', maybe they expect Group points (20) but getting Individual (10)?
                                // Or vice versa.
                                // Arts Fest rules: Group items max 10, Individual max 5? OR Group 20, Ind 10?
                                // Let's check calculatePoints.ts: const maxPoints = isGroup ? 20 : 10;
                                // So passing 'true' is correct for group items.

                                const points = calculatePoints(score, grade, true); // Always true for this "Group Item" block
                                return (
                                  <div className="w-12 text-center bg-slate-100 border border-slate-300 rounded p-1 font-bold text-emerald-600">
                                    {points}
                                  </div>
                                );
                              })()
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-bold text-slate-800">{team.displayPoints || '0'}</span>
                              ) : '-'
                            )}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No registrations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

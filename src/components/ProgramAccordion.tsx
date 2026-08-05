import React, { useState } from 'react';
import { Program, ProgramStatus } from '../types';
import { calculatePoints } from '../utils/pointsCalculator';

interface ProgramAccordionProps {
  program: Program;
  onUpdateStatus: (id: string, status: ProgramStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (program: Program) => void;
  onSelectParticipant: (name: string) => void;
  onPublish: (id: string) => void;
  onPublishResult: (id: string) => void;
  onRequestCancel: (id: string) => void;
  onUpdateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
}

export const ProgramAccordion: React.FC<ProgramAccordionProps> = ({
  program,
  onUpdateStatus,
  onDelete,
  onEdit,
  onPublish,
  onPublishResult,
  onRequestCancel,
  onUpdateProgram
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Custom alert / confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title?: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    message: ''
  });

  const showAlert = (message: string, title?: string) => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      title,
      message
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmVariant: 'danger' | 'warning' | 'primary' = 'primary',
    confirmText = 'Confirm'
  ) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      confirmVariant,
      onConfirm
    });
  };

  const getStatusColor = (status: ProgramStatus) => {
    switch (status) {
      case ProgramStatus.COMPLETED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case ProgramStatus.JUDGING:
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case ProgramStatus.PENDING:
        return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
      case ProgramStatus.CANCELLED:
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Guard removed! Handled with Custom Confirmation Dialog.
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as ProgramStatus;

    if (nextStatus === ProgramStatus.CANCELLED) {
      showConfirm(
        'Cancel Program',
        `Are you sure you want to cancel "${program.name}"?`,
        () => onRequestCancel(program.id),
        'danger',
        'Yes, Cancel'
      );
      return;
    }

    if (program.status === ProgramStatus.JUDGING && nextStatus === ProgramStatus.PENDING) {
      showConfirm(
        'Recall Program',
        `Moving "${program.name}" back to PENDING will recall it from the Judges Panel. Do you want to proceed?`,
        () => onUpdateStatus(program.id, nextStatus),
        'warning',
        'Recall'
      );
      return;
    }

    onUpdateStatus(program.id, nextStatus);
  };

  const [isEditingScores, setIsEditingScores] = useState(false);
  const [editedTeams, setEditedTeams] = useState(program.teams || []);

  React.useEffect(() => {
    setEditedTeams(program.teams || []);
  }, [program]);

  const handleScoreEdit = (teamId: string, chestNumber: string, field: 'score' | 'grade', value: string) => {
    setEditedTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      if (!program.isGroup) {
        const updatedParticipants = (t.participants || []).map(p => {
          if (p.chestNumber === chestNumber) {
            const updates: any = { [field]: field === 'grade' ? value : Number(value) };
            return { ...p, ...updates };
          }
          return p;
        });
        return { ...t, participants: updatedParticipants };
      } else {
        const pList = t.participants || [];
        const pIndex = pList.findIndex(p => p.chestNumber === chestNumber);
        if (pIndex === -1) return t;
        const limit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;
        
        let startIndex = 0;
        let endIndex = pList.length;
        if (pList.length > limit) {
          const chunkIndex = Math.floor(pIndex / limit);
          startIndex = chunkIndex * limit;
          endIndex = Math.min(startIndex + limit, pList.length);
        }

        const updatedParticipants = pList.map((p, idx) => {
          if (idx >= startIndex && idx < endIndex) {
            return { ...p, [field]: field === 'grade' ? value : Number(value) };
          }
          return p;
        });

        const isSplit = pList.length > limit;
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
      showAlert("Update function not available. Please contact support.", "System Alert");
      return;
    }

    let allParticipants = editedTeams.flatMap(team => 
      (team.participants || []).map(p => ({ ...p, teamId: team.id }))
    );

    allParticipants.sort((a, b) => (b.score || 0) - (a.score || 0));

    let currentRank = 1;
    for (let i = 0; i < allParticipants.length; i++) {
      if (i > 0 && (allParticipants[i].score || 0) < (allParticipants[i - 1].score || 0)) {
        currentRank = i + 1;
      }
      allParticipants[i].rank = currentRank;
      allParticipants[i].points = calculatePoints(
        allParticipants[i].score || 0, 
        allParticipants[i].grade || '', 
        program.isGroup, 
        currentRank
      );
    }

    const finalizedTeams = editedTeams.map(team => {
      const updatedParticipants = (team.participants || []).map(p => {
        const calc = allParticipants.find(ap => ap.chestNumber === p.chestNumber);
        return calc ? { ...p, rank: calc.rank, points: calc.points } : p;
      });

      const bestParticipant = updatedParticipants.reduce((prev, curr) => (prev.score || 0) > (curr.score || 0) ? prev : curr, updatedParticipants[0] || {} as any);

      return {
        ...team,
        participants: updatedParticipants,
        score: bestParticipant?.score || 0,
        grade: bestParticipant?.grade || '',
        rank: bestParticipant?.rank || 0,
        points: program.isGroup ? (updatedParticipants[0]?.points || 0) : updatedParticipants.reduce((sum, part) => sum + (part.points || 0), 0)
      };
    });

    const success = await onUpdateProgram(program.id, { teams: finalizedTeams });
    if (success) {
      setIsEditingScores(false);
    } else {
      showAlert("Failed to save scores to database.", "Error");
    }
  };

  return (
    <div className={`mb-3 transition-all duration-300 bg-white border rounded-xl overflow-hidden ${isOpen ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200'}`}>
      <div className="w-full shadow-sm hover:border-indigo-300 transition-colors">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3.5 md:p-4 gap-3">
          <button onClick={() => setIsOpen(!isOpen)} className="flex-1 flex items-center space-x-3 text-left min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border bg-slate-50 text-slate-400 border-slate-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            
            {/* MOBILE LAYOUT */}
            <div className="lg:hidden min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 truncate">{program.name}</h3>
                {program.isResultPublished && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Result Live
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{program.category}</span>
                {program.judgePanel && (
                  <span className="flex items-center text-[11px] text-amber-700 font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {program.judgePanel}
                  </span>
                )}
              </div>
            </div>

            {/* DESKTOP TABLE LAYOUT (Aligns with ProgramList headers) */}
            <div className="hidden lg:flex flex-1 items-center gap-4 text-xs">
                 <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 truncate uppercase">{program.name}</span>
                        {program.judgePanel && (
                          <span className="flex items-center text-[9px] text-amber-700 font-bold px-1.5 py-0.5 rounded-sm bg-amber-50 border border-amber-200 uppercase tracking-widest flex-shrink-0">
                            <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {program.judgePanel}
                          </span>
                        )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{program.id.substring(0,8)}</span>
                 </div>
                 
                 <div className="w-[100px] flex justify-center flex-shrink-0">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${program.category.toLowerCase() === 'music' ? 'bg-indigo-50 text-indigo-600' : program.category.toLowerCase() === 'dance' ? 'bg-purple-50 text-purple-600' : program.category.toLowerCase() === 'fine arts' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                        {program.category}
                    </span>
                 </div>
                 
                 <div className="w-[100px] flex justify-center flex-shrink-0">
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest ${getStatusColor(program.status)}`}>
                        {program.status}
                    </span>
                 </div>
            </div>
          </button>
          
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-2 flex-shrink-0 whitespace-nowrap">
            {/* Blue Button: Send to GR / Recall (GR) with Custom Confirm */}
            <button
              onClick={() => {
                if (program.isPublished) {
                  showConfirm(
                    'Recall from GR',
                    `Are you sure you want to recall "${program.name}" from the Judges Panel / GR?`,
                    () => onPublish(program.id),
                    'warning',
                    'Recall'
                  );
                } else {
                  onPublish(program.id);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                program.isPublished
                  ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {program.isPublished ? 'Recall (GR)' : 'Send to GR'}
            </button>
            
            {program.status === ProgramStatus.COMPLETED && (
              <>
                {/* Orange Button: Re-evaluate */}
                <button
                  onClick={() => {
                    showConfirm(
                      'Re-evaluate Program',
                      'Send this program back to judges for re-evaluation?',
                      () => onUpdateStatus(program.id, ProgramStatus.JUDGING),
                      'warning',
                      'Re-evaluate'
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Re-evaluate
                </button>

                {/* Green Button: Result Live / Publish Result */}
                <button
                  onClick={() => onPublishResult(program.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    program.isResultPublished
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {program.isResultPublished ? 'Result Live' : 'Publish Result'}
                </button>
              </>
            )}

            {/* Status Select */}
            <select
              value={program.status}
              onChange={handleStatusChange}
              disabled={program.status === ProgramStatus.COMPLETED}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer transition-colors ${getStatusColor(program.status)} ${program.status === ProgramStatus.COMPLETED ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {program.status === ProgramStatus.COMPLETED && <option value={ProgramStatus.COMPLETED}>COMPLETED</option>}
              <option value={ProgramStatus.JUDGING}>JUDGING</option>
              <option value={ProgramStatus.PENDING}>PENDING</option>
              <option value={ProgramStatus.CANCELLED}>CANCELLED</option>
            </select>
            
            {/* Action Buttons: Schedule & Delete */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
              <button 
                onClick={() => onEdit(program)} 
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors" 
                title="Schedule / Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              
              {/* Red Action: Delete Program */}
              <button 
                onClick={() => {
                  showConfirm(
                    'Delete Program',
                    `Are you sure you want to delete "${program.name}"? This action cannot be undone.`,
                    () => onDelete(program.id),
                    'danger',
                    'Delete'
                  );
                }} 
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Program"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Accordion Content */}
        {isOpen && (
          <div className="bg-white border-t border-slate-200 p-4 sm:p-5">
            {program.status === ProgramStatus.COMPLETED && (
              <div className="flex justify-end mb-4">
                {!isEditingScores ? (
                  <button
                    onClick={() => { setIsEditingScores(true); setEditedTeams(program.teams || []); }}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit Results
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIsEditingScores(false); setEditedTeams(program.teams || []); }}
                      className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveScores}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Chest No / Code</th>
                    <th className="py-3 px-4">Team & Participants</th>
                    <th className="py-3 px-4 text-center">Rank</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4 text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {editedTeams.length > 0 ? (
                    !program.isGroup ? (
                      editedTeams.flatMap(team => (team.participants || []).map(p => ({ ...p, teamId: team.id, teamName: team.teamName }))).map((participant, flatIdx) => (
                        <tr key={`${participant.teamId}-${participant.chestNumber}-${flatIdx}`} className="group hover:bg-slate-50/50">
                          <td className="py-3 px-4 align-top">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900">{participant.chestNumber}</span>
                              <span className="text-slate-400 text-[10px] mt-0.5">Code: {participant.codeLetter || '-'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <p className="font-bold text-slate-700 text-xs">{participant.teamName}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              {participant.name}
                            </div>
                            {(program.status !== ProgramStatus.COMPLETED || isEditingScores) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirm(
                                    'Remove Participant',
                                    `Are you sure you want to remove ${participant.name} from this program?`,
                                    async () => {
                                      const team = (program.teams || []).find(t => t.id === participant.teamId);
                                      if (team) {
                                        const newParticipants = (team.participants || []).filter(p => p.chestNumber !== participant.chestNumber);
                                        let newTeams;
                                        if (newParticipants.length === 0) {
                                          newTeams = (program.teams || []).filter(t => t.id !== participant.teamId);
                                        } else {
                                          newTeams = (program.teams || []).map(t =>
                                            t.id === participant.teamId ? { ...t, participants: newParticipants } : t
                                          );
                                        }
                                        if (onUpdateProgram) {
                                          await onUpdateProgram(program.id, { teams: newTeams });
                                          setEditedTeams(newTeams);
                                        }
                                      }
                                    },
                                    'danger',
                                    'Remove'
                                  );
                                }}
                                className="mt-2 text-[11px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Remove
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-3.5">
                            <span className="text-rose-500 font-black text-xs">{`#${participant.rank || '-'}`}</span>
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-2.5">
                            {isEditingScores ? (
                              <input
                                type="number"
                                step="0.1"
                                className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={participant.score || ''}
                                onChange={(e) => handleScoreEdit(participant.teamId, participant.chestNumber, 'score', e.target.value)}
                              />
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-black text-slate-900 text-sm">
                                  {participant.score !== undefined ? participant.score :
                                    (editedTeams.find(t => t.id === participant.teamId)?.score || '-')}
                                </span>
                              ) : <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-2.5">
                            {isEditingScores ? (
                              <input
                                type="text"
                                className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={participant.grade || ''}
                                onChange={(e) => handleScoreEdit(participant.teamId, participant.chestNumber, 'grade', e.target.value)}
                              />
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-black text-emerald-600 text-sm">{participant.grade || '-'}</span>
                              ) : <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-3">
                            {program.status === ProgramStatus.COMPLETED && !isEditingScores ? (
                              <span className="font-black text-slate-900 text-sm">{participant.points || '0'}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      editedTeams.flatMap(team => {
                        const limit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;
                        const pList = team.participants || [];
                        if (pList.length <= limit) {
                          return [{
                            ...team,
                            displayName: team.teamName,
                            displayScore: team.score,
                            displayGrade: team.grade,
                            displayPoints: team.points
                          }];
                        }
                        const subTeams = [];
                        let subIndex = 0;
                        for (let i = 0; i < pList.length; i += limit) {
                          const chunk = pList.slice(i, i + limit);
                          const suffix = String.fromCharCode(65 + subIndex);
                          subTeams.push({
                            ...team,
                            participants: chunk,
                            displayName: `${team.teamName} ${suffix}`,
                            displayScore: chunk[0]?.score,
                            displayGrade: chunk[0]?.grade,
                            displayPoints: chunk[0]?.points,
                            isVirtual: true,
                            virtualId: `${team.id}_sub${subIndex}`
                          });
                          subIndex++;
                        }
                        return subTeams;
                      }).map((team) => (
                        <tr key={team.isVirtual ? team.virtualId : team.id} className="group hover:bg-slate-50/50">
                          <td className="py-3 px-4 align-top">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900">
                                {team.participants[0]?.chestNumber || 'N/A'}
                              </span>
                              <span className="text-slate-400 text-[10px] mt-0.5">Code: {team.participants[0]?.codeLetter || '-'}</span>
                              {team.isVirtual && <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-1">Split Team</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <p className="font-bold text-slate-700 text-xs uppercase">{team.displayName}</p>
                            <div className="flex flex-col gap-1 mt-1.5">
                              {team.participants.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  {p.name}
                                </div>
                              ))}
                            </div>
                            {(program.status !== ProgramStatus.COMPLETED || isEditingScores) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirm(
                                    'Remove Team',
                                    `Are you sure you want to remove ${team.displayName} from this program?`,
                                    async () => {
                                      const newTeams = (program.teams || []).filter(t => t.id !== team.id);
                                      if (onUpdateProgram) {
                                        await onUpdateProgram(program.id, { teams: newTeams });
                                        setEditedTeams(newTeams);
                                      }
                                    },
                                    'danger',
                                    'Remove Team'
                                  );
                                }}
                                className="mt-2 text-[11px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Remove Team
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-3.5">
                            <span className="text-rose-500 font-black text-xs">{`#${team.participants[0]?.rank || '-'}`}</span>
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-2.5">
                            {isEditingScores ? (
                              <input
                                type="number"
                                step="0.1"
                                className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={team.displayScore || ''}
                                onChange={(e) => handleScoreEdit(team.id, team.participants[0].chestNumber, 'score', e.target.value)}
                              />
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-black text-slate-900 text-sm">{team.displayScore || '-'}</span>
                              ) : <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-2.5">
                            {isEditingScores ? (
                              <input
                                type="text"
                                className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={team.displayGrade || ''}
                                onChange={(e) => handleScoreEdit(team.id, team.participants[0].chestNumber, 'grade', e.target.value)}
                              />
                            ) : (
                              program.status === ProgramStatus.COMPLETED ? (
                                <span className="font-black text-emerald-600 text-sm">{team.displayGrade || '-'}</span>
                              ) : <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center align-top pt-3">
                            {program.status === ProgramStatus.COMPLETED && !isEditingScores ? (
                              <span className="font-black text-slate-900 text-sm">{team.displayPoints || '0'}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic font-medium">No participants registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Styled Modern Custom Modal (Alert / Confirm) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 transform transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                modalConfig.confirmVariant === 'danger' ? 'bg-rose-100 text-rose-600' :
                modalConfig.confirmVariant === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">{modalConfig.title || 'Notification'}</h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed pl-1">{modalConfig.message}</p>
            
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {modalConfig.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                  setModalConfig(prev => ({ ...prev, isOpen: false }));
                }}
                className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-sm ${
                  modalConfig.confirmVariant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : modalConfig.confirmVariant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {modalConfig.type === 'confirm' ? (modalConfig.confirmText || 'Confirm') : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
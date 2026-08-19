import React, { useState } from 'react';
import { Program, ProgramStatus, CustomProgramScore, Team, Participant, Staff } from '../types';
import { calculatePoints } from '../utils/pointsCalculator';
import { AdminRegistrationModal } from './AdminRegistrationModal';

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
  customScores?: Record<string, CustomProgramScore>;
  allPrograms?: Program[];
  staffs?: Staff[];
}

export const ProgramAccordion: React.FC<ProgramAccordionProps> = ({
  program,
  onUpdateStatus,
  onDelete,
  onEdit,
  onPublish,
  onPublishResult,
  onRequestCancel,
  onUpdateProgram,
  customScores,
  allPrograms = [],
  staffs = []
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  
  const participantCount = program.teams?.reduce((acc, team) => acc + (team.participants?.length || 0), 0) || 0;
  const hasPerformers = participantCount > 0;
  const isJudgesPanel = window.location.pathname.includes('judges');

  const hasCodesGenerated = (program.teams || []).some(t => (t.participants || []).some(p => p.codeLetter || p.isCodeRevealed));
  const isUpcoming = program.startTime ? new Date(program.startTime).getTime() > Date.now() - 4 * 60 * 60 * 1000 : false;

  // Custom alert / confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    title?: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    defaultValue?: string;
    onConfirm?: (value?: string) => void;
  }>({
    isOpen: false,
    type: 'alert',
    message: ''
  });
  const [promptValue, setPromptValue] = useState('');

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

  const showPrompt = (
    title: string,
    message: string,
    defaultValue: string,
    onConfirm: (value: string) => void
  ) => {
    setPromptValue(defaultValue);
    setModalConfig({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      confirmText: 'Save',
      confirmVariant: 'primary',
      defaultValue,
      onConfirm: (val) => onConfirm(val || '')
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

    let allParticipants = editedTeams.reduce((acc: any[], team) => acc.concat(
      (team.participants || []).map(p => ({ ...p, teamId: team.id }))
    ), []);

    allParticipants.sort((a, b) => (b.score || 0) - (a.score || 0));

    let currentRank = 1;
    for (let i = 0; i < allParticipants.length; i++) {
      if (i > 0 && (allParticipants[i].score || 0) < (allParticipants[i - 1].score || 0)) {
        currentRank = i + 1;
      }
      allParticipants[i].rank = currentRank;
      const customConfig = customScores?.[program.id];
      allParticipants[i].points = calculatePoints(
        allParticipants[i].score || 0, 
        allParticipants[i].grade || '', 
        program.isGroup, 
        currentRank,
        customConfig
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

  const handleManualRegistration = async (teamName: string, participantName: string, chestNumber: string) => {
    if (!onUpdateProgram) return false;

    // Check if chest number exists in ANY program (simple check within this program for now)
    const chestExists = (program.teams || []).some(t => 
      (t.participants || []).some(p => p.chestNumber === chestNumber)
    );
    if (chestExists) {
      throw new Error(`Chest number ${chestNumber} already exists in this program.`);
    }

    const newParticipant: Participant = {
      name: participantName,
      chestNumber: chestNumber,
    };

    let updatedTeams = [...(program.teams || [])];
    const existingTeamIndex = updatedTeams.findIndex(t => t.teamName.toLowerCase() === teamName.toLowerCase());

    if (existingTeamIndex >= 0) {
      updatedTeams[existingTeamIndex] = {
        ...updatedTeams[existingTeamIndex],
        participants: [...(updatedTeams[existingTeamIndex].participants || []), newParticipant]
      };
    } else {
      const newTeam: Team = {
        id: `team_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
        teamName: teamName,
        participants: [newParticipant],
      };
      updatedTeams.push(newTeam);
    }

    const success = await onUpdateProgram(program.id, { teams: updatedTeams });
    return success;
  };

  const handleGlobalParticipantRename = async (chestNumber: string, currentName: string) => {
    if (!onUpdateProgram || !allPrograms) return;
    
    showPrompt(
      'Edit Participant Name',
      `Enter correct name for Chest #${chestNumber}:`,
      currentName,
      (newName) => {
        if (!newName || newName.trim() === '' || newName.trim() === currentName) return;
        
        showConfirm(
          'Rename Globally',
          `Are you sure you want to rename "${currentName}" to "${newName.trim()}" across ALL programs?`,
          async () => {
            const updatePromises = allPrograms.map(async (p) => {
              let changed = false;
              const updatedTeams = (p.teams || []).map(t => {
                let teamChanged = false;
                const updatedParticipants = (t.participants || []).map(pt => {
                  if (pt.chestNumber === chestNumber && pt.name !== newName.trim()) {
                    teamChanged = true;
                    return { ...pt, name: newName.trim() };
                  }
                  return pt;
                });
                if (teamChanged) {
                  changed = true;
                  return { ...t, participants: updatedParticipants };
                }
                return t;
              });

              if (changed) {
                await onUpdateProgram(p.id, { teams: updatedTeams });
                if (p.id === program.id) {
                  setEditedTeams(updatedTeams);
                }
              }
            });

            await Promise.all(updatePromises);
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setTimeout(() => alert('Participant name updated globally!'), 100);
          },
          'warning',
          'Rename Everywhere'
        );
      }
    );
  };

  return (
    <>
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
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                {/* Mobile Participant Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${hasPerformers ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                  {hasPerformers ? `👥 ${participantCount} Registered` : '⚠️ No Registrations'}
                </span>
                
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{program.category}</span>
                {program.judgePanel && (
                  <span className="flex items-center text-[11px] text-amber-700 font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {program.judgePanel}
                  </span>
                )}
                {program.venue && (
                  <span className={`text-[10px] font-bold truncate flex items-center gap-1 ${isUpcoming ? 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100' : 'text-slate-500'}`}>
                    <span>📍 {program.venue}</span>
                    {program.startTime && <span>• 🕒 {new Date(program.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
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
                    <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${program.venue && isUpcoming ? 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 w-fit flex items-center gap-1' : 'text-slate-400'}`}>
                      {program.venue ? (
                        <>
                          <span>📍 {program.venue}</span>
                          {program.startTime && <span>• 🕒 {new Date(program.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        </>
                      ) : (
                        `#${program.id.substring(0,8)}`
                      )}
                    </span>
                 </div>
                 
                 {/* Desktop Participant Badge */}
                 <div className="w-[140px] flex items-center justify-center flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${hasPerformers ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {hasPerformers ? `👥 ${participantCount} Reg` : '⚠️ No Reg'}
                    </span>
                 </div>
                 
                 <div className="w-[100px] flex justify-center flex-shrink-0">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${program.category.toLowerCase().includes('stage') && !program.category.toLowerCase().includes('off') ? 'bg-indigo-50 text-indigo-600' : program.category.toLowerCase().includes('off-stage') ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {program.category}
                    </span>
                 </div>
                 

            </div>
          </button>
          
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-2 flex-shrink-0 whitespace-nowrap">
            {/* Blue Button: Send to GR / Recall (GR) with Custom Confirm */}
            {hasPerformers && program.status === ProgramStatus.PENDING && (
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
            )}
            
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

            {/* Supreme Admin Actions */}
            {window.sessionStorage.getItem('supreme_admin_auth') === 'true' && hasCodesGenerated && program.status !== ProgramStatus.COMPLETED && (
              <button
                onClick={async () => {
                  showConfirm(
                    'Full Code Reset',
                    'Are you sure you want to completely erase all participant codes and reset this program back to the Green Room?',
                    async () => {
                      if (!onUpdateProgram) return;
                      const newTeams = (program.teams || []).map(t => ({
                        ...t,
                        participants: (t.participants || []).map(p => {
                          const updatedP = { ...p, isCodeRevealed: false };
                          delete updatedP.codeLetter; // Erase the generated code
                          return updatedP;
                        })
                      }));
                      await onUpdateProgram(program.id, { 
                        teams: newTeams,
                        status: ProgramStatus.PENDING,
                        isAllocatedToJudge: false,
                        judgePanel: null,
                        isResultPublished: false 
                      });
                    },
                    'warning',
                    'Reset Codes & Return to GR'
                  );
                }}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Supreme Admin Override"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                Reset Codes
              </button>
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
                title="Edit Program"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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
      </div>
    </div>

    {/* Accordion Content */}
        {isOpen && (
          <div className="border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 sm:p-5">
                <div className="flex justify-between items-center mb-4">
                  {/* Add Registration Button for Admin */}
                  <button
                    onClick={() => setIsRegistrationModalOpen(true)}
                disabled={program.status === ProgramStatus.COMPLETED}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                  program.status === ProgramStatus.COMPLETED 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Registration
              </button>

              {program.status === ProgramStatus.COMPLETED && (
                <div>
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
            </div>
            
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
                      editedTeams.reduce((acc: any[], team) => acc.concat((team.participants || []).map(p => ({ ...p, teamId: team.id, teamName: team.teamName }))), []).map((participant, flatIdx) => (
                        <tr key={`${participant.teamId}-${participant.chestNumber}-${flatIdx}`} className="group hover:bg-slate-50/50">
                          <td className="py-3 px-4 align-top">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900">{participant.chestNumber}</span>
                              <span className="text-slate-400 text-[10px] mt-0.5">Code: {participant.codeLetter || '-'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <p className="font-bold text-slate-700 text-xs">{participant.teamName}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 group/name">
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              {participant.name}
                              {window.sessionStorage.getItem('supreme_admin_auth') === 'true' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGlobalParticipantRename(participant.chestNumber, participant.name);
                                  }}
                                  className="opacity-0 group-hover/name:opacity-100 text-indigo-400 hover:text-indigo-600 p-0.5 transition-opacity"
                                  title="Edit Name Globally"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                              )}
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
                      editedTeams.reduce((acc: any[], team) => {
                        const limit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;
                        const pList = team.participants || [];
                        if (pList.length <= limit) {
                          return acc.concat([{
                            ...team,
                            displayName: team.teamName,
                            displayScore: team.score,
                            displayGrade: team.grade,
                            displayPoints: team.points
                          }]);
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
                        return acc.concat(subTeams);
                      }, []).map((team) => (
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
                              {team.participants.map((p: any, idx: number) => (
                                <div key={idx} className="group/member flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 transition-colors py-0.5">
                                  <div className="flex items-center gap-1.5 group/name">
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    {p.name}
                                    {window.sessionStorage.getItem('supreme_admin_auth') === 'true' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleGlobalParticipantRename(p.chestNumber, p.name);
                                        }}
                                        className="opacity-0 group-hover/name:opacity-100 text-indigo-400 hover:text-indigo-600 p-0.5 transition-opacity"
                                        title="Edit Name Globally"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                    )}
                                  </div>
                                  {(program.status !== ProgramStatus.COMPLETED || isEditingScores) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showConfirm(
                                          'Remove Participant',
                                          `Are you sure you want to remove ${p.name} from this team?`,
                                          async () => {
                                            const teamToUpdate = (program.teams || []).find(t => t.id === team.id);
                                            if (teamToUpdate) {
                                              const newParticipants = teamToUpdate.participants.filter(pt => pt.chestNumber !== p.chestNumber);
                                              let newTeams;
                                              if (newParticipants.length === 0) {
                                                newTeams = (program.teams || []).filter(t => t.id !== team.id);
                                              } else {
                                                newTeams = (program.teams || []).map(t => 
                                                  t.id === team.id ? { ...t, participants: newParticipants } : t
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
                                      className="opacity-0 group-hover/member:opacity-100 text-rose-400 hover:text-rose-600 p-0.5"
                                      title="Remove from team"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  )}
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
        </div>
      )}

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
            
            {modalConfig.type === 'prompt' && (
              <div className="mb-5">
                <input
                  type="text"
                  autoFocus
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (modalConfig.onConfirm) modalConfig.onConfirm(promptValue);
                      setModalConfig(prev => ({ ...prev, isOpen: false }));
                    }
                  }}
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {(modalConfig.type === 'confirm' || modalConfig.type === 'prompt') && (
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
                  if (modalConfig.onConfirm) {
                    if (modalConfig.type === 'prompt') {
                      modalConfig.onConfirm(promptValue);
                    } else {
                      modalConfig.onConfirm();
                    }
                  }
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

      {/* Admin Registration Modal */}
      <AdminRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        program={program}
        allPrograms={allPrograms}
        staffs={staffs}
        onSave={handleManualRegistration}
      />
    </>
  );
};
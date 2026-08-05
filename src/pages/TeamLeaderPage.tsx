import React, { useState, useMemo } from 'react';
import { Program, Settings } from '../types';
import { ProgramAutocomplete } from '../components/ProgramAutocomplete';

interface TeamLeaderPageProps {
  teamName: string;
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
  onLogout: () => void;
  isAdminView?: boolean;
  availableTeams?: string[];
  onTeamChange?: (teamName: string) => void;
  settings?: Settings;
}

export const TeamLeaderPage: React.FC<TeamLeaderPageProps> = ({
  teamName,
  programs,
  setPrograms,
  updateProgram,
  onLogout,
  isAdminView,
  availableTeams,
  onTeamChange,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'programs' | 'results'>('candidates');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Changed to Array for Multi-Select
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  
  const [participantName, setParticipantName] = useState('');
  const [chestNo, setChestNo] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'chest'>('chest');

  // Removal Request Modal State
  const [removalRequest, setRemovalRequest] = useState<{ isOpen: boolean; programId: string; programName: string; chestNumber: string; name: string } | null>(null);

  const totalTeamsCount = useMemo(() => {
    const teamNames = new Set<string>();
    programs.forEach(p => {
      (p.teams || []).forEach(t => teamNames.add(t.teamName.toLowerCase()));
    });
    teamNames.add(teamName.toLowerCase());
    return Math.max(teamNames.size, 2);
  }, [programs, teamName]);

  const teamCandidates = useMemo(() => {
    const map = new Map<string, { name: string; chestNumber: string; registeredPrograms: { id: string; name: string; status: string; removalRequested?: boolean; category: string }[] }>();
    programs.forEach(p => {
      const team = (p.teams || []).find(t => t.teamName.toLowerCase() === teamName.toLowerCase());
      if (team) {
        (team.participants || []).forEach(part => {
          if (!map.has(part.chestNumber)) {
            map.set(part.chestNumber, {
              name: part.name,
              chestNumber: part.chestNumber,
              registeredPrograms: []
            });
          }
          map.get(part.chestNumber)?.registeredPrograms.push({ 
            id: p.id, 
            name: p.name, 
            status: p.status, 
            category: p.category,
            removalRequested: (part as any).removalRequested 
          });
        });
      }
    });
    
    // Apply Search & Sort
    let result = Array.from(map.values());
    if (searchTerm) {
      result = result.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.chestNumber.includes(searchTerm));
    }
    result.sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a.chestNumber.localeCompare(b.chestNumber));
    
    return result;
  }, [programs, teamName, searchTerm, sortBy]);

  const availablePrograms = useMemo(() => {
    return programs.map(p => {
      const limit = p.isGroup
        ? Math.floor((p.groupCount || 0) / totalTeamsCount) * (p.membersPerGroup || 0)
        : Math.floor((p.participantsCount || 0) / totalTeamsCount);
      const existingTeam = (p.teams || []).find(t => t.teamName.toLowerCase() === teamName.toLowerCase());
      const currentCount = existingTeam?.participants?.length || 0;
      return { ...p, limit, currentCount, isFull: currentCount >= limit };
    });
  }, [programs, totalTeamsCount, teamName]);

  const handleToggleProgram = (id: string) => {
    setSelectedProgramIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgramIds.length === 0 || !participantName.trim() || !chestNo.trim()) {
      setAlertMessage('Please fill all fields and select at least one program.');
      return;
    }

    const trimmedName = participantName.trim();
    const trimmedChest = chestNo.trim();

    // 1. Check if Chest No is taken by a DIFFERENT name
    let isChestTakenByOther = false;
    programs.forEach(p => {
      (p.teams || []).forEach(t => {
        (t.participants || []).forEach(part => {
          if (part.chestNumber === trimmedChest && part.name.toLowerCase() !== trimmedName.toLowerCase()) {
            isChestTakenByOther = true;
          }
        });
      });
    });

    if (isChestTakenByOther) {
      setAlertMessage(`Chest Number "${trimmedChest}" is already taken by another participant.`);
      return;
    }

    // 2. Check if student is already in ANY of the selected programs
    const existingCandidate = teamCandidates.find(c => c.chestNumber === trimmedChest);
    if (existingCandidate) {
      const alreadyIn = selectedProgramIds.find(id => existingCandidate.registeredPrograms.some(rp => rp.id === id));
      if (alreadyIn) {
        const progName = programs.find(p => p.id === alreadyIn)?.name;
        setAlertMessage(`Participant is already registered in ${progName}.`);
        return;
      }
    }

    // 3. Team Size Limit Validation (Bypass for Admin)
    if (!isAdminView && settings?.maxStudentsPerTeam) {
      // If candidate is new to this team, check limit
      if (!existingCandidate) {
        if (teamCandidates.length >= settings.maxStudentsPerTeam) {
          setAlertMessage(`Team limit reached! You can only have ${settings.maxStudentsPerTeam} unique participants.`);
          return;
        }
      }
    }

    // 4. Student Program Type Limit Validation (Bypass for Admin)
    const targetPrograms = availablePrograms.filter(p => selectedProgramIds.includes(p.id));
    
    // Check if programs are full or started
    const invalidProgram = targetPrograms.find(p => p.status !== 'PENDING' || p.currentCount >= p.limit);
    if (invalidProgram) {
      setAlertMessage(`Cannot modify participants. ${invalidProgram.name} is full or already started.`);
      return;
    }

    if (!isAdminView && settings?.maxNonGeneralPerStudent) {
      const isGeneral = (cat: string) => cat.toLowerCase().includes('general');
      const currentNonGeneral = (existingCandidate?.registeredPrograms || []).filter(rp => !isGeneral(rp.category)).length;
      const newNonGeneral = targetPrograms.filter(p => !isGeneral(p.category)).length;
      
      if (currentNonGeneral + newNonGeneral > settings.maxNonGeneralPerStudent) {
        setAlertMessage(`Student limit reached! A student can only participate in ${settings.maxNonGeneralPerStudent} non-general programs.`);
        return;
      }
    }

    // Update all selected programs
    const newParticipant = { name: trimmedName, chestNumber: trimmedChest };
    
    const updatePromises = targetPrograms.map(targetProgram => {
      const existingTeams = targetProgram.teams || [];
      const teamIndex = existingTeams.findIndex(t => t.teamName.toLowerCase() === teamName.toLowerCase());
      let newTeams = [...existingTeams];
      
      if (teamIndex >= 0) {
        const team = newTeams[teamIndex];
        newTeams[teamIndex] = { ...team, participants: [...(team.participants || []), newParticipant] };
      } else {
        newTeams.push({ id: `team_${Date.now()}_${targetProgram.id}`, teamName: teamName, participants: [newParticipant] });
      }
      return updateProgram(targetProgram.id, { teams: newTeams });
    });

    await Promise.all(updatePromises);

    setShowAddModal(false);
    setParticipantName('');
    setChestNo('');
    setSelectedProgramIds([]);
    setIsEditingName(false);
  };

  const confirmRemovalRequest = async () => {
    if (!removalRequest) return;
    const program = programs.find(p => p.id === removalRequest.programId);
    if (!program) return;

    const updatedTeams = program.teams.map(t => {
      if (t.teamName.toLowerCase() === teamName.toLowerCase()) {
        return {
          ...t,
          participants: t.participants.map(p => 
            p.chestNumber === removalRequest.chestNumber ? { ...p, removalRequested: true } : p
          )
        };
      }
      return t;
    });

    await updateProgram(program.id, { teams: updatedTeams });
    setAlertMessage(`Removal request sent to Admin for ${removalRequest.name}.`);
    setRemovalRequest(null);
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-slate-50 pb-20 font-sans text-slate-900 px-3 sm:px-6 py-4">
      {/* ADMIN TEAM SWITCHER */}
      {isAdminView && availableTeams && onTeamChange && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 mb-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-indigo-900 font-black text-sm uppercase tracking-wider">Admin Team Manager</h3>
            <p className="text-indigo-600/70 text-[10px] font-bold uppercase mt-1">You are currently acting as a Team Leader. Select a team to manage.</p>
          </div>
          <select 
            value={teamName}
            onChange={(e) => onTeamChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-black uppercase text-indigo-900 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
          >
            {availableTeams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 rounded-t-xl p-4 flex justify-between items-center mb-0">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-600">Portal</span>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{teamName}</h1>
        </div>
        {!isAdminView && (
          <button onClick={onLogout} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-all">Logout</button>
        )}
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-4 bg-white">
        <button onClick={() => setActiveTab('candidates')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider ${activeTab === 'candidates' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Candidates</button>
        <button onClick={() => setActiveTab('programs')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider ${activeTab === 'programs' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Programs</button>
      </div>

      {/* CONTENT */}
      {activeTab === 'candidates' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50">
             <div className="flex w-full sm:w-auto gap-2">
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-bold">
                    <option value="chest">Sort: Chest No</option>
                    <option value="name">Sort: Name</option>
                </select>
             </div>
             <button onClick={() => {
                setParticipantName('');
                setChestNo('');
                setIsEditingName(false);
                setSelectedProgramIds([]);
                setShowAddModal(true);
             }} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold whitespace-nowrap">+ Add New</button>
          </div>

          <div className="divide-y divide-slate-100">
            {teamCandidates.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase">No candidates found.</div>
            ) : (
              teamCandidates.map((c, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-700 font-mono font-black text-xs rounded-full border border-slate-200">
                      {c.chestNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase">{c.name}</h4>
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] text-slate-500 font-bold">{c.registeredPrograms.length} Events Registered</p>
                         <button 
                            onClick={() => {
                               setParticipantName(c.name);
                               setChestNo(c.chestNumber);
                               setIsEditingName(true);
                               setSelectedProgramIds([]);
                               setShowAddModal(true);
                            }}
                            className="text-[9px] font-bold uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                         >
                            + Add Event
                         </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {c.registeredPrograms.map((rp, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-[10px] font-bold bg-white border border-slate-200 px-2.5 py-1.5 rounded w-full sm:w-auto">
                        <span className="truncate max-w-[150px]">{rp.name}</span>
                        {rp.status === 'PENDING' && !rp.removalRequested && (
                          <button onClick={() => setRemovalRequest({ isOpen: true, programId: rp.id, programName: rp.name, chestNumber: c.chestNumber, name: c.name })} className="text-rose-500 hover:text-rose-700 ml-2" title="Request Admin Removal">✕</button>
                        )}
                        {rp.removalRequested && (
                          <span className="text-amber-500 ml-2">Pending Admin</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">Program Slots</div>
          {availablePrograms.map((prog) => {
            const count = (prog.teams || []).find(t => t.teamName.toLowerCase() === teamName.toLowerCase())?.participants?.length || 0;
            return (
              <div key={prog.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase">{prog.name}</h4>
                  <p className="text-[10px] font-bold text-slate-500">{prog.category} • {prog.status}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${prog.isFull ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                  {count} / {prog.limit} Slots
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* CLARIFICATION MODAL WITH CLOSE BUTTON */}
      {removalRequest && removalRequest.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-black text-slate-900 uppercase">Request Removal</h4>
              <button onClick={() => setRemovalRequest(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to request Admin to remove <b>{removalRequest.name}</b> from <b>{removalRequest.programName}</b>? Admin must approve this.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRemovalRequest(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
              <button onClick={confirmRemovalRequest} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all">
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-SELECT ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-sm font-black uppercase text-slate-900">Add Candidate</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={handleAddParticipant} className="flex flex-col gap-4">
              <div className="shrink-0 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Candidate Name</label>
                  <input type="text" value={participantName} onChange={(e) => setParticipantName(e.target.value)} disabled={isEditingName} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 disabled:opacity-50" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Chest Number</label>
                  <input type="text" value={chestNo} onChange={(e) => setChestNo(e.target.value)} disabled={isEditingName} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600 disabled:opacity-50" required />
                </div>
              </div>

              <div className="flex flex-col overflow-visible">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 shrink-0">Select Programs</label>
                <ProgramAutocomplete 
                   availablePrograms={availablePrograms}
                   selectedProgramIds={selectedProgramIds}
                   onChange={setSelectedProgramIds}
                   disabledProgramIds={teamCandidates.find(c => c.chestNumber === chestNo)?.registeredPrograms.map(rp => rp.id) || []}
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shrink-0 mt-2">
                Save Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ALERT */}
      {alertMessage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-xs w-full p-5 shadow-2xl text-center border border-slate-200">
            <h4 className="text-sm font-black text-slate-900 mb-2 uppercase">Notice</h4>
            <p className="text-xs text-slate-600 mb-4">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Okay</button>
          </div>
        </div>
      )}
    </div>
  );
};
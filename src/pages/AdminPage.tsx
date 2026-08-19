import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, Staff } from '../types';
import { StaffCredentialModal } from '../components/StaffCredentialModal';
import { ProgramList } from '../components/ProgramList';
import { ParticipantList } from '../components/ParticipantList';
import { ProgramFormModal } from '../components/ProgramFormModal';
import { ConsolidationView } from '../components/ConsolidationView';
import { ScheduleManager } from '../components/ScheduleManager';
import { BulkUploadModal } from '../components/BulkUploadModal';
import { CATEGORIES, ZONES } from '../constants/categories';

interface AdminPageProps {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  addProgram: (data: Omit<Program, 'id' | 'festId'>) => Promise<boolean>;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
  deleteProgram: (id: string) => Promise<boolean>;
  staffs: Staff[];
  addStaff: (data: Omit<Staff, 'id'>) => Promise<boolean>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;
  settings?: any;
  updateSettings?: (updates: any) => Promise<boolean>;
  adminSubView?: 'tracker' | 'scheduler' | 'performers' | 'requests' | 'staff' | 'results';
}

export const AdminPage: React.FC<AdminPageProps> = ({
  programs, setPrograms, addProgram, updateProgram, deleteProgram,
  staffs, addStaff, updateStaff, deleteStaff, settings, updateSettings, adminSubView
}) => {
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const showOverallPoints = settings?.showOverallLeaderboardInPublic === true;

  const handleToggleOverallPoints = async () => {
    if (!updateSettings || isUpdatingSettings) return;
    setIsUpdatingSettings(true);
    await updateSettings({ showOverallLeaderboardInPublic: !showOverallPoints });
    setIsUpdatingSettings(false);
  };

  // Removed local subTab state, using adminSubView prop
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  
  // Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  // Custom Confirmation Modal State for Staff Deletion
  const [staffDeleteId, setStaffDeleteId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: ''
  });

  const pendingRequests = useMemo(() => {
    const reqs: { programId: string; programName: string; teamName: string; participantChest: string; participantName: string }[] = [];
    programs.forEach(p => {
      (p.teams || []).forEach(t => {
        (t.participants || []).forEach(part => {
          if ((part as any).removalRequested) {
            reqs.push({ programId: p.id, programName: p.name, teamName: t.teamName, participantChest: part.chestNumber, participantName: part.name });
          }
        });
      });
    });
    return reqs;
  }, [programs]);

  const handleRequestAction = async (programId: string, teamName: string, chestNo: string, action: 'approve' | 'reject') => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    const updatedTeams = program.teams.map(t => {
      if (t.teamName === teamName) {
        if (action === 'approve') {
          return { ...t, participants: t.participants.filter(p => p.chestNumber !== chestNo) };
        } else {
          return {
            ...t,
            participants: t.participants.map(p => {
              if (p.chestNumber === chestNo) {
                const { removalRequested, ...rest } = p as any;
                return rest;
              }
              return p;
            })
          };
        }
      }
      return t;
    });
    await updateProgram(programId, { teams: updatedTeams });
  };

  const handleSaveProgram = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const programData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      zone: formData.get('zone') as string,
      duration: Number(formData.get('duration')) || 30,
      startTime: editingProgram?.startTime, // Preserved, assigned in ScheduleManager
      endTime: editingProgram?.endTime,
      venue: editingProgram?.venue,
      isGroup,
      participantsCount: Number(formData.get('participantsCount')) || 0,
      groupCount: Number(formData.get('groupCount')) || 0,
      membersPerGroup: Number(formData.get('membersPerGroup')) || 0,
      status: editingProgram ? editingProgram.status : ProgramStatus.PENDING,
      teams: editingProgram ? (editingProgram.teams || []) : [],
      description: editingProgram ? editingProgram.description : '',
    };
    let success = false;
    if (editingProgram) {
      success = await updateProgram(editingProgram.id, programData);
    } else {
      success = await addProgram(programData as Omit<Program, 'id' | 'festId'>);
    }
    
    if (success) {
      if (!editingProgram) {
        (e.target as HTMLFormElement).reset();
      } else {
        setShowProgramModal(false);
      }
      setEditingProgram(null);
      setIsGroup(false);
    } else {
      alert("Failed to save program. Please check console or try again.");
    }
  };

  const handleSaveStaff = async (staffData: Omit<Staff, 'id'>, editId?: string) => {
    if (editId) {
      if (editingStaff && editingStaff.role === 'TEAM_LEADER' && staffData.role === 'TEAM_LEADER') {
        const oldTeamName = editingStaff.teamName;
        const newTeamName = staffData.teamName;
        if (oldTeamName && newTeamName && oldTeamName !== newTeamName) {
          const updatePromises = programs.map(async (p) => {
            if (!p.teams) return;
            let changed = false;
            const updatedTeams = p.teams.map(t => {
              if (t.teamName.toLowerCase() === oldTeamName.toLowerCase()) {
                changed = true;
                return { ...t, teamName: newTeamName };
              }
              return t;
            });
            if (changed) {
              await updateProgram(p.id, { teams: updatedTeams });
            }
          });
          await Promise.all(updatePromises);
        }
      }
      await updateStaff(editId, staffData);
    } else {
      await addStaff(staffData);
    }
    setEditingStaff(null);
    setShowStaffModal(false);
  };

  const confirmDeleteStaff = (id: string, username: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete staff account "${username}"? This action cannot be undone.`,
      confirmVariant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        await deleteStaff(id);
        setStaffDeleteId(null);
      }
    });
  };

  const activeTab = adminSubView || 'tracker';

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* HEADER - Image 1 Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            Welcome back, Admin! <span className="text-2xl animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Here's what's happening at your festival.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap justify-end">
          {/* Quick Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm sm:mr-2">
             <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-600">Public Leaderboard</span>
             <button
               onClick={handleToggleOverallPoints}
               disabled={isUpdatingSettings}
               className={`w-10 h-5 rounded-full p-0.5 transition-colors flex shrink-0 ${showOverallPoints ? 'bg-emerald-500' : 'bg-slate-300'} ${isUpdatingSettings ? 'opacity-50' : ''}`}
             >
               <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showOverallPoints ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBulkUploadModal(true)} 
              className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Bulk Upload 
            </button>
            <button 
              onClick={() => { setEditingProgram(null); setIsGroup(false); setShowProgramModal(true); }} 
              className="px-6 py-3 bg-[#3B3BFA] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Add Event
            </button>
          </div>
        </div>
      </div>
      
      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-2">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">Total Events</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none my-1">{programs.length}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold hidden xl:block truncate">Across all categories</p>
              </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">Performers</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none my-1">
                      {programs.reduce((acc, p) => acc + (p.teams?.reduce((a, t) => a + (t.participants?.length || 0), 0) || 0), 0)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold hidden xl:block truncate">Registered</p>
              </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">Total Teams</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none my-1">
                      {programs.reduce((acc, p) => acc + (p.teams?.length || 0), 0)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold hidden xl:block truncate">Participating</p>
              </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-transform hover:-translate-y-1 duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">Total Points</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none my-1">
                      {programs.reduce((acc, p) => acc + (p.teams?.reduce((teamAcc, t) => teamAcc + (t.points || 0) + (t.participants?.reduce((pAcc, pt) => pAcc + (pt.points || 0), 0) || 0), 0) || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold hidden xl:block truncate">Points awarded</p>
              </div>
          </div>
      </div>

      {/* TAB CONTENT */}
      <div key={activeTab} className="w-full animate-fadeIn transition-all duration-300 ease-in-out">
        {activeTab === 'tracker' && <ProgramList programs={programs} setPrograms={setPrograms} deleteProgram={deleteProgram} updateProgram={updateProgram} onEdit={(p) => { setEditingProgram(p); setShowProgramModal(true); }} customScores={settings?.customScores} staffs={staffs} />}

        {activeTab === 'scheduler' && <ScheduleManager programs={programs} updateProgram={updateProgram} />}
        
        {activeTab === 'results' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <ConsolidationView programs={programs} />
          </div>
        )}

        {activeTab === 'performers' && <ParticipantList programs={programs} deleteParticipant={async (chestNo) => {
          if (!window.confirm(`Are you SURE you want to completely delete participant (Chest No: ${chestNo}) from the entire festival? This will remove them from ALL programs. This action cannot be undone.`)) return;
          
          const updatePromises = programs.map(async (p) => {
            if (!p.teams) return;
            let changed = false;
            const updatedTeams = p.teams.map(t => {
              const initialLen = t.participants?.length || 0;
              const newParticipants = (t.participants || []).filter(pt => pt.chestNumber !== chestNo);
              if (newParticipants.length !== initialLen) changed = true;
              return { ...t, participants: newParticipants };
            }).filter(t => t.participants && t.participants.length > 0);
            
            if (changed) {
              await updateProgram(p.id, { teams: updatedTeams });
            }
          });
          
          await Promise.all(updatePromises);
          alert('Participant completely deleted from all programs.');
        }} />}
                 
        {activeTab === 'requests' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No pending removal requests.</div>
            ) : (
              pendingRequests.map((req, idx) => (
                <div key={idx} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded border border-rose-100">Removal Request</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{req.teamName}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">{req.participantName} (Chest: {req.participantChest})</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">From Program: <span className="font-black text-slate-700">{req.programName}</span></p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => handleRequestAction(req.programId, req.teamName, req.participantChest, 'reject')} className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all">Reject</button>
                    <button onClick={() => handleRequestAction(req.programId, req.teamName, req.participantChest, 'approve')} className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-xs font-bold transition-all shadow-sm">Approve Removal</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Registered Staff ({staffs?.length || 0})</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Manage access for Green Room, Judges & Leaders</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  setModalConfig({
                    isOpen: true,
                    title: 'Seed Default Staff',
                    message: 'Are you sure you want to seed the default credentials? This will create standard accounts for Judges and Team Leaders if they do not already exist.',
                    confirmVariant: 'primary',
                    confirmText: 'Yes, Seed Defaults',
                    onConfirm: async () => {
                      const defaults: any[] = [
                        { role: 'ADMIN', username: 'admin', password: 'admin123' },
                        { role: 'GREEN_ROOM', username: 'greenroom', password: 'greenroom123' },
                        { role: 'JUDGE', username: 'judge1', password: 'judge123', judgePanel: 'Stage 1' },
                        { role: 'JUDGE', username: 'judge2', password: 'judge123', judgePanel: 'Stage 2' },
                        { role: 'TEAM_LEADER', username: 'teamA', password: 'team123', teamName: 'Team A' },
                        { role: 'TEAM_LEADER', username: 'teamB', password: 'team123', teamName: 'Team B' }
                      ];
                      let addedCount = 0;
                      for (const d of defaults) {
                        if (!staffs?.find(s => s.username === d.username)) {
                          await addStaff(d);
                          addedCount++;
                        }
                      }
                      if (addedCount > 0) {
                        alert(`Successfully seeded ${addedCount} new default credentials!`);
                      } else {
                        alert("All default credentials already exist.");
                      }
                    }
                  });
                }} className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold shadow-sm transition-all">Seed Defaults</button>
                <button onClick={() => { setEditingStaff(null); setShowStaffModal(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition-all">+ Add Staff</button>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {(!staffs || staffs.length === 0) ? (
                 <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No staff accounts created yet.</div>
              ) : (
                staffs.map(staff => (
                  <div key={staff.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-black border ${staff.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-200' : staff.role === 'JUDGE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : staff.role === 'TEAM_LEADER' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                        <span className="text-[9px] uppercase">{staff.role === 'ADMIN' ? 'ADM' : staff.role === 'GREEN_ROOM' ? 'GR' : staff.role === 'JUDGE' ? 'JDG' : 'LDR'}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                          {staff.username}
                          {staff.isDisabled && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px]">DISABLED</span>}
                        </h4>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Pass: <span className="font-mono bg-slate-100 px-1 rounded">{staff.password}</span></span>
                          {(staff.stage || staff.panelName) && (
                            <>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span className="text-[10px] font-bold text-indigo-600 uppercase">{staff.stage || staff.panelName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                      <button 
                        onClick={() => updateStaff(staff.id, { isDisabled: !staff.isDisabled })} 
                        className={`flex-1 sm:flex-none px-4 py-2 border rounded-lg text-xs font-bold transition-all
                          ${staff.isDisabled ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {staff.isDisabled ? 'Enable' : 'Disable'}
                      </button>
                      <button onClick={() => { setEditingStaff(staff); setShowStaffModal(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 rounded-lg text-xs font-bold transition-all">Edit</button>
                      
                      {staff.role === 'TEAM_LEADER' && staff.teamName && (
                        <button onClick={async () => {
                          if (!window.confirm(`Are you SURE you want to completely wipe out ALL participants and entries for Team "${staff.teamName}" from EVERY program? This action CANNOT be undone.`)) return;
                          
                          const updatePromises = programs.map(async (p) => {
                            if (!p.teams) return;
                            const newTeams = p.teams.filter(t => t.teamName.toLowerCase() !== staff.teamName!.toLowerCase());
                            if (newTeams.length !== p.teams.length) {
                              await updateProgram(p.id, { teams: newTeams });
                            }
                          });
                          await Promise.all(updatePromises);
                          alert(`Team "${staff.teamName}" data wiped from all programs.`);
                        }} className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all" title="Delete Team from all Programs">Wipe Team</button>
                      )}
                      
                      <button onClick={() => confirmDeleteStaff(staff.id, staff.username)} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all">Delete Staff</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
             
      <ProgramFormModal show={showProgramModal} onClose={() => { setShowProgramModal(false); setEditingProgram(null); setIsGroup(false); }} onSave={handleSaveProgram} editingProgram={editingProgram} isGroup={isGroup} setIsGroup={setIsGroup} categories={settings?.categories || CATEGORIES} zones={settings?.zones || ZONES} />
      
      <BulkUploadModal show={showBulkUploadModal} onClose={() => setShowBulkUploadModal(false)} addProgram={addProgram} programs={programs} updateProgram={updateProgram} />

      <StaffCredentialModal 
         festId={programs[0]?.festId || 'default-fest'}
         isOpen={showStaffModal}
         onClose={() => { setShowStaffModal(false); setEditingStaff(null); }}
         onSave={handleSaveStaff}
        editingStaff={editingStaff}
      />

      {/* Styled Modern Custom Modal */}
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
                <h4 className="text-sm font-black text-slate-900">{modalConfig.title || 'Confirmation'}</h4>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed pl-1">{modalConfig.message}</p>
                         
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (modalConfig.onConfirm) await modalConfig.onConfirm();
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
                {modalConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
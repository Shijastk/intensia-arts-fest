import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, Staff } from '../types';
import { StaffCredentialModal } from '../components/StaffCredentialModal';
import { ProgramList } from '../components/ProgramList';
import { ParticipantList } from '../components/ParticipantList';
import { ProgramFormModal } from '../components/ProgramFormModal';
import { ConsolidationView } from '../components/ConsolidationView';
import { ScheduleManager } from '../components/ScheduleManager';
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
}

export const AdminPage: React.FC<AdminPageProps> = ({
  programs, setPrograms, addProgram, updateProgram, deleteProgram,
  staffs, addStaff, updateStaff, deleteStaff, settings
}) => {
  // Added 'results' and 'scheduler' to the state
  const [subTab, setSubTab] = useState<'tracker' | 'scheduler' | 'performers' | 'requests' | 'staff' | 'results'>('tracker');
  const [showProgramModal, setShowProgramModal] = useState(false);
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
    if (editingProgram) await updateProgram(editingProgram.id, programData);
    else await addProgram(programData as Omit<Program, 'id' | 'festId'>);
    setShowProgramModal(false);
    setEditingProgram(null);
    setIsGroup(false);
  };

  const handleSaveStaff = async (staffData: Omit<Staff, 'id'>, editId?: string) => {
    if (editId) {
      await updateStaff(editId, staffData);
    } else {
      await addStaff(staffData);
    }
  };

  const confirmDeleteStaff = (id: string, username: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete staff account "${username}"? This action cannot be undone.`,
      onConfirm: async () => {
        await deleteStaff(id);
        setStaffDeleteId(null);
      }
    });
  };

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
        <div className="flex gap-3">
          <button 
            onClick={() => { setEditingProgram(null); setIsGroup(false); setShowProgramModal(true); }} 
            className="px-6 py-3 bg-[#3B3BFA] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add Event
          </button>
        </div>
      </div>
      
      {/* TABS NAVIGATION - Image 1 Style */}
      <div className="flex justify-between items-center bg-white rounded-2xl px-2 shadow-sm border border-slate-100 overflow-x-auto custom-scrollbar">
        {[
          { id: 'tracker', label: 'Tracker', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
          { id: 'scheduler', label: 'Scheduler', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { id: 'results', label: 'Live Results', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
          { id: 'performers', label: 'Performers', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
          { id: 'requests', label: 'Requests', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
          { id: 'staff', label: 'Staff Access', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-5 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-[3px] transition-all
              ${subTab === tab.id ? 'border-[#3B3BFA] text-[#3B3BFA]' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'requests' && pendingRequests.length > 0 && (
              <span className="bg-[#3B3BFA] text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{pendingRequests.length}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* TAB CONTENT */}
      <div>
        {subTab === 'tracker' && <ProgramList programs={programs} setPrograms={setPrograms} deleteProgram={deleteProgram} updateProgram={updateProgram} onEdit={(p) => { setEditingProgram(p); setShowProgramModal(true); }} />}
        
        {subTab === 'scheduler' && <ScheduleManager programs={programs} updateProgram={updateProgram} />}
        
        {/* NEW TAB RENDER LOGIC */}
        {subTab === 'results' && (
          <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
            <ConsolidationView programs={programs} />
          </div>
        )}

        {subTab === 'performers' && <ParticipantList programs={programs} />}
                 
        {subTab === 'requests' && (
          <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden divide-y divide-slate-100">
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

        {subTab === 'staff' && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Registered Staff ({staffs?.length || 0})</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Manage access for Green Room, Judges & Leaders</p>
              </div>
              <button onClick={() => { setEditingStaff(null); setShowStaffModal(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition-all">+ Add Staff</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {(!staffs || staffs.length === 0) ? (
                 <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No staff accounts created yet.</div>
              ) : (
                staffs.map(staff => (
                  <div key={staff.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-black border ${staff.role === 'JUDGE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : staff.role === 'TEAM_LEADER' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                        <span className="text-[9px] uppercase">{staff.role === 'GREEN_ROOM' ? 'GR' : staff.role === 'JUDGE' ? 'JDG' : 'LDR'}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">{staff.username}</h4>
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
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => { setEditingStaff(staff); setShowStaffModal(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 rounded-lg text-xs font-bold transition-all">Edit</button>
                      <button onClick={() => confirmDeleteStaff(staff.id, staff.username)} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
             
      <ProgramFormModal show={showProgramModal} onClose={() => { setShowProgramModal(false); setEditingProgram(null); setIsGroup(false); }} onSave={handleSaveProgram} editingProgram={editingProgram} isGroup={isGroup} setIsGroup={setIsGroup} categories={settings?.categories || CATEGORIES} zones={ZONES} />
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
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-rose-100 text-rose-600">
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
                onClick={() => {
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                  setModalConfig(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-sm bg-rose-600 hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
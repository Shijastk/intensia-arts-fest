import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, ParticipantSummary, CustomProgramScore } from '../types';
import { ProgramAccordion } from './ProgramAccordion';

interface ProgramListProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    deleteProgram?: (id: string) => Promise<boolean>;
    updateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
    onEdit: (program: Program) => void;
    customScores?: Record<string, CustomProgramScore>;
}

export const ProgramList: React.FC<ProgramListProps> = ({ 
    programs, 
    setPrograms, 
    deleteProgram, 
    updateProgram, 
    onEdit,
    customScores
}) => {
    const [filter, setFilter] = useState<ProgramStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'time' | 'category'>('name');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);
    
    const [cancelProgramId, setCancelProgramId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
    const [deleteMessage, setDeleteMessage] = useState('');

    const participantSummaries: ParticipantSummary[] = useMemo(() => {
        const map = new Map<string, ParticipantSummary>();
        
        (programs || []).forEach(prog => {
            (prog.teams || []).forEach(team => {
                (team.participants || []).forEach(p => {
                    if (!map.has(p.chestNumber)) {
                        map.set(p.chestNumber, {
                            name: p.name,
                            chestNumber: p.chestNumber,
                            teamName: team.teamName,
                            programCount: 0,
                            programNames: [],
                            achievements: [],
                            totalWins: 0
                        });
                    }
                    const summary = map.get(p.chestNumber)!;
                    summary.programCount++;
                    summary.programNames.push(prog.name);
                    
                    if (team.rank === 1) summary.totalWins++;
                    if (team.rank) summary.achievements.push({ programName: prog.name, rank: team.rank });
                });
            });
        });
        return Array.from(map.values());
    }, [programs]);

    const selectedParticipant = useMemo(() =>
        selectedParticipantName ? participantSummaries.find(p => p.name === selectedParticipantName) : null
    , [selectedParticipantName, participantSummaries]);

    const filteredPrograms = useMemo(() => {
        return (programs || [])
            .filter(p => filter === 'ALL' || p.status === filter)
            .filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
                if (sortBy === 'time') return (a.startTime || '').localeCompare(b.startTime || '');
                return (a.category || '').localeCompare(b.category || '');
            });
    }, [programs, filter, searchTerm, sortBy]);

    const handleDeleteRequest = (id: string) => {
        const program = programs.find(p => p.id === id);
        if (program?.isAllocatedToJudge || program?.status === ProgramStatus.JUDGING) {
            alert('Cannot delete: This program has been allocated to a Judge Panel. You cannot delete an active judging program.');
            return;
        }
        setDeleteConfirmId(id);
        setDeleteStatus('idle');
    };

    const handleStatusUpdate = async (id: string, newStatus: ProgramStatus) => {
        const program = programs.find(p => p.id === id);
        if (!program) return;

        if (newStatus === ProgramStatus.CANCELLED && program.isAllocatedToJudge) {
            alert('Cannot cancel: This program has been allocated to a Judge Panel. Please recall it from the judge panel first.');
            return;
        }

        if (updateProgram) {
            const success = await updateProgram(id, { status: newStatus });
            if (!success) {
                console.error('Failed to update status');
            }
        } else {
            setPrograms(p => p.map(x => x.id === id ? { ...x, status: newStatus } : x));
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return;
        const program = programs.find(p => p.id === deleteConfirmId);
        const programName = program?.name || 'this program';
        setDeleteStatus('deleting');

        if (deleteProgram) {
            const success = await deleteProgram(deleteConfirmId);
            if (success) {
                setDeleteStatus('success');
                setDeleteMessage(`Program "${programName}" has been deleted successfully!`);
                setTimeout(() => {
                    setDeleteConfirmId(null);
                    setDeleteStatus('idle');
                }, 2000);
            } else {
                setDeleteStatus('error');
                setDeleteMessage('Failed to delete program from database. Please try again.');
            }
        } else {
            setPrograms(p => p.filter(x => x.id !== deleteConfirmId));
            setDeleteStatus('success');
            setDeleteMessage(`Program "${programName}" has been removed!`);
            setTimeout(() => {
                setDeleteConfirmId(null);
                setDeleteStatus('idle');
            }, 2000);
        }
    };

    const handlePublish = async (id: string) => {
        const program = programs.find(p => p.id === id);
        if (!program) return;
        const newPublishedState = !program.isPublished;
        const updates: any = { isPublished: newPublishedState };

        if (!newPublishedState && program.status === ProgramStatus.JUDGING) {
            if (window.confirm('This program is currently assigned to a judge. Recalling it will remove it from the judge\'s panel and reset it to PENDING. Continue?')) {
                updates.status = ProgramStatus.PENDING;
                updates.isAllocatedToJudge = false;
            } else {
                return; 
            }
        }

        if (updateProgram) {
            const success = await updateProgram(id, updates);
            if (!success) console.error('Failed to update publish status');
        } else {
            setPrograms(p => p.map(x => x.id === id ? { ...x, ...updates } : x));
        }
    };

    return (
        <>
            {/* METRIC CARDS - Image 1 Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">Total Events</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none my-1">{programs.length}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold hidden xl:block truncate">Across all categories</p>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
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
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
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
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
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

            <div className="bg-white rounded-xl border border-slate-200 p-4 text-left shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Search events..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#3B3BFA]/20 focus:border-[#3B3BFA] transition-all" 
                        />
                        <svg className="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value as any)} 
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer focus:ring-2 focus:ring-[#3B3BFA]/20 focus:border-[#3B3BFA] transition-all"
                    >
                        <option value="ALL">All States</option>
                        {Object.values(ProgramStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* TABLE HEADER - Image 1 Style */}
                <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 gap-4">
                    <div className="flex-1 pl-12">Event</div>
                    <div className="w-[100px] text-center">Category</div>
                    <div className="w-[100px] text-center">Status</div>
                    <div className="w-[340px] text-right pr-2">Actions</div>
                </div>

                <div className="space-y-3">
                            {filteredPrograms.map(prog => (
                                <ProgramAccordion
                                    key={prog.id} 
                                    program={prog}
                                    onUpdateStatus={handleStatusUpdate}
                                    onDelete={handleDeleteRequest}
                                    onEdit={onEdit}
                                    onSelectParticipant={setSelectedParticipantName}
                                    onPublish={handlePublish}
                                    onPublishResult={async (id) => {
                                        const program = programs.find(p => p.id === id);
                                        if (!program) return;
                                        const newResultState = !program.isResultPublished;
                                        if (updateProgram) {
                                            await updateProgram(id, { isResultPublished: newResultState });
                                        } else {
                                            setPrograms(p => p.map(x => x.id === id ? { ...x, isResultPublished: newResultState } : x));
                                        }
                                    }}
                                    onRequestCancel={setCancelProgramId}
                                    onUpdateProgram={updateProgram}
                                    customScores={customScores}
                                />
                            ))}
                            {filteredPrograms.length === 0 && (
                                <div className="text-center py-12 text-slate-400 text-sm font-bold uppercase tracking-widest">No events found.</div>
                            )}
                        </div>
            </div>



            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[380px] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 px-6 py-12 text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-2xl">
                                <span className="text-3xl font-black">{selectedParticipant.name.charAt(0)}</span>
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">{selectedParticipant.name}</h4>
                            <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">
                                Chest #{selectedParticipant.chestNumber} &bull; {selectedParticipant.teamName}
                            </p>
                        </div>
                        <div className="p-8 text-left">
                            <div className="grid grid-cols-2 gap-4 mb-8 -mt-16">
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 text-center">
                                    <span className="block text-2xl font-black text-slate-800">{selectedParticipant.programCount}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Events</span>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 text-center">
                                    <span className="block text-2xl font-black text-emerald-600">{selectedParticipant.totalWins}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prizes</span>
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-3 mb-4">Event History</p>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                {selectedParticipant.programNames.map((pn, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                        <span className="text-xs font-bold text-slate-700 truncate uppercase">{pn}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setSelectedParticipantName(null)} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                                Close Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] p-8 text-center border border-slate-200">
                        {deleteStatus === 'idle' && (
                            <>
                                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Delete Program?</h3>
                                <p className="text-sm text-slate-600 mb-2 font-bold">{programs.find(p => p.id === deleteConfirmId)?.name}</p>
                                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                    This will permanently delete the program from the database.<br />
                                    All participants, scores, and data will be removed.<br />
                                    <span className="text-rose-600 font-bold">This action cannot be undone!</span>
                                </p>
                                <div className="flex gap-4">
                                    <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleDeleteConfirm} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all">
                                        Delete Forever
                                    </button>
                                </div>
                            </>
                        )}
                        {deleteStatus === 'deleting' && (
                            <>
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="animate-spin w-10 h-10" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Deleting...</h3>
                                <p className="text-sm text-slate-500">Please wait while we remove the program from the database.</p>
                            </>
                        )}
                        {deleteStatus === 'success' && (
                            <>
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-emerald-900 mb-3 uppercase tracking-tight">Deleted!</h3>
                                <p className="text-sm text-slate-600">{deleteMessage}</p>
                            </>
                        )}
                        {deleteStatus === 'error' && (
                            <>
                                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-rose-900 mb-3 uppercase tracking-tight">Error!</h3>
                                <p className="text-sm text-slate-600 mb-6">{deleteMessage}</p>
                                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {cancelProgramId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[360px] p-8 text-center border border-slate-200">
                        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Void Event?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Confirm cancellation of this program. All data remains stored for audit.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setCancelProgramId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Dismiss</button>
                            <button onClick={() => { setPrograms(p => p.map(x => x.id === cancelProgramId ? { ...x, status: ProgramStatus.CANCELLED } : x)); setCancelProgramId(null); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all">Confirm Void</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, FestivalStats } from '../types';
import { MetricsCard } from '../components/MetricsCard';
import { ProgramList } from '../components/ProgramList';
import { ParticipantList } from '../components/ParticipantList';
import { ProgramFormModal } from '../components/ProgramFormModal';
import { LiveLeaderboard } from '../components/LiveLeaderboard';
import { fixTeamAssignments, generateFixReport } from '../utils/teamDataFixer';

interface AdminPageProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    addProgram: (program: Omit<Program, 'id'>) => Promise<boolean>;
    updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
    deleteProgram: (id: string) => Promise<boolean>;
    onShowModal?: () => void;
}

const CATEGORIES = [
    "A zone stage",
    "A zone no stage",
    "A zone general stage",
    "A zone general non stage"
];

export const AdminPage: React.FC<AdminPageProps> = ({ programs, setPrograms, addProgram, updateProgram, deleteProgram, onShowModal }) => {
    const [adminSubView, setAdminSubView] = useState<'PROGRAMS' | 'PARTICIPANTS'>('PROGRAMS');
    const [showModal, setShowModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [isGroup, setIsGroup] = useState(false);
    const [showFixModal, setShowFixModal] = useState(false);
    const [isFixing, setIsFixing] = useState(false);

    // Expose setShowModal to parent if callback provided
    React.useEffect(() => {
        if (onShowModal) {
            (window as any).__openAdminModal = () => {
                setEditingProgram(null);
                setIsGroup(false);
                setShowModal(true);
            };
        }
    }, [onShowModal]);

    const stats: FestivalStats = useMemo(() => {
        const total = programs.length;
        const completed = programs.filter(p => p.status === ProgramStatus.COMPLETED).length;
        const pending = programs.filter(p => p.status === ProgramStatus.PENDING).length;
        const cancelled = programs.filter(p => p.status === ProgramStatus.CANCELLED).length;
        const participantsSet = new Set();
        programs.forEach(p => p.teams.forEach(t => t.participants.forEach(pr => participantsSet.add(pr.name))));

        return {
            totalPrograms: total, completedCount: completed, pendingCount: pending,
            cancelledCount: cancelled, totalParticipants: participantsSet.size, averageScore: 0
        };
    }, [programs]);

    const handleSaveProgram = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const category = formData.get('category') as string;
        const startTime = formData.get('startTime') as string;
        const venue = formData.get('venue') as string;
        const participantsCount = parseInt(formData.get('participantsCount') as string || '0');
        const membersPerGroup = parseInt(formData.get('membersPerGroup') as string || '0');
        const groupCount = parseInt(formData.get('groupCount') as string || '0');

        if (editingProgram) {
            // Update existing program in Firebase
            const success = await updateProgram(editingProgram.id, {
                name, category, startTime, venue, participantsCount, isGroup, membersPerGroup, groupCount
            });
            if (!success) {
                console.error('Failed to update program');
                return;
            }
        } else {
            // Create new program in Firebase
            const newProgram: Omit<Program, 'id'> = {
                name, category, startTime, venue,
                status: ProgramStatus.PENDING,
                teams: [], description: '', participantsCount, isGroup, membersPerGroup, groupCount,
                isPublished: false, isAllocatedToJudge: false
            };
            const success = await addProgram(newProgram);
            if (!success) {
                console.error('Failed to add program');
                return;
            }
        }
        setShowModal(false);
        setEditingProgram(null);
    };

    const handleFixTeamData = async () => {
        if (!confirm('This will reorganize all participants into correct teams based on chest numbers.\n\nPRUDENTIA: 200-299\nSAPIENTIA: 300-399\n\nAll scores and data will be preserved.\n\nContinue?')) {
            return;
        }

        setIsFixing(true);
        try {
            // Generate report first
            const report = generateFixReport(programs);

            if (report.movedParticipants.length === 0) {
                alert('No changes needed! All participants are already in correct teams.');
                setShowFixModal(false);
                setIsFixing(false);
                return;
            }

            // Apply fixes
            const fixedPrograms = fixTeamAssignments(programs);

            // Update each program in Firebase
            const updates: Promise<boolean>[] = [];
            fixedPrograms.forEach(program => {
                updates.push(updateProgram(program.id, { teams: program.teams }));
            });

            await Promise.all(updates);

            alert(`✅ Team Data Fixed Successfully!\n\n${report.movedParticipants.length} participants moved across ${report.affectedPrograms} programs.\n\nPlease check the Team Leader pages to verify.`);
            setShowFixModal(false);
        } catch (error) {
            console.error('Error fixing team data:', error);
            alert('❌ Failed to fix team data. Please try again or contact support.');
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <>
            {/* Header with New Event Button */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Admin Dashboard</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage programs, participants, and festival operations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFixModal(true)}
                        className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                        title="Fix team assignments based on chest numbers"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Fix Team Data
                    </button>
                    <button
                        onClick={() => { setEditingProgram(null); setIsGroup(false); setShowModal(true); }}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        New Event
                    </button>
                </div>
            </div>

            {/* Live Leaderboard */}
            <LiveLeaderboard programs={programs} />

            {/* Existing Metrics and View Toggle */}

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
                <MetricsCard label="Programs" value={stats.totalPrograms} colorClass="bg-indigo-50 text-indigo-600" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
                <MetricsCard label="Performers" value={stats.totalParticipants} colorClass="bg-violet-50 text-violet-600" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
                <MetricsCard label="Completed" value={stats.completedCount} colorClass="bg-emerald-50 text-emerald-600" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>} />
                <MetricsCard label="Waitlist" value={stats.pendingCount} colorClass="bg-amber-50 text-amber-600" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </section>

            <div className="mb-6 flex space-x-6 border-b border-slate-200">
                <button onClick={() => setAdminSubView('PROGRAMS')} className={`pb-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${adminSubView === 'PROGRAMS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Programs Tracker</button>
                <button onClick={() => setAdminSubView('PARTICIPANTS')} className={`pb-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${adminSubView === 'PARTICIPANTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>All Performers</button>
            </div>

            {adminSubView === 'PROGRAMS' ? (
                <ProgramList programs={programs} setPrograms={setPrograms} deleteProgram={deleteProgram} updateProgram={updateProgram} onEdit={(p) => { setEditingProgram(p); setIsGroup(p.isGroup); setShowModal(true); }} />
            ) : (
                <ParticipantList programs={programs} />
            )}

            <ProgramFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSaveProgram}
                editingProgram={editingProgram}
                isGroup={isGroup}
                setIsGroup={setIsGroup}
                categories={CATEGORIES}
            />

            {/* Fix Team Data Modal */}
            {showFixModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-200">
                        <div className="bg-amber-600 px-6 py-4 flex justify-between items-center text-white sticky top-0">
                            <h3 className="text-sm font-black uppercase tracking-widest">Fix Team Assignments</h3>
                            <button
                                onClick={() => setShowFixModal(false)}
                                disabled={isFixing}
                                className="opacity-70 hover:opacity-100 transition-opacity disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                            {/* Warning Banner */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-900 mb-2">What This Does</h4>
                                        <ul className="text-xs text-amber-800 space-y-1">
                                            <li>• Moves participants to correct teams based on chest numbers</li>
                                            <li>• <strong>PRUDENTIA</strong>: Chest numbers 200-299</li>
                                            <li>• <strong>SAPIENTIA</strong>: Chest numbers 300-399</li>
                                            <li>• All scores, ranks, and grades will be preserved</li>
                                            <li>• Changes will be reflected in Team Leader pages immediately</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Preview Changes</h4>
                                {(() => {
                                    const report = generateFixReport(programs);

                                    if (report.movedParticipants.length === 0) {
                                        return (
                                            <div className="text-center py-8 bg-green-50 rounded-xl border border-green-200">
                                                <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm font-bold text-green-900">All participants are already in correct teams!</p>
                                                <p className="text-xs text-green-700 mt-1">No changes needed.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <>
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div>
                                                        <p className="text-2xl font-black text-indigo-600">{report.totalPrograms}</p>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Total Programs</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-black text-amber-600">{report.affectedPrograms}</p>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Will Be Updated</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-black text-violet-600">{report.movedParticipants.length}</p>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Participants Moved</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {report.movedParticipants.map((move, idx) => (
                                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-slate-900">{move.name}</p>
                                                            <p className="text-xs text-slate-500">Chest: {move.chestNumber} • {move.programName}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold">{move.from}</span>
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                            </svg>
                                                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">{move.to}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowFixModal(false)}
                                disabled={isFixing}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFixTeamData}
                                disabled={isFixing || generateFixReport(programs).movedParticipants.length === 0}
                                className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isFixing ? 'Processing...' : 'Apply Fix'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

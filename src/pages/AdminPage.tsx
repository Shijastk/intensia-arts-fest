import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, FestivalStats } from '../types';
import { MetricsCard } from '../components/MetricsCard';
import { ProgramList } from '../components/ProgramList';
import { ParticipantList } from '../components/ParticipantList';
import { ProgramFormModal } from '../components/ProgramFormModal';
import { AIInsights } from '../components/AIInsights';

interface AdminPageProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    onShowModal?: () => void;
}

const CATEGORIES = [
    "A zone stage",
    "A zone no stage",
    "A zone general stage",
    "A zone general non stage"
];

export const AdminPage: React.FC<AdminPageProps> = ({ programs, setPrograms, onShowModal }) => {
    const [adminSubView, setAdminSubView] = useState<'PROGRAMS' | 'PARTICIPANTS'>('PROGRAMS');
    const [showModal, setShowModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [isGroup, setIsGroup] = useState(false);

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

    const handleSaveProgram = (e: React.FormEvent<HTMLFormElement>) => {
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
            setPrograms(prev => prev.map(p => p.id === editingProgram.id ? {
                ...p, name, category, startTime, venue, participantsCount, isGroup, membersPerGroup, groupCount
            } : p));
        } else {
            const newProgram: Program = {
                id: `p-${Date.now()}`,
                name, category, startTime, venue,
                status: ProgramStatus.PENDING,
                teams: [], description: '', participantsCount, isGroup, membersPerGroup, groupCount,
                isPublished: false, isAllocatedToJudge: false
            };
            setPrograms(prev => [...prev, newProgram]);
        }
        setShowModal(false);
        setEditingProgram(null);
    };

    return (
        <>
            {/* Header with New Event Button */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Admin Dashboard</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage programs, participants, and festival operations</p>
                </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-4">
                        <ProgramList programs={programs} setPrograms={setPrograms} onEdit={(p) => { setEditingProgram(p); setIsGroup(p.isGroup); setShowModal(true); }} />
                    </div>
                    <div className="lg:col-span-4 text-left">
                        <AIInsights programs={programs} />
                    </div>
                </div>
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
        </>
    );
};

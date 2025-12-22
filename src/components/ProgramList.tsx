import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, ParticipantSummary } from '../types';
import { ProgramAccordion } from './ProgramAccordion';

interface ProgramListProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    onEdit: (program: Program) => void;
}

export const ProgramList: React.FC<ProgramListProps> = ({ programs, setPrograms, onEdit }) => {
    const [filter, setFilter] = useState<ProgramStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'time' | 'category'>('name');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);
    const [cancelProgramId, setCancelProgramId] = useState<string | null>(null);

    const participantSummaries: ParticipantSummary[] = useMemo(() => {
        const map = new Map<string, ParticipantSummary>();
        programs.forEach(p => {
            p.teams.forEach(t => {
                t.participants.forEach(pt => {
                    const entry = map.get(pt.name) || {
                        name: pt.name, chestNumber: pt.chestNumber, teamName: t.teamName,
                        programCount: 0, programNames: [], achievements: [], totalWins: 0
                    };
                    if (!entry.programNames.includes(p.name)) {
                        entry.programNames.push(p.name);
                        entry.programCount++;
                    }
                    if (p.status === ProgramStatus.COMPLETED && t.rank && t.rank <= 3) {
                        entry.achievements.push({ programName: p.name, rank: t.rank });
                        entry.totalWins++;
                    }
                    map.set(pt.name, entry);
                });
            });
        });
        return Array.from(map.values());
    }, [programs]);

    const selectedParticipant = useMemo(() =>
        selectedParticipantName ? participantSummaries.find(p => p.name === selectedParticipantName) : null
        , [selectedParticipantName, participantSummaries]);

    const filteredPrograms = useMemo(() => {
        let result = filter === 'ALL' ? [...programs] : programs.filter(p => p.status === filter);
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.teams.some(t => t.participants.some(pt => pt.name.toLowerCase().includes(lower)))
            );
        }
        return result.sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (a.startTime || '').localeCompare(b.startTime || ''));
    }, [programs, filter, searchTerm, sortBy]);

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-left shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <input type="text" placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                        <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer">
                        <option value="ALL">All States</option>
                        {Object.values(ProgramStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-3">
                    {filteredPrograms.map(prog => (
                        <ProgramAccordion
                            key={prog.id} program={prog}
                            onUpdateStatus={(id, s) => setPrograms(p => p.map(x => x.id === id ? { ...x, status: s } : x))}
                            onDelete={id => setPrograms(p => p.filter(x => x.id !== id))}
                            onEdit={onEdit}
                            onSelectParticipant={setSelectedParticipantName}
                            onPublish={id => setPrograms(p => p.map(x => x.id === id ? { ...x, isPublished: !x.isPublished } : x))}
                            onRequestCancel={setCancelProgramId}
                        />
                    ))}
                </div>
            </div>

            {/* Participant Profile Modal */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[380px] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="bg-indigo-600 px-6 py-12 text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-2xl">
                                <span className="text-3xl font-black">{selectedParticipant.name.charAt(0)}</span>
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">{selectedParticipant.name}</h4>
                            <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">Chest #{selectedParticipant.chestNumber} &bull; {selectedParticipant.teamName}</p>
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
                            <button onClick={() => setSelectedParticipantName(null)} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">Close Dashboard</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Program Modal */}
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

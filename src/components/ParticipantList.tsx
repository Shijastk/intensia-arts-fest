import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus, ParticipantSummary } from '../types';

interface ParticipantListProps {
    programs: Program[];
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ programs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [participantSortBy, setParticipantSortBy] = useState<'name' | 'chest' | 'team'>('name');
    const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);

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

    const sortedAndFilteredParticipants = useMemo(() => {
        let result = [...participantSummaries];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.chestNumber.toLowerCase().includes(lower) ||
                p.teamName.toLowerCase().includes(lower)
            );
        }

        result.sort((a, b) => {
            switch (participantSortBy) {
                case 'chest':
                    return a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true });
                case 'team':
                    return a.teamName.localeCompare(b.teamName);
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return result;
    }, [participantSummaries, searchTerm, participantSortBy]);

    const selectedParticipant = useMemo(() =>
        selectedParticipantName ? participantSummaries.find(p => p.name === selectedParticipantName) : null
        , [selectedParticipantName, participantSummaries]);

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Performer Database ({sortedAndFilteredParticipants.length})</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Search and sort verified festival participants.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search performers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
                            />
                            <svg className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setParticipantSortBy('name')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${participantSortBy === 'name' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Name</button>
                            <button onClick={() => setParticipantSortBy('chest')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${participantSortBy === 'chest' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Chest #</button>
                            <button onClick={() => setParticipantSortBy('team')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${participantSortBy === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Group</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedAndFilteredParticipants.map(p => (
                        <div key={`${p.name}-${p.chestNumber}`} className="group p-4 bg-white rounded-xl border border-slate-100 hover:border-indigo-400 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{p.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Chest: {p.chestNumber}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase shrink-0 ml-2">{p.programCount} Regs</span>
                            </div>
                            <div className="mt-3 space-y-1">
                                <p className="text-[9px] font-bold text-indigo-500 uppercase truncate mb-2">{p.teamName}</p>
                                {p.programNames.slice(0, 2).map(pn => (
                                    <div key={pn} className="text-[9px] text-slate-500 font-medium bg-slate-50 p-1.5 rounded truncate border border-slate-100/50">{pn}</div>
                                ))}
                                {p.programNames.length > 2 && <p className="text-[8px] text-slate-400 font-black ml-1">+ {p.programNames.length - 2} more events</p>}
                            </div>
                            <button onClick={() => setSelectedParticipantName(p.name)} className="mt-4 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-all">View Full Profile</button>
                        </div>
                    ))}
                </div>
                {sortedAndFilteredParticipants.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Performers Found</p>
                        <p className="text-xs text-slate-300 mt-1">Try a different search term or filter.</p>
                    </div>
                )}
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
        </>
    );
};

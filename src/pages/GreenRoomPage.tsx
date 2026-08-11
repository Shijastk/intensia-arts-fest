import React, { useEffect, useState } from 'react';
import { Program, ProgramStatus } from '../types';
import { GreenRoomProgramCard } from '../components/GreenRoomProgramCard';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { calculateLeaderboardStats } from '../utils/statsCalculator';

interface GreenRoomPageProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...(array || [])];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const extractZone = (category: string): string => {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('a zone')) return 'A';
    if (catLower.includes('b zone')) return 'B';
    if (catLower.includes('c zone')) return 'C';
    return 'General';
};

const getGroupResults = (teams: any[]) => {
  const results = teams.filter(t => (t.rank && t.rank > 0) || (t.points && t.points > 0)).map(team => {
    return {
      name: team.teamName,
      teamName: team.teamName,
      points: team.points || 0,
      rank: team.rank || 999
    };
  });
  return results.sort((a, b) => a.rank - b.rank).slice(0, 3);
};

const getIndividualResults = (teams: any[]) => {
  const participants: any[] = [];
  teams.forEach(team => {
    team.participants?.forEach((p: any) => {
      if ((p.rank && p.rank > 0) || (p.points && p.points > 0)) {
        participants.push({
          name: p.name,
          teamName: team.teamName,
          points: p.points || 0,
          rank: p.rank || 999
        });
      }
    });
  });
  return participants.sort((a, b) => a.rank - b.rank).slice(0, 3);
};

const getWinnerNode = (results: any[], targetRank: number) => {
    const winner = results.find(r => r.rank === targetRank);
    if (!winner) return <span className="text-slate-300 text-xs italic">-</span>;
    return (
        <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 truncate max-w-[200px]" title={winner.name}>{winner.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate max-w-[200px]">{winner.teamName}</span>
        </div>
    );
};

export const GreenRoomPage: React.FC<GreenRoomPageProps> = ({ programs, setPrograms, updateProgram }) => {
    const [judgePanels, setJudgePanels] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'PROGRAMS' | 'GALLERY' | 'STATUS'>('PROGRAMS');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const festId = programs?.[0]?.festId;
        if (!festId) return;

        const staffRef = ref(db, `fests/${festId}/staff`);
        const unsubscribe = onValue(staffRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const panels = new Set<string>();
                Object.values(data).forEach((staff: any) => {
                    if (staff?.role?.toUpperCase() === 'JUDGE' && staff?.judgePanel) {
                        panels.add(staff.judgePanel);
                    }
                });
                setJudgePanels(Array.from(panels));
            } else {
                setJudgePanels([]);
            }
        });
        return () => unsubscribe();
    }, [programs]);

    const assignShuffledCodes = async (programId: string, participantChestToReveal?: string) => {
        const program = (programs || []).find(p => p.id === programId);
        if (!program) return;

        let updatedTeams;
        const teams = program.teams || [];

        if (program.isGroup) {
            const memberLimit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;
            let totalSubTeams = 0;
            teams.forEach(t => {
                if ((t?.participants || []).length > 0) {
                    totalSubTeams += Math.ceil(t.participants.length / memberLimit);
                }
            });

            const pool: string[] = [];
            for (let i = 0; i < totalSubTeams; i++) {
                pool.push(String.fromCharCode(65 + i));
            }
            const shuffledPool = shuffleArray(pool);
            let letterIdx = 0;

            updatedTeams = teams.map(t => {
                const pList = t?.participants || [];
                if (pList.length === 0) return t;

                const newParticipants: any[] = [];
                for (let i = 0; i < pList.length; i += memberLimit) {
                    const chunk = pList.slice(i, i + memberLimit);
                    const existingCode = chunk.find(p => p?.codeLetter)?.codeLetter;
                    const chunkCode = existingCode || shuffledPool[letterIdx++];
                    const isChunkBeingRevealed = participantChestToReveal && chunk.some(p => p?.chestNumber === participantChestToReveal);

                    const processedChunk = chunk.map(pt => {
                        const shouldReveal = pt?.isCodeRevealed || isChunkBeingRevealed;
                        return {
                            ...pt,
                            codeLetter: chunkCode,
                            isCodeRevealed: shouldReveal || false
                        };
                    });
                    newParticipants.push(...processedChunk);
                }
                return { ...t, participants: newParticipants };
            });
        } else {
            const allParticipants = teams.reduce((acc: any[], t) => acc.concat(t?.participants || []), []);
            const totalCount = allParticipants.length;

            const pool: string[] = [];
            for (let i = 0; i < totalCount; i++) {
                pool.push(String.fromCharCode(65 + i));
            }
            const shuffledPool = shuffleArray(pool);
            let letterIdx = 0;

            updatedTeams = teams.map(t => ({
                ...t,
                participants: (t?.participants || []).map(pt => {
                    const newCode = pt?.codeLetter || shuffledPool[letterIdx++];
                    const shouldReveal = pt?.isCodeRevealed || (participantChestToReveal && pt?.chestNumber === participantChestToReveal);
                    return {
                        ...pt,
                        codeLetter: newCode,
                        isCodeRevealed: shouldReveal || false
                    };
                })
            }));
        }
        await updateProgram(programId, { teams: updatedTeams });
    };

    const revealCode = async (programId: string, participantChest: string) => {
        const program = (programs || []).find(p => p.id === programId);
        if (!program) return;

        const teams = program.teams || [];
        let updatedTeams;

        if (program.isGroup) {
            updatedTeams = teams.map(t => {
                const targetP = (t?.participants || []).find(p => p?.chestNumber === participantChest);
                if (!targetP || !targetP.codeLetter) return t;
                const codeToReveal = targetP.codeLetter;
                return {
                    ...t,
                    participants: (t?.participants || []).map(pt =>
                        pt?.codeLetter === codeToReveal ? { ...pt, isCodeRevealed: true } : pt
                    )
                };
            });
        } else {
            updatedTeams = teams.map(t => ({
                ...t,
                participants: (t?.participants || []).map(pt =>
                    pt?.chestNumber === participantChest ? { ...pt, isCodeRevealed: true } : pt
                )
            }));
        }
        await updateProgram(programId, { teams: updatedTeams });
    };

    const allocateToJudge = async (programId: string, judgePanel: string) => {
        await updateProgram(programId, {
            status: ProgramStatus.JUDGING,
            isAllocatedToJudge: true,
            judgePanel
        });
    };

    const filteredPrograms = (programs || [])
        .filter(p => {
            const isPublished = p?.isPublished === true;
            const hasParticipants = (p?.teams || []).some(t => (t?.participants?.length ?? 0) > 0);
            const isPending = p?.status === ProgramStatus.PENDING && !p?.isAllocatedToJudge;
            const matchesSearch = !searchTerm || p?.name.toLowerCase().includes(searchTerm.toLowerCase()) || p?.category.toLowerCase().includes(searchTerm.toLowerCase());
            return isPublished && hasParticipants && isPending && matchesSearch;
        })
        .sort((a, b) => (a?.startTime || '').localeCompare(b?.startTime || ''));

    const stats = React.useMemo(() => calculateLeaderboardStats(programs), [programs]);
    const availableZones = Object.keys(stats.zones).sort();
    
    const overallTeamScoresMap: Record<string, { score: number, zone: string }> = {};
    Object.entries(stats.zones).forEach(([zoneKey, zone]: [string, any]) => {
        Object.entries(zone.teamScores as Record<string, number>).forEach(([teamName, score]) => {
            if (!overallTeamScoresMap[teamName]) {
                overallTeamScoresMap[teamName] = { score: 0, zone: zoneKey };
            }
            overallTeamScoresMap[teamName].score += score;
        });
    });
    
    const overallTeamScores = Object.entries(overallTeamScoresMap)
        .map(([name, data]) => ({ name, score: data.score, zone: data.zone }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    const completedPrograms = (programs || []).filter(p => p?.status === ProgramStatus.COMPLETED && p?.isResultPublished).reverse();

    const getTeamStyle = (index: number, isLeader: boolean) => {
        if (isLeader) {
            return {
                container: 'bg-[#2563eb] shadow-lg shadow-blue-500/20',
                name: 'text-blue-100',
                score: 'text-white'
            };
        }
        return {
            container: 'bg-[#f8fafc] border border-slate-100/50',
            name: 'text-slate-500',
            score: 'text-slate-800'
        };
    };

    return (
        <div className="space-y-6 text-left animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter">Green Room Control</h2>
                    <p className="text-xs text-slate-500 font-medium">Verify performer identity and scratch codes for secure judge allocation.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto w-full sm:w-auto justify-between sm:justify-start gap-1">
                        <button onClick={() => setActiveTab('PROGRAMS')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === 'PROGRAMS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Programs</button>
                        <button onClick={() => setActiveTab('STATUS')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === 'STATUS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Status</button>
                        <button onClick={() => setActiveTab('GALLERY')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === 'GALLERY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Gallery</button>
                    </div>
                    {activeTab === 'PROGRAMS' && (
                        <div className="px-4 sm:px-5 py-2 bg-indigo-600 text-white rounded-xl text-center shadow-lg shadow-indigo-100 flex-shrink-0 flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-0">
                            <p className="text-[10px] font-black uppercase leading-none opacity-80">Active Queue</p>
                            <p className="text-lg sm:text-xl font-black">{filteredPrograms.filter(p => !p?.isAllocatedToJudge && p?.status === ProgramStatus.PENDING).length}</p>
                        </div>
                    )}
                </div>
            </div>

            {activeTab === 'GALLERY' ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Gallery Upload</h2>
                    <p className="text-slate-500">Coming soon...</p>
                </div>
            ) : activeTab === 'STATUS' ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl sm:text-2xl font-black uppercase bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Overall Team Scores</h2>
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-black uppercase px-2 py-1 rounded-lg tracking-wider">
                                    After {completedPrograms.length} Results
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {overallTeamScores.map((ts, idx) => {
                                const isLeader = idx === 0 && ts.score > 0;
                                const style = getTeamStyle(idx, isLeader);
                                return (
                                    <div key={ts.name} className={`rounded-[16px] p-5 transition-all duration-300 ${style.container} ${isLeader ? 'scale-[1.02]' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className={`text-[11px] font-bold uppercase tracking-wider ${style.name}`}>{ts.name}</p>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase font-bold tracking-widest ${isLeader ? 'bg-blue-800/40 text-blue-100' : 'bg-slate-200/60 text-slate-500'}`}>
                                                {ts.zone}
                                            </span>
                                        </div>
                                        <p className={`text-3xl font-black ${style.score}`}>{ts.score.toFixed(1)}</p>
                                    </div>
                                );
                            })}
                            {overallTeamScores.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-2xl">
                                    No team scores available yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Individual Program Results Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Recent Program Results</h2>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {completedPrograms.length} Published
                            </span>
                        </div>
                        
                        <div className="flex flex-col">
                            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Details</div>
                                <div className="col-span-3 text-[10px] font-black text-amber-600 uppercase tracking-widest"><span className="text-base mr-1 drop-shadow-sm">🥇</span> 1st Place</div>
                                <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest"><span className="text-base mr-1 drop-shadow-sm">🥈</span> 2nd Place</div>
                                <div className="col-span-3 text-[10px] font-black text-orange-700 uppercase tracking-widest"><span className="text-base mr-1 drop-shadow-sm">🥉</span> 3rd Place</div>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto hide-scrollbar">
                                {completedPrograms.map((program) => {
                                    const results = program.isGroup 
                                        ? getGroupResults(program.teams || [])
                                        : getIndividualResults(program.teams || []);
                                    
                                    return (
                                        <div key={program.id} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 px-4 sm:px-6 py-5 hover:bg-slate-50/50 transition-colors group">
                                            <div className="col-span-12 lg:col-span-3 pb-4 lg:pb-0 border-b border-slate-100 lg:border-0">
                                                <h3 className="text-base font-black text-slate-900 leading-tight mb-2">{program.name}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">
                                                        {program.category}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase tracking-widest">
                                                        {program.isGroup ? 'GROUP' : 'INDIV'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-12 lg:col-span-3 flex lg:block items-center gap-4 lg:border-l lg:border-slate-100/50 lg:px-4">
                                                <span className="lg:hidden text-2xl drop-shadow-sm w-8 text-center">🥇</span>
                                                {getWinnerNode(results, 1)}
                                            </div>
                                            
                                            <div className="col-span-12 lg:col-span-3 flex lg:block items-center gap-4 lg:border-l lg:border-slate-100/50 lg:px-4">
                                                <span className="lg:hidden text-2xl drop-shadow-sm w-8 text-center">🥈</span>
                                                {getWinnerNode(results, 2)}
                                            </div>
                                            
                                            <div className="col-span-12 lg:col-span-3 flex lg:block items-center gap-4 lg:border-l lg:border-slate-100/50 lg:px-4">
                                                <span className="lg:hidden text-2xl drop-shadow-sm w-8 text-center">🥉</span>
                                                {getWinnerNode(results, 3)}
                                            </div>
                                        </div>
                                    );
                                })}
                                {completedPrograms.length === 0 && (
                                    <div className="text-center py-12 px-4 text-slate-400">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Results Published Yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search active programs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold transition-all shadow-sm"
                        />
                    </div>

                    {filteredPrograms.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mt-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">No Programs Available</h3>
                            <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">Programs will appear here when they are published by Admin and have at least one participant.</p>
                        </div>
                    ) : (
                        filteredPrograms.map((prog) => (
                            <GreenRoomProgramCard
                                key={prog.id}
                                program={prog}
                                onAssignCodes={assignShuffledCodes}
                                onRevealCode={revealCode}
                                onAllocateToJudge={allocateToJudge}
                                setPrograms={setPrograms}
                                availablePanels={judgePanels}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
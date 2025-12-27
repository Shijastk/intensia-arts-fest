import React from 'react';
import { Program, ProgramStatus } from '../types';
import { GreenRoomProgramCard } from '../components/GreenRoomProgramCard';
import { GalleryUpload } from '../components/GalleryUpload';

interface GreenRoomPageProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    updateProgram: (id: string, updates: Partial<Program>) => Promise<boolean>;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const extractZone = (category: string): string => {
    const catLower = category.toLowerCase();
    if (catLower.includes('a zone')) return 'A';
    if (catLower.includes('b zone')) return 'B';
    if (catLower.includes('c zone')) return 'C';
    return 'General';
};

export const GreenRoomPage: React.FC<GreenRoomPageProps> = ({ programs, setPrograms, updateProgram }) => {
    const assignShuffledCodes = async (programId: string, participantChestToReveal?: string) => {
        // console.log('🔵 assignShuffledCodes called for program:', programId);
        const program = programs.find(p => p.id === programId);
        if (!program) {
            console.error('❌ Program not found:', programId);
            return;
        }

        let updatedTeams;

        if (program.isGroup) {
            const memberLimit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;

            // Calculate total sub-teams
            let totalSubTeams = 0;
            program.teams.forEach(t => {
                if (t.participants.length > 0) {
                    totalSubTeams += Math.ceil(t.participants.length / memberLimit);
                }
            });
            console.log('👥 Total sub-groups:', totalSubTeams);

            const pool: string[] = [];
            for (let i = 0; i < totalSubTeams; i++) {
                pool.push(String.fromCharCode(65 + i));
            }
            const shuffledPool = shuffleArray(pool);
            // console.log('🎲 Shuffled group codes:', shuffledPool);

            let letterIdx = 0;
            updatedTeams = program.teams.map(t => {
                const hasParticipants = t.participants.length > 0;
                if (!hasParticipants) return t;

                const newParticipants: any[] = [];
                const pList = [...t.participants];

                // Process in chunks
                for (let i = 0; i < pList.length; i += memberLimit) {
                    const chunk = pList.slice(i, i + memberLimit);

                    // Check logic for this chunk
                    // 1. Does it already have a code? (Check first member)
                    const existingCode = chunk.find(p => p.codeLetter)?.codeLetter;
                    const chunkCode = existingCode || shuffledPool[letterIdx++];

                    // 2. Should we reveal this chunk?
                    const isChunkBeingRevealed = participantChestToReveal && chunk.some(p => p.chestNumber === participantChestToReveal);

                    // Map chunk members
                    const processedChunk = chunk.map(pt => {
                        const shouldReveal = pt.isCodeRevealed || isChunkBeingRevealed;
                        return {
                            ...pt,
                            codeLetter: chunkCode,
                            isCodeRevealed: shouldReveal || false
                        };
                    });
                    newParticipants.push(...processedChunk);
                }

                return {
                    ...t,
                    participants: newParticipants
                };
            });
        } else {
            const allParticipants = program.teams.flatMap(t => t.participants);
            const totalCount = allParticipants.length;
            // console.log('👥 Total participants:', totalCount);

            const pool: string[] = [];
            for (let i = 0; i < totalCount; i++) {
                pool.push(String.fromCharCode(65 + i));
            }

            const shuffledPool = shuffleArray(pool);
            // console.log('🎲 Shuffled codes:', shuffledPool);

            let letterIdx = 0;
            updatedTeams = program.teams.map(t => ({
                ...t,
                participants: t.participants.map(pt => {
                    // Determine new code letter (preserve existing if present)
                    const newCode = pt.codeLetter || shuffledPool[letterIdx++];

                    // Determine if code should be revealed
                    // Use existing reveal state OR reveal if this is the participant we just clicked
                    const shouldReveal = pt.isCodeRevealed || (participantChestToReveal && pt.chestNumber === participantChestToReveal);

                    return {
                        ...pt,
                        codeLetter: newCode,
                        isCodeRevealed: shouldReveal || false
                    };
                })
            }));
        }

        // console.log('📝 Updated teams:', JSON.stringify(updatedTeams, null, 2));

        // Save to Firebase
        // console.log('💾 Saving to Firebase...');
        const result = await updateProgram(programId, { teams: updatedTeams });
        // console.log('✅ Firebase save result:', result);
    };

    const revealCode = async (programId: string, participantChest: string) => {
        const program = programs.find(p => p.id === programId);
        if (!program) return;

        let updatedTeams;

        if (program.isGroup) {
            updatedTeams = program.teams.map(t => {
                // Find the participant to get their code
                const targetP = t.participants.find(p => p.chestNumber === participantChest);

                // If this team doesn't contain the participant, return as is
                // OR if for some reason code is missing, but that shouldn't happen here
                if (!targetP || !targetP.codeLetter) return t;

                const codeToReveal = targetP.codeLetter;

                // Reveal all participants in this team/chunk that share the same code
                return {
                    ...t,
                    participants: t.participants.map(pt =>
                        pt.codeLetter === codeToReveal ? { ...pt, isCodeRevealed: true } : pt
                    )
                };
            });
        } else {
            // Individual Program: Reveal specific participant
            updatedTeams = program.teams.map(t => ({
                ...t,
                participants: t.participants.map(pt =>
                    pt.chestNumber === participantChest ? { ...pt, isCodeRevealed: true } : pt
                )
            }));
        }

        // Save to Firebase
        await updateProgram(programId, { teams: updatedTeams });
    };

    const allocateToJudge = async (programId: string, judgePanel: string) => {
        // Save to Firebase
        await updateProgram(programId, {
            status: ProgramStatus.JUDGING,
            isAllocatedToJudge: true,
            judgePanel
        });
    };

    // Only show programs that are:
    // 1. Published (isPublished = true)
    // 2. Have at least one participant registered
    const filteredPrograms = programs
        .filter(p => {
            const isPublished = p.isPublished === true;
            const hasParticipants = p.teams.some(t => t.participants.length > 0);
            const isNotJudging = p.status !== ProgramStatus.JUDGING;
            return isPublished && hasParticipants && isNotJudging;
        })
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    // Calculate zone-wise team scores for published results
    const completedPrograms = programs.filter(p => p.status === ProgramStatus.COMPLETED && p.isResultPublished);

    const zoneScores = React.useMemo(() => {
        const scores: Record<string, { PRUDENTIA: number; SAPIENTIA: number; publishedCount: number }> = {};

        completedPrograms.forEach(program => {
            const zone = extractZone(program.category);

            if (!scores[zone]) {
                scores[zone] = { PRUDENTIA: 0, SAPIENTIA: 0, publishedCount: 0 };
            }

            scores[zone].publishedCount += 1;

            program.teams.forEach(team => {
                const teamName = team.teamName as 'PRUDENTIA' | 'SAPIENTIA';
                team.participants?.forEach(p => {
                    if (p.points != null && (teamName === 'PRUDENTIA' || teamName === 'SAPIENTIA')) {
                        scores[zone][teamName] += p.points;
                    }
                });
            });
        });

        return scores;
    }, [completedPrograms]);

    const [activeTab, setActiveTab] = React.useState<'PROGRAMS' | 'GALLERY' | 'STATUS'>('PROGRAMS');

    return (
        <div className="space-y-6 text-left animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Green Room Control</h2>
                    <p className="text-xs text-slate-500 font-medium">Verify performer identity and scratch codes for secure judge allocation.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('PROGRAMS')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === 'PROGRAMS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Programs
                        </button>
                        <button
                            onClick={() => setActiveTab('STATUS')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === 'STATUS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Status
                        </button>
                        <button
                            onClick={() => setActiveTab('GALLERY')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === 'GALLERY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Gallery Upload
                        </button>
                    </div>
                    {activeTab === 'PROGRAMS' && (
                        <div className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-center shadow-lg shadow-indigo-100">
                            <p className="text-[10px] font-black uppercase leading-none opacity-80">Active Queue</p>
                            <p className="text-xl font-black">{filteredPrograms.filter(p => !p.isAllocatedToJudge && p.status === ProgramStatus.PENDING).length}</p>
                        </div>
                    )}
                </div>
            </div>

            {activeTab === 'GALLERY' ? (
                <GalleryUpload />
            ) : activeTab === 'STATUS' ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-black uppercase bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                                Team Scores by Zone
                            </h2>
                            <div className="text-right">
                                <p className="text-sm font-bold uppercase text-slate-400">Total Programs</p>
                                <p className="text-2xl font-black text-slate-900">{completedPrograms.length}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {Object.entries(zoneScores)
                                .sort(([zoneA], [zoneB]) => {
                                    const zoneOrder: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'General': 4 };
                                    return (zoneOrder[zoneA] || 5) - (zoneOrder[zoneB] || 5);
                                })
                                .map(([zone, scores]) => {
                                    const prudentiaScore = scores.PRUDENTIA;
                                    const sapientiaScore = scores.SAPIENTIA;
                                    const totalZoneScore = prudentiaScore + sapientiaScore;
                                    const leader = prudentiaScore > sapientiaScore ? 'PRUDENTIA' :
                                        sapientiaScore > prudentiaScore ? 'SAPIENTIA' : 'TIE';
                                    const prudentiaPercentage = totalZoneScore > 0 ? (prudentiaScore / totalZoneScore) * 100 : 50;
                                    const sapientiaPercentage = totalZoneScore > 0 ? (sapientiaScore / totalZoneScore) * 100 : 50;

                                    return (
                                        <div
                                            key={zone}
                                            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                                        >
                                            {/* Zone Header */}
                                            <div className="text-center mb-6">
                                                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-3 rounded-2xl shadow-md">
                                                    <span className="text-2xl">
                                                        {zone === 'A' ? '🅰️' : zone === 'B' ? '🅱️' : zone === 'C' ? '©️' : '🌟'}
                                                    </span>
                                                    <span className="text-base font-black uppercase tracking-wide">
                                                        {zone === 'General' ? 'General' : `Zone ${zone}`}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold uppercase text-slate-400 mt-3">
                                                    {scores.publishedCount} {scores.publishedCount === 1 ? 'Result' : 'Results'} Published
                                                </p>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-6">
                                                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 shadow-inner">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                                        style={{ width: `${prudentiaPercentage}%` }}
                                                    />
                                                    <div
                                                        className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                                                        style={{ width: `${sapientiaPercentage}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                                                    <span>{prudentiaPercentage.toFixed(0)}%</span>
                                                    <span>{sapientiaPercentage.toFixed(0)}%</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* PRUDENTIA Score */}
                                                <div
                                                    className={`relative rounded-2xl p-4 transition-all duration-300 ${leader === 'PRUDENTIA'
                                                        ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/50 scale-105'
                                                        : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150'
                                                        }`}
                                                >
                                                    {leader === 'PRUDENTIA' && (
                                                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg animate-pulse">
                                                            👑
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`text-xs font-black uppercase tracking-wider mb-1 ${leader === 'PRUDENTIA' ? 'text-blue-100' : 'text-blue-600'
                                                                }`}>
                                                                PRUDENTIA
                                                            </p>
                                                            <p className={`text-3xl font-black ${leader === 'PRUDENTIA' ? 'text-white' : 'text-blue-700'
                                                                }`}>
                                                                {prudentiaScore.toFixed(1)}
                                                            </p>
                                                        </div>
                                                        <div className={`text-5xl ${leader === 'PRUDENTIA' ? 'opacity-20' : 'opacity-10'}`}>
                                                            🔵
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* SAPIENTIA Score */}
                                                <div
                                                    className={`relative rounded-2xl p-4 transition-all duration-300 ${leader === 'SAPIENTIA'
                                                        ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-xl shadow-red-500/50 scale-105'
                                                        : 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150'
                                                        }`}
                                                >
                                                    {leader === 'SAPIENTIA' && (
                                                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg animate-pulse">
                                                            👑
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`text-xs font-black uppercase tracking-wider mb-1 ${leader === 'SAPIENTIA' ? 'text-red-100' : 'text-red-600'
                                                                }`}>
                                                                SAPIENTIA
                                                            </p>
                                                            <p className={`text-3xl font-black ${leader === 'SAPIENTIA' ? 'text-white' : 'text-red-700'
                                                                }`}>
                                                                {sapientiaScore.toFixed(1)}
                                                            </p>
                                                        </div>
                                                        <div className={`text-5xl ${leader === 'SAPIENTIA' ? 'opacity-20' : 'opacity-10'}`}>
                                                            🔴
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Zone Total */}
                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold uppercase text-slate-400">Zone Total</span>
                                                    <span className="text-lg font-black text-slate-700">{totalZoneScore.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-10">
                    {filteredPrograms.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">No Programs Available</h3>
                            <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                                Programs will appear here when they are:
                            </p>
                            <div className="flex flex-col items-center gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-bold">Published by Admin</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span className="font-bold">Have at least one participant registered</span>
                                </div>
                            </div>
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
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

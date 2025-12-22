import React, { useState, useMemo } from 'react';
import { Program, ProgramStatus } from '../types';

interface JudgesPageProps {
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    currentUser: { judgePanel?: string } | null;
}

export const JudgesPage: React.FC<JudgesPageProps> = ({ programs, setPrograms, currentUser }) => {
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [scores, setScores] = useState<{ [key: string]: { score: string, grade: string, points: string } }>({});

    // Only show programs that are allocated to judges and match this judge's panel
    const allocatedPrograms = useMemo(() => {
        return programs
            .filter(p => {
                const isAllocated = p.isAllocatedToJudge && p.status === ProgramStatus.JUDGING;
                // If judge has a panel assigned, only show programs for that panel
                const matchesPanel = currentUser?.judgePanel
                    ? p.judgePanel === currentUser.judgePanel
                    : true; // If no panel assigned, show all
                return isAllocated && matchesPanel;
            })
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }, [programs, currentUser]);

    const completedPrograms = useMemo(() => {
        return programs
            .filter(p => p.status === ProgramStatus.COMPLETED)
            .sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''));
    }, [programs]);

    const handleSelectProgram = (program: Program) => {
        setSelectedProgram(program);
        // Initialize scores for this program's participants
        const initialScores: { [key: string]: { score: string, grade: string, points: string } } = {};
        program.teams.forEach(team => {
            team.participants.forEach(participant => {
                initialScores[participant.chestNumber] = {
                    score: team.score?.toString() || '',
                    grade: team.grade || '',
                    points: team.points?.toString() || ''
                };
            });
        });
        setScores(initialScores);
    };

    const handleScoreChange = (chestNumber: string, field: 'score' | 'grade' | 'points', value: string) => {
        setScores(prev => ({
            ...prev,
            [chestNumber]: {
                ...prev[chestNumber],
                [field]: value
            }
        }));
    };

    const handleSubmitScores = () => {
        if (!selectedProgram) return;

        const confirm = window.confirm('Are you sure you want to submit these scores? This will mark the program as completed.');
        if (!confirm) return;

        // Calculate ranks based on scores
        const participantsWithScores = selectedProgram.teams.map(team => ({
            teamId: team.id,
            score: parseFloat(scores[team.participants[0]?.chestNumber]?.score || '0')
        })).sort((a, b) => b.score - a.score);

        // Update programs with scores and ranks
        setPrograms(prev => prev.map(p => {
            if (p.id !== selectedProgram.id) return p;

            return {
                ...p,
                status: ProgramStatus.COMPLETED,
                isPublished: false, // Ensure result is NOT published until Admin approves
                teams: p.teams.map(team => {
                    const chestNumber = team.participants[0]?.chestNumber;
                    if (!chestNumber) return team;

                    const scoreData = scores[chestNumber];
                    const rankIndex = participantsWithScores.findIndex(ps => ps.teamId === team.id);

                    return {
                        ...team,
                        score: parseFloat(scoreData?.score || '0'),
                        grade: scoreData?.grade || '',
                        points: parseInt(scoreData?.points || '0'),
                        rank: rankIndex + 1
                    };
                })
            };
        }));

        alert('Scores submitted successfully! Program marked as completed.');
        setSelectedProgram(null);
        setScores({});
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Judges Panel</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-500 font-medium">Evaluate performances and assign scores, grades, and points</p>
                            {currentUser?.judgePanel && (
                                <>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase">
                                        {currentUser.judgePanel}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-emerald-600">{allocatedPrograms.length}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 mb-1">Judging Instructions</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Only programs passed from Green Room will appear here</li>
                            <li>• Participants are identified by code letters (A, B, C, etc.) for fair judging</li>
                            <li>• Enter Score (0-100), Grade (A+, A, B+, etc.), and Points (0-10)</li>
                            <li>• Ranks will be automatically assigned based on scores</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Programs to Judge */}
            {!selectedProgram ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight mb-4">
                        Programs Ready for Judging ({allocatedPrograms.length})
                    </h3>

                    {allocatedPrograms.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Programs Allocated</p>
                            <p className="text-xs text-slate-300 mt-1">Wait for Green Room to allocate programs to judges</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allocatedPrograms.map(program => (
                                <div key={program.id} className="border border-slate-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-md transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-900 uppercase leading-tight mb-1 group-hover:text-emerald-600 transition-colors">
                                                {program.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-medium">{program.category}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[9px] font-black uppercase">
                                            {program.teams.flatMap(t => t.participants).length} Participants
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-medium">{program.startTime || 'Time TBA'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <span className="font-medium">{program.venue || 'Venue TBA'}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectProgram(program)}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                                    >
                                        Start Judging
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Judging Interface */
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-emerald-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{selectedProgram.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-sm font-medium opacity-90">{selectedProgram.category}</span>
                                    <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                    <span className="text-sm font-medium opacity-90">{selectedProgram.startTime}</span>
                                    <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                    <span className="text-sm font-medium opacity-90">{selectedProgram.venue}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedProgram(null);
                                    setScores({});
                                }}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-all"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">Team</th>
                                        <th className="px-4 py-3 text-center text-xs font-black uppercase text-slate-600">Score (0-100)</th>
                                        <th className="px-4 py-3 text-center text-xs font-black uppercase text-slate-600">Grade</th>
                                        <th className="px-4 py-3 text-center text-xs font-black uppercase text-slate-600">Points (0-10)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedProgram.teams.map((team) => {
                                        const participant = team.participants[0];
                                        if (!participant) return null;

                                        return (
                                            <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                                            <span className="text-2xl font-black text-emerald-600">
                                                                {participant.codeLetter || '?'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-emerald-600 uppercase">Code Letter</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">Chest: {participant.chestNumber}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-bold text-slate-900">{team.teamName}</p>
                                                    <p className="text-xs text-slate-500">{team.participants.length} participant(s)</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={scores[participant.chestNumber]?.score || ''}
                                                        onChange={(e) => handleScoreChange(participant.chestNumber, 'score', e.target.value)}
                                                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="0-100"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={scores[participant.chestNumber]?.grade || ''}
                                                        onChange={(e) => handleScoreChange(participant.chestNumber, 'grade', e.target.value)}
                                                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="A+">A+</option>
                                                        <option value="A">A</option>
                                                        <option value="A-">A-</option>
                                                        <option value="B+">B+</option>
                                                        <option value="B">B</option>
                                                        <option value="B-">B-</option>
                                                        <option value="C+">C+</option>
                                                        <option value="C">C</option>
                                                        <option value="C-">C-</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="1"
                                                        value={scores[participant.chestNumber]?.points || ''}
                                                        onChange={(e) => handleScoreChange(participant.chestNumber, 'points', e.target.value)}
                                                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        placeholder="0-10"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 flex justify-end gap-4 border-t border-slate-200 pt-6">
                            <button
                                onClick={() => {
                                    setSelectedProgram(null);
                                    setScores({});
                                }}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitScores}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Submit Scores & Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Completed Programs */}
            {!selectedProgram && completedPrograms.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight mb-4">
                        Completed Programs ({completedPrograms.length})
                    </h3>
                    <div className="space-y-3">
                        {completedPrograms.map(program => (
                            <div key={program.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{program.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{program.category} • {program.startTime}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase">
                                        ✓ Judged
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

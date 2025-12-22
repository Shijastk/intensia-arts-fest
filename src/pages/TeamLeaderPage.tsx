import React, { useState, useMemo } from 'react';
import { Program } from '../types';

interface TeamLeaderPageProps {
    teamName: string;
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    onLogout: () => void;
}

interface TeamParticipant {
    name: string;
    chestNumber: string;
    programs: Array<{
        id: string;
        name: string;
        category: string;
        isGeneral: boolean;
    }>;
}

export const TeamLeaderPage: React.FC<TeamLeaderPageProps> = ({
    teamName,
    programs,
    setPrograms,
    onLogout
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<TeamParticipant | null>(null);
    const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

    // Get all participants for this team
    const teamParticipants = useMemo(() => {
        const participantsMap = new Map<string, TeamParticipant>();

        programs.forEach(program => {
            const isGeneral = program.category.toLowerCase().includes('general');

            program.teams.forEach(team => {
                if (team.teamName === teamName) {
                    team.participants.forEach(participant => {
                        const key = participant.chestNumber;
                        if (!participantsMap.has(key)) {
                            participantsMap.set(key, {
                                name: participant.name,
                                chestNumber: participant.chestNumber,
                                programs: []
                            });
                        }
                        participantsMap.get(key)!.programs.push({
                            id: program.id,
                            name: program.name,
                            category: program.category,
                            isGeneral
                        });
                    });
                }
            });
        });

        return Array.from(participantsMap.values());
    }, [programs, teamName]);

    const handleOpenAddModal = () => {
        setEditingParticipant(null);
        setShowAddModal(true);
    };

    const handleEditParticipant = (participant: TeamParticipant) => {
        setEditingParticipant(participant);
        setShowAddModal(true);
    };

    const handleDeleteParticipant = (chestNumber: string) => {
        if (!confirm('Are you sure you want to remove this participant from all programs?')) return;

        setPrograms(prev => prev.map(program => ({
            ...program,
            teams: program.teams.map(team => {
                if (team.teamName !== teamName) return team;
                return {
                    ...team,
                    participants: team.participants.filter(p => p.chestNumber !== chestNumber)
                };
            }).filter(team => team.participants.length > 0)
        })));
    };

    // Show ALL programs to team leaders (they can register anytime)
    const availablePrograms = programs;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{teamName} - Registration Portal</h2>
                    <p className="text-xs text-slate-500 font-medium">Add participants and select programs for them</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenAddModal}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                        + Add Participant
                    </button>
                    <button
                        onClick={onLogout}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Registration Limits</h4>
                        <ul className="text-xs text-amber-800 space-y-1">
                            <li>• Maximum <strong>4 programs</strong> in normal categories (stage and non-stage)</li>
                            <li>• <strong>Unlimited programs</strong>in general categories</li>
                            <li>• System will automatically prevent exceeding limits</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                    <p className="text-3xl font-black text-indigo-600">{teamParticipants.length}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Participants</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                    <p className="text-3xl font-black text-emerald-600">{availablePrograms.length}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Available Programs</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                    <p className="text-3xl font-black text-violet-600">
                        {teamParticipants.reduce((sum, p) => sum + p.programs.length, 0)}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Registrations</p>
                </div>
            </div>

            {/* Participants List */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                        Team Participants ({teamParticipants.length})
                    </h3>
                </div>

                {teamParticipants.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Participants Added</p>
                        <p className="text-xs text-slate-300 mt-1">Click "+ Add Participant" to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {teamParticipants.map(participant => {
                            const normalProgramCount = participant.programs.filter(p => !p.isGeneral).length;
                            const generalProgramCount = participant.programs.filter(p => p.isGeneral).length;
                            const isExpanded = expandedParticipant === participant.chestNumber;

                            return (
                                <div key={participant.chestNumber} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between p-4 bg-slate-50">
                                        <button
                                            onClick={() => setExpandedParticipant(isExpanded ? null : participant.chestNumber)}
                                            className="flex-1 flex items-center gap-4 text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <span className="text-lg font-black text-indigo-600">
                                                    {participant.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-slate-900">{participant.name}</h4>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs text-slate-500 font-medium">Chest: {participant.chestNumber}</span>
                                                    <span className={`text-xs font-bold ${normalProgramCount >= 4 ? 'text-red-600' : 'text-green-600'}`}>
                                                        Normal: {normalProgramCount}/4
                                                    </span>
                                                    <span className="text-xs font-bold text-blue-600">
                                                        General: {generalProgramCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                                                {participant.programs.length} Programs
                                            </span>
                                            <button
                                                onClick={() => handleEditParticipant(participant)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Edit Programs"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteParticipant(participant.chestNumber)}
                                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                title="Delete Participant"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setExpandedParticipant(isExpanded ? null : participant.chestNumber)}
                                                className="p-1"
                                            >
                                                <svg
                                                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 bg-white border-t border-slate-200">
                                            <h5 className="text-xs font-black uppercase text-slate-400 mb-3">Registered Programs</h5>
                                            {participant.programs.length > 0 ? (
                                                <div className="space-y-2">
                                                    {participant.programs.map(prog => (
                                                        <div key={prog.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{prog.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs text-slate-500">{prog.category}</span>
                                                                    {prog.isGeneral && (
                                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-black uppercase">
                                                                            Unlimited
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic text-center py-4">No programs selected</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Participant Modal */}
            {showAddModal && (
                <ParticipantProgramModal
                    teamName={teamName}
                    programs={programs}
                    setPrograms={setPrograms}
                    availablePrograms={availablePrograms}
                    editingParticipant={editingParticipant}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingParticipant(null);
                    }}
                />
            )}
        </div>
    );
};

// Modal Component for Adding/Editing Participant and Selecting Programs
interface ParticipantProgramModalProps {
    teamName: string;
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    availablePrograms: Program[];
    editingParticipant: TeamParticipant | null;
    onClose: () => void;
}

const ParticipantProgramModal: React.FC<ParticipantProgramModalProps> = ({
    teamName,
    programs,
    setPrograms,
    availablePrograms,
    editingParticipant,
    onClose
}) => {
    const [name, setName] = useState(editingParticipant?.name || '');
    const [chestNumber, setChestNumber] = useState(editingParticipant?.chestNumber || '');
    const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(
        new Set(editingParticipant?.programs.map(p => p.id) || [])
    );

    const handleToggleProgram = (programId: string) => {
        const program = programs.find(p => p.id === programId);
        if (!program) return;

        const isGeneral = program.category.toLowerCase().includes('general');
        const newSelected = new Set(selectedPrograms);

        if (newSelected.has(programId)) {
            newSelected.delete(programId);
        } else {
            // Check if adding this would exceed the limit
            if (!isGeneral) {
                const currentNormalCount = Array.from(newSelected).filter(id => {
                    const p = programs.find(prog => prog.id === id);
                    return p && !p.category.toLowerCase().includes('general');
                }).length;

                if (currentNormalCount >= 4) {
                    alert('Maximum 4 normal programs allowed! You can add unlimited general programs.');
                    return;
                }
            }
            newSelected.add(programId);
        }

        setSelectedPrograms(newSelected);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !chestNumber.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (selectedPrograms.size === 0) {
            alert('Please select at least one program');
            return;
        }

        // Check if chest number already exists (when adding new)
        if (!editingParticipant) {
            const exists = programs.some(p =>
                p.teams.some(t =>
                    t.teamName === teamName &&
                    t.participants.some(participant => participant.chestNumber === chestNumber)
                )
            );
            if (exists) {
                alert('A participant with this chest number already exists!');
                return;
            }
        }

        // ✅ NEW: Validate group program participant limits
        const validationErrors: string[] = [];

        selectedPrograms.forEach(programId => {
            const program = programs.find(p => p.id === programId);
            if (!program) return;

            // Check if this is a group program with participant limits
            if (program.isGroup && program.participantsCount) {
                // Count how many teams are already registered for this program
                const totalTeams = new Set(program.teams.map(t => t.teamName)).size;

                // If this team isn't registered yet, count them as a new team
                const teamExists = program.teams.some(t => t.teamName === teamName);
                const effectiveTotalTeams = teamExists ? totalTeams : totalTeams + 1;

                // Calculate per-team limit (total participants / number of teams)
                const perTeamLimit = Math.floor(program.participantsCount / effectiveTotalTeams);

                // Count current participants for this team in this program
                const currentTeamParticipantCount = program.teams
                    .filter(t => t.teamName === teamName)
                    .reduce((sum, t) => sum + t.participants.length, 0);

                // When editing, subtract 1 because we're replacing, not adding
                const adjustedCount = editingParticipant ? currentTeamParticipantCount - 1 : currentTeamParticipantCount;

                // Check if adding this participant would exceed the limit
                if (adjustedCount >= perTeamLimit) {
                    validationErrors.push(
                        `"${program.name}" - Your team can only register ${perTeamLimit} participant(s). ` +
                        `(Total: ${program.participantsCount} ÷ ${effectiveTotalTeams} teams = ${perTeamLimit} per team)`
                    );
                }
            }
        });

        // Show validation errors if any
        if (validationErrors.length > 0) {
            alert(
                'Group Program Limits Exceeded:\n\n' +
                validationErrors.join('\n\n') +
                '\n\nPlease adjust your program selection.'
            );
            return;
        }

        // Remove participant from all programs first (if editing)
        if (editingParticipant) {
            setPrograms(prev => prev.map(program => ({
                ...program,
                teams: program.teams.map(team => {
                    if (team.teamName !== teamName) return team;
                    return {
                        ...team,
                        participants: team.participants.filter(p => p.chestNumber !== editingParticipant.chestNumber)
                    };
                }).filter(team => team.participants.length > 0)
            })));
        }

        // Add participant to selected programs
        setPrograms(prev => prev.map(program => {
            if (!selectedPrograms.has(program.id)) return program;

            const teamIndex = program.teams.findIndex(t => t.teamName === teamName);

            if (teamIndex >= 0) {
                // Team exists, add participant
                const updatedTeams = [...program.teams];
                updatedTeams[teamIndex] = {
                    ...updatedTeams[teamIndex],
                    participants: [...updatedTeams[teamIndex].participants, { name, chestNumber }]
                };
                return { ...program, teams: updatedTeams };
            } else {
                // Create new team
                return {
                    ...program,
                    teams: [...program.teams, {
                        id: `t-${Date.now()}-${Math.random()}`,
                        teamName,
                        participants: [{ name, chestNumber }]
                    }]
                };
            }
        }));

        alert(editingParticipant ? 'Participant updated successfully!' : 'Participant added successfully!');
        onClose();
    };

    const normalCount = Array.from(selectedPrograms).filter(id => {
        const p = programs.find(prog => prog.id === id);
        return p && !p.category.toLowerCase().includes('general');
    }).length;

    const generalCount = selectedPrograms.size - normalCount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white sticky top-0">
                    <h3 className="text-sm font-black uppercase tracking-widest">
                        {editingParticipant ? 'Edit Participant' : 'Add New Participant'}
                    </h3>
                    <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="p-6 space-y-6">
                        {/* Participant Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Participant Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        Participant Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!!editingParticipant}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        Chest Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={chestNumber}
                                        onChange={(e) => setChestNumber(e.target.value)}
                                        disabled={!!editingParticipant}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
                                        placeholder="Enter chest number"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Program Selection Status */}
                        <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-indigo-900">Programs Selected: {selectedPrograms.size}</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className={`text-xs font-bold ${normalCount >= 4 ? 'text-red-600' : 'text-green-600'}`}>
                                        Normal: {normalCount}/4
                                    </span>
                                    <span className="text-xs font-bold text-blue-600">
                                        General: {generalCount} (Unlimited)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Program Selection */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Programs</h4>

                            {availablePrograms.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-slate-400">No programs available</p>
                                    <p className="text-xs text-slate-300 mt-1">Admin needs to create programs first</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    {availablePrograms.map(program => {
                                        const isGeneral = program.category.toLowerCase().includes('general');
                                        const isSelected = selectedPrograms.has(program.id);

                                        // ✅ NEW: Calculate group program limits
                                        let groupInfo: { perTeamLimit: number; currentCount: number; totalTeams: number } | null = null;
                                        if (program.isGroup && program.participantsCount) {
                                            const totalTeams = new Set(program.teams.map(t => t.teamName)).size;
                                            const teamExists = program.teams.some(t => t.teamName === teamName);
                                            const effectiveTotalTeams = Math.max(teamExists ? totalTeams : totalTeams + 1, 1);
                                            const perTeamLimit = Math.floor(program.participantsCount / effectiveTotalTeams);
                                            const currentCount = program.teams
                                                .filter(t => t.teamName === teamName)
                                                .reduce((sum, t) => sum + t.participants.length, 0);

                                            groupInfo = { perTeamLimit, currentCount, totalTeams: effectiveTotalTeams };
                                        }

                                        return (
                                            <label
                                                key={program.id}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                    ? 'bg-indigo-50 border-indigo-500'
                                                    : 'bg-white border-slate-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleProgram(program.id)}
                                                    className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h5 className="text-sm font-bold text-slate-900">{program.name}</h5>
                                                        {isGeneral && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-black uppercase">
                                                                Unlimited
                                                            </span>
                                                        )}
                                                        {/* ✅ NEW: Group program indicator */}
                                                        {groupInfo && (
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${groupInfo.currentCount >= groupInfo.perTeamLimit
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                Group: {groupInfo.currentCount}/{groupInfo.perTeamLimit} per team
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        <span className="text-xs text-slate-500">{program.category}</span>
                                                        {program.startTime && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                <span className="text-xs text-slate-500">{program.startTime}</span>
                                                            </>
                                                        )}
                                                        {program.venue && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                <span className="text-xs text-slate-500">{program.venue}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {/* ✅ NEW: Group program details */}
                                                    {groupInfo && (
                                                        <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                                            📊 Total: {program.participantsCount} participants ÷ {groupInfo.totalTeams} teams = {groupInfo.perTeamLimit} per team
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
                        >
                            {editingParticipant ? 'Update Participant' : 'Add Participant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

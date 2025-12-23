import React, { useState, useMemo } from 'react';
import { Program } from '../types';

interface TeamLeaderPageProps {
    teamName: string;
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>; // Kept for compatibility but deprecated
    updateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
    onLogout: () => void;
}

// ... 

interface ParticipantProgramModalProps {
    teamName: string;
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    updateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
    availablePrograms: Program[];
    editingParticipant: TeamParticipant | null;
    onClose: () => void;
}

const ParticipantProgramModal: React.FC<ParticipantProgramModalProps> = ({
    teamName,
    programs,
    setPrograms,
    updateProgram,
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
            // Check global participant limit
            if (program.participantsCount > 0) {
                // Calculate how many people are currently registered in this program across ALL teams
                const currentTotalParticipants = program.teams.reduce((sum, team) => sum + team.participants.length, 0);

                // If we are editing a participant, and they are ALREADY in this program (in the DB), 
                // then they are already counted in 'currentTotalParticipants'.
                // We shouldn't double count them. 
                // But wait, 'editingParticipant.programs' is the snapshot passed prop.
                // We should check if the *current program data from 'programs'* has this participant.

                // Actually, checking if editingParticipant was passed (meaning edit mode) 
                // and if their ID matches someone in the team in the program is safer.
                // But 'editingParticipant.programs' is simpler.

                const isParticipantAlreadyIn = editingParticipant?.programs.some(p => p.id === programId);
                const effectiveCount = currentTotalParticipants - (isParticipantAlreadyIn ? 1 : 0);

                if (effectiveCount >= program.participantsCount) {
                    alert(`Cannot register: This program has reached its maximum capacity of ${program.participantsCount} participants.`);
                    return;
                }
            }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !chestNumber.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (selectedPrograms.size === 0) {
            alert('Please select at least one program');
            return;
        }

        // Check if chest number already exists
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

        // Validate group program limits
        const validationErrors: string[] = [];
        selectedPrograms.forEach(programId => {
            const program = programs.find(p => p.id === programId);
            if (!program) return;
            if (program.isGroup && program.participantsCount) {
                const totalTeams = new Set(program.teams.map(t => t.teamName)).size;
                const teamExists = program.teams.some(t => t.teamName === teamName);
                const effectiveTotalTeams = teamExists ? totalTeams : totalTeams + 1;
                const perTeamLimit = Math.floor(program.participantsCount / effectiveTotalTeams);

                const currentTeamParticipantCount = program.teams
                    .filter(t => t.teamName === teamName)
                    .reduce((sum, t) => sum + t.participants.length, 0);

                const adjustedCount = editingParticipant ? currentTeamParticipantCount - 1 : currentTeamParticipantCount;

                if (adjustedCount >= perTeamLimit) {
                    validationErrors.push(
                        `"${program.name}" - Limit: ${perTeamLimit} per team`
                    );
                }
            }
        });

        if (validationErrors.length > 0) {
            alert('Group Limits Exceeded:\n\n' + validationErrors.join('\n'));
            return;
        }

        if (!updateProgram) {
            alert("Update feature unavailable.");
            return;
        }

        // Process Updates
        const updates: Promise<boolean>[] = [];

        for (const program of programs) {
            const isSelected = selectedPrograms.has(program.id);
            let updatedTeams = [...program.teams];
            const teamIndex = updatedTeams.findIndex(t => t.teamName === teamName);
            let modified = false;

            if (teamIndex === -1) {
                // Team doesn't exist
                if (isSelected) {
                    // Add Team + Participant
                    updatedTeams.push({
                        id: `t-${Date.now()}-${Math.random()}`,
                        teamName,
                        participants: [{ name, chestNumber }]
                    });
                    modified = true;
                }
            } else {
                // Team exists
                const team = { ...updatedTeams[teamIndex] };
                let participants = [...team.participants];

                const searchChestNumber = editingParticipant ? editingParticipant.chestNumber : chestNumber;
                const pIndex = participants.findIndex(p => p.chestNumber === searchChestNumber);

                if (isSelected) {
                    if (pIndex >= 0) {
                        // Update Existing
                        if (participants[pIndex].name !== name || participants[pIndex].chestNumber !== chestNumber) {
                            participants[pIndex] = { ...participants[pIndex], name, chestNumber };
                            modified = true;
                        }
                    } else {
                        // Add New to Team
                        participants.push({ name, chestNumber });
                        modified = true;
                    }
                } else {
                    if (pIndex >= 0) {
                        // Remove from Team
                        participants = participants.filter((_, idx) => idx !== pIndex);
                        modified = true;
                    }
                }

                if (modified) {
                    if (participants.length === 0) {
                        // Remove team if empty
                        updatedTeams = updatedTeams.filter((_, idx) => idx !== teamIndex);
                    } else {
                        team.participants = participants;
                        updatedTeams[teamIndex] = team;
                    }
                }
            }

            if (modified) {
                updates.push(updateProgram(program.id, { teams: updatedTeams }));
            }
        }

        await Promise.all(updates);
        alert(editingParticipant ? 'Updated successfully!' : 'Added successfully!');
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
                                <div className="space-y-2">
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

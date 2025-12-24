import React, { useState, useMemo, useEffect } from 'react';
import { Program } from '../types';

interface TeamLeaderPageProps {
    teamName: string;
    programs: Program[];
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
    updateProgram?: (id: string, updates: Partial<Program>) => Promise<boolean>;
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
        isGroup: boolean;
    }>;
}

export const TeamLeaderPage: React.FC<TeamLeaderPageProps> = ({
    teamName,
    programs,
    setPrograms,
    updateProgram,
    onLogout
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<TeamParticipant | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'chestNumber'>('name');
    const [zoneFilter, setZoneFilter] = useState<'All' | 'A' | 'B' | 'C' | 'General'>('All');
    const [isLoading, setIsLoading] = useState(false);

    // Get all participants for this team 
    const teamParticipants = useMemo(() => {
        const participantsMap = new Map<string, TeamParticipant & { zones: Set<string> }>();

        programs.forEach(program => {
            const isGeneral = program.category.toLowerCase().includes('general') || program.name.toLowerCase().includes('general');
            let programZone = 'General';
            const catLower = program.category.toLowerCase();
            if (catLower.includes('a zone')) programZone = 'A';
            else if (catLower.includes('b zone')) programZone = 'B';
            else if (catLower.includes('c zone')) programZone = 'C';

            program.teams.forEach(team => {
                if (team.teamName === teamName) {
                    team.participants.forEach(participant => {
                        const key = `${participant.chestNumber}-${participant.name}`.toLowerCase();
                        if (!participantsMap.has(key)) {
                            participantsMap.set(key, {
                                name: participant.name,
                                chestNumber: participant.chestNumber,
                                programs: [],
                                zones: new Set() // Track zones this participant belongs to
                            });
                        }
                        const pEntry = participantsMap.get(key)!;

                        // Add program
                        pEntry.programs.push({
                            id: program.id,
                            name: program.name,
                            category: program.category,
                            isGeneral,
                            isGroup: program.isGroup || false
                        });

                        // Track Zone
                        if (programZone !== 'General') {
                            pEntry.zones.add(programZone);
                        }
                    });
                }
            });
        });

        let result = Array.from(participantsMap.values());

        // Filter by Zone
        if (zoneFilter !== 'All') {
            if (zoneFilter === 'General') {
                // Show participants who ONLY have general programs or explicit general filter interaction?
                // Usually "General" filter implies those NOT in A/B/C or explicitly in General. 
                // Strict interpretation: Participants with NO specific zone (A/B/C) assigned yet
                result = result.filter(p => p.zones.size === 0);
            } else {
                // Show participants who overlap with the selected zone
                result = result.filter(p => p.zones.has(zoneFilter));
            }
        }

        // Filter by Search
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                p.chestNumber.toLowerCase().includes(lowerSearch)
            );
        }

        // Sort 
        result.sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else {
                // Natural sorting for chest numbers
                const aNum = parseInt(a.chestNumber) || 0;
                const bNum = parseInt(b.chestNumber) || 0;
                return aNum - bNum;
            }
        });

        return result;
    }, [programs, teamName, searchTerm, sortBy, zoneFilter]);

    const handleOpenAddModal = () => {
        setEditingParticipant(null);
        setShowAddModal(true);
    };

    const handleEditParticipant = (participant: TeamParticipant) => {
        setEditingParticipant(participant);
        setShowAddModal(true);
    };

    const handleDeleteParticipant = async (chestNumber: string, name: string) => {
        if (!confirm('Are you sure you want to remove this participant from all programs?')) return;

        if (updateProgram) {
            setIsLoading(true);
            try {
                // Create updates for all programs where this participant exists
                const updates: Promise<boolean>[] = [];

                programs.forEach(program => {
                    const teamIndex = program.teams.findIndex(t => t.teamName === teamName);
                    if (teamIndex !== -1) {
                        const team = program.teams[teamIndex];
                        const participantIndex = team.participants.findIndex(
                            p => p.chestNumber === chestNumber && p.name === name
                        );

                        if (participantIndex !== -1) {
                            // Remove participant from this program
                            const updatedTeams = [...program.teams];
                            const updatedTeam = { ...updatedTeams[teamIndex] };
                            updatedTeam.participants = updatedTeam.participants.filter(
                                (_, idx) => idx !== participantIndex
                            );

                            // If team is empty, remove it
                            if (updatedTeam.participants.length === 0) {
                                updatedTeams.splice(teamIndex, 1);
                            } else {
                                updatedTeams[teamIndex] = updatedTeam;
                            }

                            updates.push(updateProgram(program.id, { teams: updatedTeams }));
                        }
                    }
                });

                await Promise.all(updates);
                alert('Participant removed successfully!');
            } catch (error) {
                console.error('Error deleting participant:', error);
                alert('Failed to delete participant. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Fallback to local state update
            setPrograms(prev => prev.map(program => ({
                ...program,
                teams: program.teams.map(team => {
                    if (team.teamName !== teamName) return team;
                    return {
                        ...team,
                        participants: team.participants.filter(p =>
                            !(p.chestNumber === chestNumber && p.name === name)
                        )
                    };
                }).filter(team => team.participants.length > 0)
            })));
        }
    };

    // Show only available programs (not completed and not judging)
    const availablePrograms = useMemo(() => {
        return programs.filter(program =>
            program.status !== 'COMPLETED' &&
            program.status !== 'JUDGING' &&
            (program.participantsCount === 0 ||
                (program.participantsCount > 0 &&
                    program.teams.reduce((sum, t) => sum + t.participants.length, 0) < program.participantsCount))
        );
    }, [programs]);

    // State for list expansion 
    const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

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
                        disabled={isLoading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : '+ Add Participant'}
                    </button>
                    <button
                        onClick={onLogout}
                        disabled={isLoading}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
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
                            <li>• <strong>Unlimited programs</strong> in general categories</li>
                            <li>• System will automatically prevent exceeding limits</li>
                            <li>• Group programs have team-wise participant limits</li>
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                        Team Participants ({teamParticipants.length})
                    </h3>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <input
                                type="text"
                                placeholder="Search name or chest no..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <select
                            value={zoneFilter}
                            onChange={(e) => setZoneFilter(e.target.value as any)}
                            className="px-3 w-20 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            <option value="All">All</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="General">Gen/Un</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'name' | 'chestNumber')}
                            className="px-3 w-20 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="chestNumber">Sort by Chest No</option>
                        </select>
                    </div>
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
                            const isExpanded = expandedParticipant === `${participant.chestNumber}-${participant.name}`;

                            return (
                                <div key={`${participant.chestNumber}-${participant.name}`} className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto no-scrollbar">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 min-w-[700px]">
                                        <button
                                            onClick={() => setExpandedParticipant(isExpanded ? null : `${participant.chestNumber}-${participant.name}`)}
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
                                                    {participant.programs.some(p => p.isGroup) && (
                                                        <span className="text-xs font-bold text-purple-600">
                                                            Group: {participant.programs.filter(p => p.isGroup).length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                                                {participant.programs.length} Programs
                                            </span>
                                            <button
                                                onClick={() => handleEditParticipant(participant)}
                                                disabled={isLoading}
                                                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                                                title="Edit Programs"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteParticipant(participant.chestNumber, participant.name)}
                                                disabled={isLoading}
                                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                                                title="Delete Participant"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setExpandedParticipant(isExpanded ? null : `${participant.chestNumber}-${participant.name}`)}
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
                                        <div className="p-4 bg-white border-t border-slate-200 min-w-[700px]">
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
                                                                    {prog.isGroup && (
                                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-black uppercase">
                                                                            Group
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
                    updateProgram={updateProgram}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingParticipant(null);
                    }}
                />
            )}
        </div>
    );
};

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; chestNumber?: string }>({});
    const [programSearchTerm, setProgramSearchTerm] = useState('');
    const [programSortBy, setProgramSortBy] = useState<'name' | 'category' | 'time'>('name');

    // Validate form
    const validateForm = () => {
        const newErrors: { name?: string; chestNumber?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!chestNumber.trim()) {
            newErrors.chestNumber = 'Chest number is required';
        } else if (!/^\d+$/.test(chestNumber.trim())) {
            newErrors.chestNumber = 'Chest number must contain only numbers';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Filter and sort available programs
    const filteredAndSortedPrograms = useMemo(() => {
        let result = [...availablePrograms];

        // Filter by search term
        if (programSearchTerm) {
            const lowerSearch = programSearchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                p.category.toLowerCase().includes(lowerSearch) ||
                (p.venue && p.venue.toLowerCase().includes(lowerSearch))
            );
        }

        // Sort
        result.sort((a, b) => {
            if (programSortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (programSortBy === 'category') {
                return a.category.localeCompare(b.category);
            } else if (programSortBy === 'time') {
                // Sort by time, programs without time go to the end
                if (!a.startTime && !b.startTime) return 0;
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.localeCompare(b.startTime);
            }
            return 0;
        });

        return result;
    }, [availablePrograms, programSearchTerm, programSortBy]);

    const handleToggleProgram = (programId: string) => {
        const program = programs.find(p => p.id === programId);
        if (!program) return;

        const isGeneral = program.category.toLowerCase().includes('general');
        const newSelected = new Set(selectedPrograms);

        if (newSelected.has(programId)) {
            newSelected.delete(programId);
        } else {
            // Check program capacity
            if (program.participantsCount > 0) {
                const currentTotalParticipants = program.teams.reduce((sum, team) => sum + team.participants.length, 0);

                const isParticipantAlreadyIn = editingParticipant?.programs.some(p => p.id === programId);
                const effectiveCount = currentTotalParticipants - (isParticipantAlreadyIn ? 1 : 0);

                if (effectiveCount >= program.participantsCount) {
                    alert(`Cannot register: This program has reached its maximum capacity of ${program.participantsCount} participants.`);
                    return;
                }
            }

            // Check normal program limit
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

            // Check group program team limits
            if (program.isGroup && program.participantsCount > 0) {
                const teamsInProgram = program.teams.filter(t => t.teamName === teamName);
                const currentTeamCount = teamsInProgram.reduce((sum, team) => sum + team.participants.length, 0);
                const totalTeams = new Set(program.teams.map(t => t.teamName)).size;
                const teamExists = teamsInProgram.length > 0;
                const effectiveTotalTeams = teamExists ? totalTeams : totalTeams + 1;
                const perTeamLimit = Math.floor(program.participantsCount / effectiveTotalTeams);

                if (currentTeamCount >= perTeamLimit) {
                    alert(`Cannot register: This group program allows only ${perTeamLimit} participants per team.`);
                    return;
                }
            }

            newSelected.add(programId);
        }

        setSelectedPrograms(newSelected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (selectedPrograms.size === 0) {
            alert('Please select at least one program');
            return;
        }

        // Check if chest number already exists for a different participant
        if (!editingParticipant) {
            const exists = programs.some(p =>
                p.teams.some(t =>
                    t.teamName === teamName &&
                    t.participants.some(participant =>
                        participant.chestNumber === chestNumber &&
                        participant.name !== name
                    )
                )
            );
            if (exists) {
                alert('Another participant with this chest number already exists!');
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

        setIsSubmitting(true);

        try {
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
                            participants: [{ name: name.trim(), chestNumber: chestNumber.trim() }]
                        });
                        modified = true;
                    }
                } else {
                    // Team exists 
                    const team = { ...updatedTeams[teamIndex] };
                    let participants = [...team.participants];

                    const searchChestNumber = editingParticipant ? editingParticipant.chestNumber : chestNumber;
                    const searchName = editingParticipant ? editingParticipant.name : name;
                    const pIndex = participants.findIndex(p =>
                        p.chestNumber === searchChestNumber && p.name === searchName
                    );

                    if (isSelected) {
                        if (pIndex >= 0) {
                            // Update Existing 
                            if (participants[pIndex].name !== name || participants[pIndex].chestNumber !== chestNumber) {
                                participants[pIndex] = { ...participants[pIndex], name: name.trim(), chestNumber: chestNumber.trim() };
                                modified = true;
                            }
                        } else {
                            // Add New to Team 
                            participants.push({ name: name.trim(), chestNumber: chestNumber.trim() });
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
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
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
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (errors.name) setErrors({ ...errors, name: undefined });
                                        }}
                                        disabled={!!editingParticipant || isSubmitting}
                                        className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 ${errors.name ? 'border-red-300 bg-red-50' : 'bg-slate-50 border-slate-200'
                                            }`}
                                        placeholder="Enter full name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500">{errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        Chest Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={chestNumber}
                                        onChange={(e) => {
                                            setChestNumber(e.target.value);
                                            if (errors.chestNumber) setErrors({ ...errors, chestNumber: undefined });
                                        }}
                                        disabled={!!editingParticipant || isSubmitting}
                                        className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 ${errors.chestNumber ? 'border-red-300 bg-red-50' : 'bg-slate-50 border-slate-200'
                                            }`}
                                        placeholder="Enter chest number"
                                        required
                                    />
                                    {errors.chestNumber && (
                                        <p className="text-xs text-red-500">{errors.chestNumber}</p>
                                    )}
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Programs</h4>
                                    {availablePrograms.length > 0 && (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                            {filteredAndSortedPrograms.length}/{availablePrograms.length}
                                        </span>
                                    )}
                                </div>

                                {availablePrograms.length > 0 && (
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:flex-initial">
                                            <input
                                                type="text"
                                                placeholder="Search programs..."
                                                value={programSearchTerm}
                                                onChange={(e) => setProgramSearchTerm(e.target.value)}
                                                className="w-full sm:w-56 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            />
                                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <select
                                            value={programSortBy}
                                            onChange={(e) => setProgramSortBy(e.target.value as any)}
                                            className="w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="name">Sort by Name</option>
                                            <option value="category">Sort by Category</option>
                                            <option value="time">Sort by Time</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {availablePrograms.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-slate-400">No programs available</p>
                                    <p className="text-xs text-slate-300 mt-1">All programs are either completed or full</p>
                                </div>
                            ) : filteredAndSortedPrograms.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-slate-400">No programs match your search</p>
                                    <p className="text-xs text-slate-300 mt-1">Try a different search term</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredAndSortedPrograms.map(program => {
                                        const isGeneral = program.category.toLowerCase().includes('general');
                                        const isSelected = selectedPrograms.has(program.id);
                                        const isFull = program.participantsCount > 0 &&
                                            program.teams.reduce((sum, t) => sum + t.participants.length, 0) >= program.participantsCount;

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
                                                    : isFull
                                                        ? 'bg-slate-100 border-slate-300 cursor-not-allowed opacity-60'
                                                        : 'bg-white border-slate-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleProgram(program.id)}
                                                    disabled={isFull || isSubmitting}
                                                    className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h5 className="text-sm font-bold text-slate-900">{program.name}</h5>
                                                        {isGeneral && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-black uppercase">
                                                                Unlimited
                                                            </span>
                                                        )}
                                                        {groupInfo && (
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${groupInfo.currentCount >= groupInfo.perTeamLimit
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                Group: {groupInfo.currentCount}/{groupInfo.perTeamLimit} per team
                                                            </span>
                                                        )}
                                                        {isFull && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-black uppercase">
                                                                Full
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
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || selectedPrograms.size === 0}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Processing...' : (editingParticipant ? 'Update Participant' : 'Add Participant')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
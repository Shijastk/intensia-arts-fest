import React from 'react';
import { Program, ProgramStatus, Participant } from '../types';

interface GreenRoomProgramCardProps {
    program: Program;
    onAssignCodes: (programId: string, participantChest?: string) => void;
    onRevealCode: (programId: string, participantChest: string) => void;
    onAllocateToJudge: (programId: string, judgePanel: string) => void;
    setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
}

export const GreenRoomProgramCard: React.FC<GreenRoomProgramCardProps> = ({
    program,
    onAssignCodes,
    onRevealCode,
    onAllocateToJudge,
    setPrograms
}) => {
    const [selectedPanel, setSelectedPanel] = React.useState(program.judgePanel || 'Ahsani Usthad');
    const allRevealed = program.teams.every(t => t.participants.every(pt => pt.isCodeRevealed));
    const isPending = program.status === ProgramStatus.PENDING && !program.isAllocatedToJudge;

    const availablePanels = ['Ahsani Usthad', 'Ajmal Usthad', 'Suhail Usthad', 'Stage 1'];

    const handleAllocate = () => {
        // First set the judge panel
        setPrograms(prev => prev.map(p =>
            p.id === program.id ? { ...p, judgePanel: selectedPanel } : p
        ));
        // Then allocate to judges
        onAllocateToJudge(program.id, selectedPanel);
    };

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${isPending ? 'border-slate-200 shadow-lg' : 'border-slate-100 opacity-60 grayscale'}`}>
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner ${program.isAllocatedToJudge ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-indigo-600 text-white border border-indigo-700'}`}>
                        <span className="text-[9px] uppercase tracking-tighter opacity-80">Start</span>
                        <span className="text-base">{program.startTime?.split(' ')[1] || '--:--'}</span>
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{program.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{program.category}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">{program.venue || 'TBA'}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] font-black text-slate-800 uppercase">
                                Range: A-{String.fromCharCode(64 + (() => {
                                    if (!program.isGroup) return program.teams.flatMap(t => t.participants).length;
                                    const limit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;
                                    return program.teams.reduce((sum, t) => sum + Math.ceil((t.participants.length > 0 ? t.participants.length : 1) / limit), 0);
                                })())}
                            </span>
                            {program.judgePanel && (
                                <>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase">
                                        {program.judgePanel}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isPending && (
                        <>
                            <select
                                value={selectedPanel}
                                onChange={(e) => setSelectedPanel(e.target.value)}
                                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                            >
                                {availablePanels.map(panel => (
                                    <option key={panel} value={panel}>{panel}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAllocate}
                                disabled={!allRevealed}
                                className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${allRevealed ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                Push to Judge Portal
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {program.isGroup ? (
                        // Group View: Render one card per SUB-TEAM
                        program.teams.flatMap((team) => {
                            const memberLimit = (program.membersPerGroup && program.membersPerGroup > 0) ? program.membersPerGroup : 999;
                            const subTeams = [];
                            const pList = team.participants;

                            if (pList.length === 0) return [];

                            for (let i = 0; i < pList.length; i += memberLimit) {
                                subTeams.push({
                                    teamId: team.id,
                                    teamName: team.teamName,
                                    participants: pList.slice(i, i + memberLimit),
                                    // If we have multiple subteams, we might want to distinguish them, but UI-wise 
                                    // showing just Team Name + Participants is enough.
                                });
                            }
                            return subTeams;
                        }).map((subTeam, idx) => {
                            const representative = subTeam.participants[0];
                            const isRevealed = subTeam.participants.every(p => p.isCodeRevealed);
                            const codeLetter = representative?.codeLetter;

                            // Unique key: composite of teamId and first participant chest
                            const uniqueKey = `${subTeam.teamId}-${representative?.chestNumber}`;

                            return (
                                <div key={uniqueKey} className="relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all flex flex-col items-center text-center">
                                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl font-black transition-all duration-1000 ${isRevealed ? 'bg-indigo-600 text-white shadow-2xl scale-100' : 'bg-slate-100 text-slate-200 border-2 border-dashed border-slate-300 rotate-12 scale-90'}`}>
                                        {isRevealed ? codeLetter : '?'}
                                    </div>
                                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-3">Secret ID</p>

                                    <div className="mt-8 w-full">
                                        <h4 className="text-lg font-black text-slate-900 leading-none uppercase truncate">{subTeam.teamName}</h4>
                                        <div className="flex flex-col items-center mt-2">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{subTeam.participants.length} Participants</span>
                                            <div className="flex flex-wrap justify-center gap-1 mt-2 max-h-20 overflow-y-auto custom-scrollbar">
                                                {subTeam.participants.map(p => (
                                                    <span key={p.chestNumber} className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded" title={p.name}>
                                                        {p.name.split(' ')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 w-full px-4 py-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter truncate leading-tight">{program.name}</p>
                                    </div>

                                    <div className="mt-8 w-full">
                                        {!isRevealed ? (
                                            <button
                                                onClick={async () => {
                                                    if (!codeLetter) {
                                                        await onAssignCodes(program.id, representative.chestNumber);
                                                    } else {
                                                        await onRevealCode(program.id, representative.chestNumber);
                                                    }
                                                }}
                                                className="w-full py-5 bg-slate-900 text-white rounded-3xl flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group"
                                            >
                                                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                Scratch Here
                                            </button>
                                        ) : (
                                            <div className="w-full py-5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-3xl flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest shadow-inner">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                Identity Verified
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Individual View: Render one card per PARTICIPANT
                        program.teams.flatMap((team) => team.participants.map((participant) => (
                            <div key={participant.chestNumber} className="relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all flex flex-col items-center text-center">

                                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl font-black transition-all duration-1000 ${participant.isCodeRevealed ? 'bg-indigo-600 text-white shadow-2xl scale-100' : 'bg-slate-100 text-slate-200 border-2 border-dashed border-slate-300 rotate-12 scale-90'}`}>
                                    {participant.isCodeRevealed ? participant.codeLetter : '?'}
                                </div>
                                <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-3">Secret ID</p>

                                <div className="mt-8 w-full">
                                    <h4 className="text-lg font-black text-slate-900 leading-none uppercase truncate">{participant.name}</h4>
                                    <div className="flex flex-col items-center mt-2">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Chest #{participant.chestNumber}</span>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase mt-1 truncate max-w-full">{team.teamName}</span>
                                    </div>
                                </div>

                                <div className="mt-6 w-full px-4 py-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter truncate leading-tight">{program.name}</p>
                                </div>

                                <div className="mt-8 w-full">
                                    {!participant.isCodeRevealed ? (
                                        <button
                                            onClick={async () => {
                                                // Atomically assign AND reveal to avoid race conditions with stale state
                                                if (!participant.codeLetter) {
                                                    // Call assign logic passing the chest number to also reveal it
                                                    await onAssignCodes(program.id, participant.chestNumber);
                                                } else {
                                                    await onRevealCode(program.id, participant.chestNumber);
                                                }
                                            }}
                                            className="w-full py-5 bg-slate-900 text-white rounded-3xl flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group"
                                        >
                                            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            Scratch Here
                                        </button>
                                    ) : (
                                        <div className="w-full py-5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-3xl flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-widest shadow-inner">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            Identity Verified
                                        </div>
                                    )}
                                </div>
                            </div>
                        )))
                    )}
                </div>
            </div>
        </div>
    );
};

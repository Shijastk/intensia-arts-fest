
import React, { useState } from 'react';
import { Program, ProgramStatus } from '../types';

interface ProgramAccordionProps {
  program: Program;
  onUpdateStatus: (id: string, status: ProgramStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (program: Program) => void;
  onSelectParticipant: (name: string) => void;
  onPublish: (id: string) => void;
  onRequestCancel: (id: string) => void;
}

export const ProgramAccordion: React.FC<ProgramAccordionProps> = ({
  program,
  onUpdateStatus,
  onDelete,
  onEdit,
  onSelectParticipant,
  onPublish,
  onRequestCancel
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: ProgramStatus) => {
    switch (status) {
      case ProgramStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case ProgramStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case ProgramStatus.CANCELLED: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as ProgramStatus;
    if (nextStatus === ProgramStatus.CANCELLED) {
      onRequestCancel(program.id);
    } else {
      onUpdateStatus(program.id, nextStatus);
    }
  };

  return (
    <div className={`mb-3 transition-all duration-300 ${isOpen ? 'ring-2 ring-indigo-500/20' : ''}`}>
      <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-300 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 gap-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex items-center space-x-4 text-left"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${program.isPublished ? 'bg-emerald-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
              {program.isPublished ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">{program.name}</h3>
                {program.isPublished && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Published</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{program.category}</span>
                {program.startTime && (
                  <span className="flex items-center text-[10px] text-indigo-600 font-bold">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {program.startTime}
                  </span>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center space-x-2">
            {/* Always-visible Publish Toggle Button */}
            <button
              onClick={() => onPublish(program.id)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5 ${program.isPublished
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                }`}
              title={program.isPublished ? 'Click to unpublish' : 'Click to publish'}
            >
              {program.isPublished ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  Unpublish
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Publish
                </>
              )}
            </button>

            <select
              value={program.status}
              onChange={handleStatusChange}
              disabled={program.status === ProgramStatus.COMPLETED}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer transition-colors ${getStatusColor(program.status)} text-slate-900 ${program.status === ProgramStatus.COMPLETED ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {/* COMPLETED is only shown if it's already the status, admins cannot select it manually */}
              {program.status === ProgramStatus.COMPLETED && <option value={ProgramStatus.COMPLETED}>COMPLETED</option>}
              <option value={ProgramStatus.PENDING}>PENDING</option>
              <option value={ProgramStatus.CANCELLED}>CANCELLED</option>
            </select>

            <button
              onClick={() => onEdit(program)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
              title="Schedule / Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>

            <button
              onClick={() => onDelete(program.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>

            <button onClick={() => setIsOpen(!isOpen)} className="p-1">
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="bg-slate-50 border-t border-slate-200 p-4">
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-100 shadow-sm">
              <table className="w-full text-left text-[11px] sm:text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2">Chest No / Code</th>
                    <th className="px-3 py-2">Team & Participants</th>
                    <th className="px-3 py-2 text-center">Rank</th>
                    <th className="px-3 py-2 text-center">Grade</th>
                    <th className="px-3 py-2 text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {program.teams.length > 0 ? program.teams.map((team) => (
                    <tr key={team.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{team.participants[0]?.chestNumber || 'N/A'}</span>
                          <span className="text-slate-400 text-[9px]">Code: {team.participants[0]?.codeLetter || '-'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-700">{team.teamName}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.participants.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => onSelectParticipant(p.name)}
                              className="text-indigo-600 hover:underline font-medium"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {program.status === ProgramStatus.COMPLETED ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold">#{team.rank}</span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {program.status === ProgramStatus.COMPLETED ? (
                          <span className="font-bold text-emerald-600">{team.grade || '-'}</span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {program.status === ProgramStatus.COMPLETED ? (
                          <span className="font-bold text-slate-800">{team.points || '0'}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No registrations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

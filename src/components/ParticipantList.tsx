import React, { useMemo, useState } from 'react';
import { Program } from '../types';

interface ParticipantListProps {
  programs: Program[];
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ programs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);

  const participants = useMemo(() => {
    const map = new Map<string, any>();
    programs.forEach(p => {
      (p.teams || []).forEach(team => {
        (team.participants || []).forEach(pt => {
          if (!map.has(pt.chestNumber)) {
            map.set(pt.chestNumber, {
              chestNumber: pt.chestNumber,
              name: pt.name,
              teamName: team.teamName,
              programs: []
            });
          }
          map.get(pt.chestNumber).programs.push({
            name: p.name,
            points: pt.points || 0,
            venue: p.venue,
            startTime: p.startTime,
            status: p.status
          });
        });
      });
    });

    let result = Array.from(map.values());
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || p.chestNumber.includes(term));
    }
    return result.sort((a, b) => a.chestNumber.localeCompare(b.chestNumber));
  }, [programs, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">All Performers ({participants.length})</h3>
        <input 
          type="text" 
          placeholder="Search by name or chest no..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600"
        />
      </div>

      {/* List View converted to 2 or 3 columns in desktop */}
       <div className="bg-white border border-slate-200 rounded-xl overflow-hidden p-4">
         {participants.length === 0 ? (
           <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase">No performers found.</div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {participants.map((p, idx) => (
               <div key={idx} className="p-4 flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-400 transition-all">
                 <div className="flex items-center gap-3 min-w-0">
                   <span className="w-10 h-10 flex items-center justify-center bg-white text-slate-800 font-mono font-black text-xs rounded-full border border-slate-200 shrink-0">
                     {p.chestNumber}
                   </span>
                   <div className="min-w-0">
                     <h4 className="text-sm font-black text-slate-900 uppercase leading-tight truncate">{p.name}</h4>
                     <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 truncate">{p.teamName}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => setSelectedParticipant(p)}
                   className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 text-slate-600 rounded text-[10px] font-bold uppercase transition-all shrink-0 ml-2"
                 >
                   View Details
                 </button>
               </div>
             ))}
           </div>
         )}
       </div>

      {/* Standard Modal instead of old Purple Card Design */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedParticipant(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Performer Info</h3>
              <button onClick={() => setSelectedParticipant(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">✕</button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 text-center border-b border-slate-100">
              <div className="w-16 h-16 mx-auto bg-indigo-100 text-indigo-700 font-black text-2xl rounded-full flex items-center justify-center mb-3">
                {selectedParticipant.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase">{selectedParticipant.name}</h2>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1 tracking-wider">
                Chest #{selectedParticipant.chestNumber} • {selectedParticipant.teamName}
              </p>
            </div>

            {/* Event Details */}
            <div className="p-5 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Participating Events ({selectedParticipant.programs.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedParticipant.programs.map((prog: any, i: number) => (
                  <div key={i} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-lg gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-700 uppercase truncate">{prog.name}</span>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0 ml-2">
                        {prog.points > 0 ? `${prog.points} Pts` : prog.status}
                      </span>
                    </div>
                    {(prog.venue || prog.startTime) && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {prog.venue && <span>📍 {prog.venue}</span>}
                        {prog.venue && prog.startTime && <span>•</span>}
                        {prog.startTime && <span>🕒 {new Date(prog.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
               <button onClick={() => setSelectedParticipant(null)} className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-slate-800 transition-colors">
                  Close Detail
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
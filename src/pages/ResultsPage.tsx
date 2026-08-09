import React, { useMemo, useState, useEffect } from 'react';
import { Program, ProgramStatus } from '../types';
import { Link } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

const extractZone = (category: string): string => {
  const catLower = category.toLowerCase();
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
  return results.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return b.points - a.points;
  }).slice(0, 3);
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
  return participants.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return b.points - a.points;
  }).slice(0, 3);
};

interface ResultsPageProps {
  programs: Program[];
}

export const ResultsPage: React.FC<ResultsPageProps & { festId?: string }> = ({ programs, festId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [activeSlide, setActiveSlide] = useState(0);

  const { settings } = useSettings(festId || null);
  const showOverallPoints = settings?.showOverallLeaderboardInPublic === true;

  const completedPrograms = useMemo(
    () => programs
      .filter(p => p.status === ProgramStatus.COMPLETED && p.isResultPublished)
      .reverse(),
    [programs]
  );

  const overallTeamScores = useMemo(() => {
    const scores: Record<string, number> = {};
    completedPrograms.forEach(program => {
      program.teams?.forEach(team => {
        if (team.points) {
          scores[team.teamName] = (scores[team.teamName] || 0) + team.points;
        }
        team.participants?.forEach(p => {
          if (p.points) {
            scores[team.teamName] = (scores[team.teamName] || 0) + p.points;
          }
        });
      });
    });
    return Object.entries(scores)
      .map(([teamName, points]) => ({ teamName, points }))
      .sort((a, b) => b.points - a.points);
  }, [completedPrograms]);

  const latestPrograms = completedPrograms.slice(0, 5);

  const carouselItems = useMemo(() => {
    const items: any[] = [];
    if (showOverallPoints && overallTeamScores.length > 0) {
      items.push({ type: 'OVERALL', data: overallTeamScores });
    }
    latestPrograms.forEach(p => items.push({ type: 'PROGRAM', data: p }));
    return items;
  }, [latestPrograms, showOverallPoints, overallTeamScores]);

  useEffect(() => {
    if (carouselItems.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const filteredPrograms = useMemo(() => {
    let filtered = completedPrograms;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    if (selectedZone !== 'All') {
      filtered = filtered.filter(p => extractZone(p.category) === selectedZone);
    }
    return filtered.sort((a, b) => {
      const zoneA = extractZone(a.category);
      const zoneB = extractZone(b.category);
      const zoneOrder: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'General': 4 };
      return (zoneOrder[zoneA] || 5) - (zoneOrder[zoneB] || 5);
    });
  }, [completedPrograms, searchQuery, selectedZone]);

  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    completedPrograms.forEach(p => zones.add(extractZone(p.category)));
    return Array.from(zones).sort();
  }, [completedPrograms]);

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

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 pb-32 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4">
            <Link to={`/fests/${festId}`} className="text-xl font-black tracking-tight text-slate-900 uppercase">
              Leaderboard
            </Link>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-none justify-end">
             <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 focus:bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium placeholder:text-slate-400 transition-colors"
              />
            </div>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 bg-slate-100 focus:bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer transition-colors"
            >
              <option value="All">All Zones</option>
              {availableZones.map(zone => (
                <option key={zone} value={zone}>{zone === 'General' ? 'Gen' : `Zone ${zone}`}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link to={`/fests/${festId}`} className="px-4 py-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors">Home</Link>
              <Link to={`/fests/${festId}/schedule`} className="px-4 py-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors">Schedule</Link>
          </div>
        </div>
      </nav>

      {/* Latest Results Auto-Slide Hero - Bright & Elegant */}
      {carouselItems.length > 0 && (
        <div className="w-full bg-[#f8f9fa] border-b border-slate-200 py-16 relative overflow-hidden flex flex-col items-center justify-center">
          
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-100 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
          
          <h2 className="text-emerald-900/60 text-[10px] font-black uppercase tracking-[0.3em] mb-12 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Latest Updates
          </h2>

          <div className="relative w-full max-w-5xl px-4 z-10 flex flex-col items-center min-h-[300px]">
            {carouselItems.map((item, idx) => {
              if (idx !== activeSlide) return null;
              
              if (item.type === 'OVERALL') {
                const topTeams = item.data.slice(0, 3);
                return (
                  <div key="overall" className="w-full flex flex-col lg:flex-row items-center justify-between bg-gradient-to-br from-slate-900 to-indigo-950 p-8 lg:p-12 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 animate-fade-in border border-indigo-500/30">
                    <div className="flex-1 text-center lg:text-left mb-10 lg:mb-0 relative z-10 lg:pr-8">
                      <span className="inline-block px-4 py-1.5 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-amber-500/30">
                        Championship Standings
                      </span>
                      <h3 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter mb-4">Overall<br/>Leaderboard</h3>
                      <p className="text-indigo-300 font-bold uppercase tracking-widest text-[10px]">Top Performing Teams</p>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-4 relative z-10">
                      {topTeams.map((team: any, i: number) => (
                        <div key={i} className={`flex items-center justify-between p-4 md:p-5 rounded-2xl transition-transform hover:-translate-x-2 ${
                          i === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-xl shadow-amber-900/20 text-white' : 
                          i === 1 ? 'bg-white/10 backdrop-blur-md border border-white/10 text-white' : 
                          'bg-white/5 backdrop-blur-md border border-white/5 text-white'
                        }`}>
                           <div className="flex items-center gap-4 sm:gap-6">
                             <span className="text-3xl md:text-4xl filter drop-shadow-md">{i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}</span>
                             <div className="text-left">
                               <p className={`font-black uppercase tracking-tight leading-none mb-1 ${i === 0 ? 'text-2xl' : 'text-lg'}`}>{team.teamName}</p>
                               <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${i === 0 ? 'text-amber-200' : 'text-indigo-300'}`}>Total Points</p>
                             </div>
                           </div>
                           <span className={`font-black tracking-tighter ${i === 0 ? 'text-4xl' : 'text-2xl'}`}>{team.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              const program = item.data;
              const results = program.isGroup 
                ? getGroupResults(program.teams || [])
                : getIndividualResults(program.teams || []);

              return (
                <div key={program.id} className="w-full flex flex-col lg:flex-row items-center justify-between bg-white/70 backdrop-blur-2xl p-8 lg:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 transition-all duration-700 animate-fade-in border border-white">
                  
                  <div className="flex-1 text-center lg:text-left mb-10 lg:mb-0 relative z-10 lg:pr-8">
                    <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                      {program.category}
                    </span>
                    <h3 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-4">{program.name}</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Just Announced</p>
                  </div>

                  <div className="flex-1 w-full flex flex-col gap-3 relative z-10">
                    {results.length > 0 ? (
                      results.map((r, i) => (
                        <div key={i} className={`flex items-center justify-between p-4 md:p-5 rounded-2xl transition-transform hover:-translate-y-1 ${
                          r.rank === 1 ? 'bg-amber-50 shadow-sm border border-amber-100' : 
                          r.rank === 2 ? 'bg-slate-50 border border-slate-100' : 
                          'bg-white border border-slate-100'
                        }`}>
                           <div className="flex items-center gap-4 sm:gap-6">
                             <span className="text-3xl md:text-4xl filter drop-shadow-sm">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}</span>
                             <div className="text-left">
                               <p className={`font-black uppercase tracking-tight leading-none mb-1 ${r.rank === 1 ? 'text-amber-700 text-lg md:text-xl' : 'text-slate-800 text-base md:text-lg'}`}>{r.name}</p>
                               <p className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{r.teamName}</p>
                             </div>
                           </div>
                           <span className={`font-black tracking-tighter ${r.rank === 1 ? 'text-amber-600 text-2xl' : 'text-slate-500 text-xl'}`}>{r.points}</span>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl mb-3 opacity-50">⏳</span>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Tabulation Pending</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-4 mt-12 z-10">
            {carouselItems.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-500 ${idx === activeSlide ? 'w-12 bg-emerald-500' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Table Layout */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pt-16">
        <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Full Leaderboard</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{filteredPrograms.length} Events</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="flex flex-col">
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Details</div>
                        <div className="col-span-3 text-[10px] font-black text-amber-600 uppercase tracking-widest"><span className="text-base mr-1 drop-shadow-sm">🥇</span> 1st Place</div>
                        <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest"><span className="text-base mr-1 drop-shadow-sm">🥈</span> 2nd Place</div>
                        <div className="col-span-3 text-[10px] font-black text-orange-700 uppercase tracking-widest"><span className="text-base mr-1 drop-shadow-sm">🥉</span> 3rd Place</div>
                    </div>
                    <div className="block md:grid md:grid-cols-2 lg:block divide-y md:divide-y-0 lg:divide-y divide-slate-100 md:gap-4 lg:gap-0 md:p-4 lg:p-0">
                        {filteredPrograms.map((program) => {
                            const results = program.isGroup 
                                ? getGroupResults(program.teams || [])
                                : getIndividualResults(program.teams || []);
                            
                            return (
                                <div key={program.id} className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors group md:bg-white md:border md:border-slate-100 md:rounded-[1.5rem] md:shadow-sm lg:bg-transparent lg:border-0 lg:rounded-none lg:shadow-none">
                                    <div className="col-span-3 pb-4 lg:pb-0 border-b border-slate-100 lg:border-0">
                                        <h3 className="text-base font-black text-slate-900 leading-tight mb-2 group-hover:text-emerald-700 transition-colors">{program.name}</h3>
                                        <div className="flex gap-2">
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">
                                                {program.category}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase tracking-widest">
                                                {program.isGroup ? 'GROUP' : 'INDIV'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="col-span-3 flex lg:block items-center gap-4 lg:border-l lg:border-slate-100/50 lg:px-4 lg:bg-amber-50/10 rounded lg:rounded-none">
                                        <span className="lg:hidden text-2xl drop-shadow-sm">🥇</span>
                                        {getWinnerNode(results, 1)}
                                    </div>
                                    
                                    <div className="col-span-3 flex lg:block items-center gap-4 lg:border-l lg:border-slate-100/50 lg:px-4">
                                        <span className="lg:hidden text-2xl drop-shadow-sm">🥈</span>
                                        {getWinnerNode(results, 2)}
                                    </div>
                                    
                                    <div className="col-span-3 flex lg:block items-center gap-4 lg:border-l lg:border-slate-100/50 lg:px-4">
                                        <span className="lg:hidden text-2xl drop-shadow-sm">🥉</span>
                                        {getWinnerNode(results, 3)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {filteredPrograms.length === 0 && (
                    <div className="text-center py-24 px-4">
                        <span className="text-5xl mb-6 block opacity-80">📭</span>
                        <p className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Matches Found</p>
                        <p className="text-sm text-slate-500 font-medium">Try adjusting your search or zone filters.</p>
                    </div>
                )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

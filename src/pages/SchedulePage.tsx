import React, { useMemo, useState } from 'react';
import { Program, ProgramStatus } from '../types';
import { Link } from 'react-router-dom';

const parseTime = (timeStr?: string) => {
    if (!timeStr) return 999999;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 999999;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr) return 'TBA';
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    
    const datePart = d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        timeZone: 'Asia/Kolkata' 
    });
    const timePart = d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true, 
        timeZone: 'Asia/Kolkata' 
    });
    
    return `${datePart} - ${timePart}`;
};

interface SchedulePageProps {
    programs: Program[];
}

export const SchedulePage: React.FC<SchedulePageProps & { festId?: string }> = ({ programs, festId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVenue, setSelectedVenue] = useState<string>('All');

    const availableVenues = useMemo(() => {
        const venues = new Set<string>();
        programs.forEach(p => { if (p.venue) venues.add(p.venue); });
        return Array.from(venues).sort();
    }, [programs]);

    const upcomingPrograms = useMemo(() => {
        let filtered = programs.filter(p => !!p.startTime && p.status !== ProgramStatus.COMPLETED && p.status !== ProgramStatus.CANCELLED);
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => {
                if (p.name.toLowerCase().includes(query)) return true;
                if (p.category && p.category.toLowerCase().includes(query)) return true;
                
                let foundInParticipant = false;
                p.teams?.forEach(t => {
                    if (t.teamName && t.teamName.toLowerCase().includes(query)) foundInParticipant = true;
                    t.participants?.forEach(pt => {
                        if (pt.name && pt.name.toLowerCase().includes(query)) foundInParticipant = true;
                        if (pt.chestNumber && pt.chestNumber.toLowerCase().includes(query)) foundInParticipant = true;
                    });
                });
                return foundInParticipant;
            });
        }
        if (selectedVenue !== 'All') {
            filtered = filtered.filter(p => p.venue === selectedVenue);
        }
        
        return filtered.sort((a, b) => {
            if (a.status === ProgramStatus.JUDGING && b.status !== ProgramStatus.JUDGING) return -1;
            if (a.status !== ProgramStatus.JUDGING && b.status === ProgramStatus.JUDGING) return 1;
            return parseTime(a.startTime) - parseTime(b.startTime);
        });
    }, [programs, searchQuery, selectedVenue]);

    const activeStagePrograms = useMemo(() => {
        const map = new Map<string, Program>();
        upcomingPrograms.forEach(p => {
            if (p.venue && !map.has(p.venue)) {
                map.set(p.venue, p);
            }
        });
        return Array.from(map.values());
    }, [upcomingPrograms]);

    const getParticipantsList = (program: Program) => {
        if (!program.teams || program.teams.length === 0) return 'TBA';
        const names: string[] = [];
        if (program.isGroup) {
            program.teams.forEach(t => { if (t.teamName) names.push(t.teamName) });
        } else {
            program.teams.forEach(t => {
                t.participants?.forEach(p => {
                    if (p.name) {
                        const chestStr = p.chestNumber ? ` (#${p.chestNumber})` : '';
                        names.push(`${p.name}${chestStr}`);
                    }
                });
            });
        }
        if (names.length === 0) return 'TBA';
        return names.join(' • ');
    };

    return (
        <div className="min-h-screen bg-[#faf8f5] font-sans text-slate-900 pb-20 selection:bg-emerald-200 selection:text-emerald-900">
            
            {/* Header/Navbar */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-4">
                        <Link to={`/fests/${festId}`} className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            Event Schedule
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-none justify-end">
                       <div className="relative flex-1 sm:w-64">
                        <input
                          type="text"
                          placeholder="Search schedule..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-100 focus:bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium placeholder:text-slate-400 transition-colors"
                        />
                      </div>
                      <select
                        value={selectedVenue}
                        onChange={(e) => setSelectedVenue(e.target.value)}
                        className="px-4 py-2 bg-slate-100 focus:bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer transition-colors"
                      >
                        <option value="All">All Stages</option>
                        {availableVenues.map(venue => (
                          <option key={venue} value={venue}>{venue}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link to={`/fests/${festId}`} className="px-4 py-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors">Home</Link>
                        <Link to={`/fests/${festId}/results`} className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors">Results</Link>
                    </div>
                </div>
            </nav>

            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pt-8">

                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 mt-4">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Full Schedule</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{upcomingPrograms.length} Events</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="flex flex-col">
                        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</div>
                            <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Details</div>
                            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue</div>
                            <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Participants</div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {upcomingPrograms.map((program) => (
                                <div key={program.id} className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors group">
                                    <div className="col-span-2 flex lg:flex-col justify-between items-start gap-2 border-b border-slate-100 pb-3 lg:border-0 lg:pb-0">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm font-black text-slate-900">{formatDisplayTime(program.startTime)}</span>
                                            {program.status === ProgramStatus.JUDGING && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                    Ongoing
                                                </span>
                                            )}
                                        </div>
                                        <span className="lg:hidden text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{program.venue || 'TBA'}</span>
                                    </div>
                                    <div className="col-span-4 flex flex-col">
                                        <h3 className="text-base font-black text-slate-900 leading-tight mb-1 group-hover:text-emerald-700 transition-colors">{program.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded">
                                                {program.category}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest rounded">
                                                {program.isGroup ? 'GROUP' : 'INDIV'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="hidden lg:block col-span-2">
                                        <span className="text-sm font-bold text-slate-700">{program.venue || 'TBA'}</span>
                                    </div>
                                    <div className="col-span-4 mt-2 lg:mt-0">
                                        <p className="lg:hidden text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scheduled Participants</p>
                                        <div className="text-xs font-semibold text-slate-500 leading-relaxed max-w-lg">
                                            {getParticipantsList(program)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {upcomingPrograms.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                                <div className="text-4xl mb-4 opacity-70">🎉</div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h2>
                                <p className="text-sm text-slate-500 font-medium">No upcoming events found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              .hide-scrollbar::-webkit-scrollbar { display: none; }
              .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

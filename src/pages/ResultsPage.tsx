import React, { useMemo } from 'react';
import { Program, ProgramStatus } from '../types';
import { Link } from 'react-router-dom';

interface ResultsPageProps {
    programs: Program[];
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ programs }) => {
    const completedPrograms = useMemo(() =>
        programs.filter(p => p.status === ProgramStatus.COMPLETED && p.isResultPublished).sort((a, b) =>
            (b.startTime || '').localeCompare(a.startTime || '')
        ),
        [programs]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <nav className="sticky top-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link to="/" className="flex items-center gap-2 sm:gap-3">
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-tr from-teal-600 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white font-black text-xs sm:text-lg shadow-lg shadow-teal-200">
                                    I
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Intensia</span>
                                <span className="text-[8px] sm:text-[10px] font-bold text-teal-600 uppercase tracking-widest">Arts Fest</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors">
                                ← Back to Home
                            </Link>
                            <Link
                                to="/login"
                                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-slate-200"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Results Section */}
            <div className="py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 md:mb-12">
                        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">— All Results</p>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">Published Results</h1>
                        <p className="text-slate-500 mt-2">View all completed program results</p>
                    </div>

                    {/* Results Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedPrograms.length > 0 ? completedPrograms.map(prog => (
                            <div key={prog.id} className="group bg-white rounded-[2rem] p-2 hover:shadow-xl transition-all border border-slate-100 h-full flex flex-col">
                                {/* Card Header */}
                                <div className="h-40 bg-slate-100 rounded-[1.5rem] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 group-hover:scale-105 transition-transform duration-500"></div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-900">
                                            {prog.category}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{prog.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{prog.venue} • {prog.startTime}</p>
                                    </div>
                                </div>

                                {/* Winners List - Sorted by Points */}
                                <div className="p-4 space-y-3 flex-1">
                                    {prog.teams
                                        .filter(t => t.points && t.points > 0)
                                        .sort((a, b) => (b.points || 0) - (a.points || 0))
                                        .slice(0, 3) // Top 3
                                        .map((team, index) => (
                                            <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                    index === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-900 uppercase line-clamp-1">{team.participants[0]?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{team.teamName}</p>
                                                </div>
                                                <div className="text-right">
                                                    {/* <p className="text-sm font-black text-emerald-600">{team.points}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Points</p> */}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center py-20 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                                <p className="text-slate-400 font-bold uppercase text-sm">No results published yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

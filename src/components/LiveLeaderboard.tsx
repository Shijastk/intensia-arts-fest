import React, { useMemo } from 'react';
import { Program } from '../types';
import { calculateLeaderboardStats } from '../utils/statsCalculator';

interface LiveLeaderboardProps {
    programs: Program[];
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ programs }) => {
    const stats = useMemo(() => calculateLeaderboardStats(programs), [programs]);

    if (!stats.leadingTeam) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Main Leaderboard */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl md:col-span-1 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Current Champion</h3>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase backdrop-blur-sm">Live Update</span>
                </div>

                <div className="text-center py-6">
                    <h2 className="text-4xl font-black uppercase tracking-tight mb-2">{stats.leadingTeam.name}</h2>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-6xl font-black">{stats.leadingTeam.score}</span>
                        <span className="text-xl font-bold opacity-60 mt-4">pts</span>
                    </div>
                    {stats.trailingTeam && (
                        <p className="text-sm font-medium mt-4 bg-white/10 inline-block px-4 py-1 rounded-lg">
                            Leading by <span className="font-black text-amber-300">{stats.margin}</span> points
                        </p>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex justify-between text-sm opacity-80">
                    <span>{stats.trailingTeam?.name}</span>
                    <span className="font-bold">{stats.trailingTeam?.score} pts</span>
                </div>
            </div>

            {/* Individual Toppers */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Kala Prathibha */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Kala Prathibha</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">Overall Topper (Stage + Off Stage)</p>

                    {stats.kalaPrathibha ? (
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-600 shadow-inner">
                                    {stats.kalaPrathibha.points}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase leading-none">{stats.kalaPrathibha.name}</h4>
                                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase">{stats.kalaPrathibha.teamName} &bull; Chest #{stats.kalaPrathibha.chestNumber}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-slate-300 text-sm font-bold uppercase italic border-2 border-dashed border-slate-100 rounded-2xl">
                            Waiting for results
                        </div>
                    )}
                </div>

                {/* Sarkha Prathibha */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H11.983C10.8784 16 9.98295 16.8954 9.98295 18L9.98295 21H2V11L12 2L22 11V21H14.017ZM12 14C9.79086 14 8 12.2091 8 10V6H16V10C16 12.2091 14.2091 14 12 14Z" /></svg>
                    </div>
                    <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Sarkha Prathibha</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">Off-Stage / Literary Topper</p>

                    {stats.sarkhaPrathibha ? (
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl font-black text-rose-600 shadow-inner">
                                    {stats.sarkhaPrathibha.points}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase leading-none">{stats.sarkhaPrathibha.name}</h4>
                                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase">{stats.sarkhaPrathibha.teamName} &bull; Chest #{stats.sarkhaPrathibha.chestNumber}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-slate-300 text-sm font-bold uppercase italic border-2 border-dashed border-slate-100 rounded-2xl">
                            Waiting for results
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

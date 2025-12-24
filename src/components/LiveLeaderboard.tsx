import React, { useMemo, useState } from 'react';
import { Program } from '../types';
import { calculateLeaderboardStats, CategoryChampion } from '../utils/statsCalculator';

interface LiveLeaderboardProps {
    programs: Program[];
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ programs }) => {
    const stats = useMemo(() => calculateLeaderboardStats(programs), [programs]);
    const [activeTab, setActiveTab] = useState<'OVERALL' | 'A' | 'B' | 'C'>('OVERALL');

    if (!stats.leadingTeam) return null;

    const renderChampionCard = (title: string, champion: CategoryChampion | null | undefined, subtitle: string, colorClass: string, iconColor: string) => (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
            <h3 className={`text-xs font-black ${colorClass} uppercase tracking-widest mb-1`}>{title}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{subtitle}</p>

            {champion ? (
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${colorClass.replace('text-', 'bg-').replace('600', '50')} rounded-xl flex items-center justify-center text-lg font-black ${colorClass} shadow-inner`}>
                        {champion.points}
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase leading-none truncate max-w-[150px]" title={champion.name}>{champion.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{champion.teamName}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">#{champion.chestNumber}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-12 flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase italic border border-dashed border-slate-200 rounded-xl">
                    Waiting for results
                </div>
            )}
        </div>
    );

    const renderZoneContent = (zoneKey: string) => {
        const zone = stats.zones[zoneKey];
        if (!zone) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Zone Champion */}
                <div className="bg-indigo-900 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">{zone.name} Champion</p>
                    {zone.leadingTeam ? (
                        <>
                            <h2 className="text-3xl font-black uppercase tracking-tight">{zone.leadingTeam.name}</h2>
                            <p className="text-xl font-bold text-indigo-200 mt-1">{zone.leadingTeam.score} pts</p>
                            <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-indigo-300">
                                <span>PRUDENTIA: {zone.teamScores['PRUDENTIA'] || 0}</span>
                                <span>SAPIENTIA: {zone.teamScores['SAPIENTIA'] || 0}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-lg font-bold opacity-50">No results yet</p>
                    )}
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Overall Zone Toppers */}
                    {renderChampionCard(`${zone.name} Kala Prathibha`, zone.kalaPrathibha, "Overall Zone Topper", "text-indigo-600", "indigo")}
                    {renderChampionCard(`${zone.name} Sarga Prathibha`, zone.sargaPrathibha, "Off-Stage Zone Topper", "text-rose-600", "rose")}

                    {/* Junior/Senior Breakdowns */}
                    {Object.entries(zone.categories).map(([catName, champions]) => (
                        <React.Fragment key={catName}>
                            {renderChampionCard(`${catName} Kala Prathibha`, champions.kalaPrathibha, `${catName} Overall Topper`, "text-violet-600", "violet")}
                            {renderChampionCard(`${catName} Sarga Prathibha`, champions.sargaPrathibha, `${catName} Off-Stage Topper`, "text-amber-600", "amber")}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="mb-8">
            {/* Tabs */}
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl mb-6 w-fit mx-auto md:mx-0">
                {['OVERALL', 'A', 'B', 'C'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        {tab === 'OVERALL' ? 'Festival Overview' : `${tab} Zone`}
                    </button>
                ))}
            </div>

            {activeTab === 'OVERALL' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Simplified Main Leaderboard for consistency */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl md:col-span-1 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Festival Champion</h3>
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase backdrop-blur-sm">Live</span>
                        </div>
                        <div className="text-center py-4">
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-1">{stats.leadingTeam.name}</h2>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-5xl font-black">{stats.leadingTeam.score}</span>
                                <span className="text-sm font-bold opacity-60 mt-4">pts</span>
                            </div>
                            {stats.trailingTeam && (
                                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs opacity-80">
                                    <span>{stats.trailingTeam.name}</span>
                                    <span className="font-bold">{stats.trailingTeam.score} pts</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Overall Toppers */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderChampionCard("Kala Prathibha", stats.kalaPrathibha, "Festival Overall Topper", "text-indigo-600", "indigo")}
                        {renderChampionCard("Sarkha Prathibha", stats.sarkhaPrathibha, "Festival Off-Stage Topper", "text-rose-600", "rose")}

                        {/* Zone Summaries */}
                        <div className="col-span-1 sm:col-span-2 bg-white rounded-3xl p-5 border border-slate-200">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Zone Leaderboard</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {['A', 'B', 'C'].map(z => {
                                    const zStats = stats.zones[z];
                                    const leader = zStats.leadingTeam;
                                    return (
                                        <div key={z} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 mb-1">{zStats.name}</p>
                                            {leader ? (
                                                <>
                                                    <p className={`text-xs font-black uppercase ${leader.name === 'PRUDENTIA' ? 'text-indigo-600' : 'text-violet-600'}`}>
                                                        {leader.name.substring(0, 4)}..
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-500">{leader.score} pts</p>
                                                </>
                                            ) : <p className="text-xs text-slate-300">-</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                renderZoneContent(activeTab)
            )}
        </div>
    );
};

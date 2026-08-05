import React, { useMemo, useState } from 'react';
import { Program } from '../types';
import { calculateLeaderboardStats, CategoryChampion, TeamScore, ZoneStats } from '../utils/statsCalculator';

interface LiveLeaderboardProps {
  programs: Program[];
}

const teamColorClasses = [
  'text-indigo-600 bg-indigo-50',
  'text-violet-600 bg-violet-50',
  'text-emerald-600 bg-emerald-50',
  'text-rose-600 bg-rose-50',
  'text-amber-600 bg-amber-50',
];

const getTeamStyle = (teamName: string, teamNames: string[]) => {
  const index = Math.max(teamNames.indexOf(teamName), 0);
  return teamColorClasses[index % teamColorClasses.length];
};

const getSortedScores = (teamScores: Record<string, number>): TeamScore[] => {
  return Object.entries(teamScores)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ programs }) => {
  const stats = useMemo(() => calculateLeaderboardStats(programs), [programs]);
  const availableZones = useMemo(() => Object.keys(stats.zones).sort(), [stats.zones]);
  const [activeTab, setActiveTab] = useState<'OVERALL' | string>('OVERALL');

  const teamNames = useMemo(() => {
    const names = new Set<string>();
    (Object.values(stats.zones) as ZoneStats[]).forEach(zone => {
      Object.keys(zone.teamScores).forEach(teamName => names.add(teamName));
    });
    return Array.from(names).sort();
  }, [stats.zones]);

  const overallScores = useMemo(() => {
    const scores = Object.fromEntries(teamNames.map(teamName => [teamName, 0]));
    (Object.values(stats.zones) as ZoneStats[]).forEach(zone => {
      Object.entries(zone.teamScores).forEach(([teamName, score]) => {
        scores[teamName] = (scores[teamName] || 0) + score;
      });
    });
    return getSortedScores(scores);
  }, [stats.zones, teamNames]);

  const renderChampionCard = (
    title: string,
    champion: CategoryChampion | null | undefined,
    subtitle: string,
    colorClass: string
  ) => (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
      <h3 className={`text-xs font-black ${colorClass} uppercase tracking-widest mb-1`}>{title}</h3>
      <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{subtitle}</p>

      {champion ? (
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${colorClass.replace('text-', 'bg-').replace('600', '50')} rounded-xl flex items-center justify-center text-lg font-black ${colorClass} shadow-inner`}>
            {champion.points}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase leading-none truncate max-w-[150px]" title={champion.name}>
              {champion.name}
            </h4>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getTeamStyle(champion.teamName, teamNames)}`}>
                {champion.teamName}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5 rounded">
                #{champion.chestNumber}
              </span>
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

  const renderScoreRows = (scores: TeamScore[]) => (
    <div className="space-y-2">
      {scores.map((score, index) => (
        <div key={score.name} className="flex justify-between items-center text-sm">
          <span className={`font-black uppercase ${index === 0 ? 'text-indigo-200' : 'text-slate-300'}`}>
            {index + 1}. {score.name}
          </span>
          <span className="font-bold">{score.score.toFixed(1)} pts</span>
        </div>
      ))}
    </div>
  );

  const renderZoneContent = (zoneKey: string) => {
    const zone = stats.zones[zoneKey];
    if (!zone) return null;

    const zoneScores = getSortedScores(zone.teamScores);
    const totalZoneScore = zoneScores.reduce((sum, score) => sum + score.score, 0);
    const leaderWidth = totalZoneScore > 0 ? ((zoneScores[0]?.score || 0) / totalZoneScore) * 100 : 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">
            {zone.name} Team Holders
          </p>

          {zoneScores.length > 0 ? renderScoreRows(zoneScores.slice(0, 3)) : (
            <p className="text-sm font-bold text-indigo-200">No results yet</p>
          )}

          {zoneScores.length > 1 && (
            <div className="mt-4 text-xs text-indigo-300 text-center">
              Difference: <span className="font-bold">{Math.abs(zoneScores[0].score - zoneScores[1].score).toFixed(1)} pts</span>
            </div>
          )}

          {totalZoneScore > 0 && (
            <div className="bg-white/10 rounded-full h-3 overflow-hidden mt-5">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-indigo-300 rounded-full"
                style={{ width: `${leaderWidth}%` }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm font-medium">
            {zoneScores.map(score => (
              <div key={score.name} className="text-center text-indigo-300">
                <div className="text-xs opacity-80 truncate">{score.name}</div>
                <div className="font-bold">{score.score.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderChampionCard(`${zone.name} Kala Prathibha`, zone.kalaPrathibha, 'Overall Zone Topper', 'text-indigo-600')}
          {renderChampionCard(`${zone.name} Sarga Prathibha`, zone.sargaPrathibha, 'Off-Stage Zone Topper', 'text-rose-600')}

          {(Object.entries(zone.categories) as [string, { kalaPrathibha: CategoryChampion | null; sargaPrathibha: CategoryChampion | null }][]).map(([categoryName, champions]) => {
            const formattedName = categoryName
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return (
              <React.Fragment key={categoryName}>
                {champions.kalaPrathibha && renderChampionCard(
                  `${formattedName} Kala Prathibha`,
                  champions.kalaPrathibha,
                  `${formattedName} Overall`,
                  'text-violet-600'
                )}
                {champions.sargaPrathibha && renderChampionCard(
                  `${formattedName} Sarga Prathibha`,
                  champions.sargaPrathibha,
                  `${formattedName} Off-Stage`,
                  'text-amber-600'
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  if (overallScores.length === 0 || !overallScores[0].name) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl mb-6 w-fit mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab('OVERALL')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'OVERALL'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Festival Overview
        </button>

        {availableZones.map(zone => (
          <button
            key={zone}
            onClick={() => setActiveTab(zone)}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === zone
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {zone} Zone
          </button>
        ))}
      </div>

      {activeTab === 'OVERALL' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl md:col-span-1 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Festival Champion</h3>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase backdrop-blur-sm">Live</span>
            </div>
            <div className="text-center py-4">
              <h2 className="text-3xl font-black uppercase tracking-tight mb-1">{overallScores[0].name}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-black">{overallScores[0].score.toFixed(1)}</span>
                <span className="text-sm font-bold opacity-60 mt-4">pts</span>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                {renderScoreRows(overallScores.slice(0, 3))}
              </div>

              {overallScores.length > 1 && (
                <div className="mt-4 text-xs text-indigo-200">
                  <span className="opacity-80">Difference: </span>
                  <span className="font-bold">{Math.abs(overallScores[0].score - overallScores[1].score).toFixed(1)} pts</span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderChampionCard('Kala Prathibha', stats.kalaPrathibha, 'Festival Overall Topper', 'text-indigo-600')}
            {renderChampionCard('Sarkha Prathibha', stats.sarkhaPrathibha, 'Festival Off-Stage Topper', 'text-rose-600')}

            <div className="col-span-1 sm:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Zone Leaderboard</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableZones.map(zoneKey => {
                  const zone = stats.zones[zoneKey];
                  const zoneScores = getSortedScores(zone.teamScores);
                  const leader = zoneScores[0];

                  return (
                    <div key={zoneKey} className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow transition-shadow">
                      <p className="text-[10px] font-bold text-slate-400 mb-2">{zone.name}</p>
                      {leader ? (
                        <div className="space-y-2">
                          <div className={`text-sm font-black uppercase ${getTeamStyle(leader.name, teamNames)}`}>
                            {leader.name}
                          </div>
                          <div className="text-xs font-bold text-slate-500">{leader.score.toFixed(1)} pts</div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
                            {zoneScores.slice(0, 3).map(score => (
                              <span key={score.name}>{score.name}: {score.score.toFixed(1)}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-slate-300">No results</p>
                        </div>
                      )}
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

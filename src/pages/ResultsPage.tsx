import React, { useMemo } from 'react';
import { Program, ProgramStatus } from '../types';
import { Link } from 'react-router-dom';

/* =====================================================
   HELPERS
===================================================== */

// -------- GROUP PROGRAM (Quiz) --------
const getGroupResults = (teams: any[]) => {
  const results: any[] = [];

  teams.forEach(team => {
    const codeMap: Record<string, any[]> = {};

    team.participants?.forEach(p => {
      if (!p.codeLetter || p.points == null) return;
      if (!codeMap[p.codeLetter]) codeMap[p.codeLetter] = [];
      codeMap[p.codeLetter].push(p);
    });

    Object.values(codeMap).forEach(members => {
      const selected = members.sort(
        (a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999)
      )[0];

      results.push({
        name: selected.name,
        teamName: team.teamName,
        points: selected.points
      });
    });
  });

  return results
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
};

// -------- INDIVIDUAL PROGRAM --------
const getIndividualResults = (teams: any[]) => {
  const participants: any[] = [];

  teams.forEach(team => {
    team.participants?.forEach(p => {
      if (p.points == null) return;

      participants.push({
        name: p.name,
        teamName: team.teamName,
        points: p.points,
        rank: p.rank
      });
    });
  });

  return participants
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    .slice(0, 3);
};

/* =====================================================
   RESULT ROW
===================================================== */

const ResultRow = ({ data, index }: any) => (
  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
          index === 0
            ? 'bg-yellow-200 text-yellow-800'
            : index === 1
            ? 'bg-slate-200 text-slate-600'
            : 'bg-orange-200 text-orange-800'
        }`}
      >
        {index + 1}
      </div>

      <div>
        <p className="text-sm font-black uppercase">
          {data.name}
        </p>
        <p className="text-[10px] font-bold uppercase text-slate-400">
          {data.teamName}
        </p>
      </div>
    </div>

    {/* <div className="text-right">
      <p className="text-sm font-black text-emerald-600">
        {data.points}
      </p>
      <p className="text-[9px] font-bold uppercase text-slate-400">
        Points
      </p>
    </div> */}
  </div>
);

/* =====================================================
   COMPONENT
===================================================== */

interface ResultsPageProps {
  programs: Program[];
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ programs }) => {
  const completedPrograms = useMemo(
    () =>
      programs.filter(
        p =>
          p.status === ProgramStatus.COMPLETED &&
          p.isResultPublished
      ),
    [programs]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <nav className="sticky top-0 bg-white border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="font-black uppercase">
            Intensia
          </Link>
          <Link
            to="/"
            className="text-xs font-bold uppercase text-slate-500"
          >
            ← Back
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-black uppercase mb-10">
            Published Results
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedPrograms.map(prog => (
              <div
                key={prog.id}
                className="bg-white rounded-[2rem] p-3 border border-slate-100"
              >
                {/* Program Header */}
                <div className="h-36 bg-slate-100 rounded-[1.5rem] p-4 relative">
                  <span className="inline-block bg-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                    {prog.category}
                  </span>

                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-black uppercase">
                      {prog.name}
                    </h3>
                  </div>
                </div>

                {/* Results */}
                <div className="p-4 space-y-3">
                  {prog.isGroup
                    ? getGroupResults(prog.teams).map((r, index) => (
                        <ResultRow
                          key={index}
                          data={r}
                          index={index}
                        />
                      ))
                    : getIndividualResults(prog.teams).map((r, index) => (
                        <ResultRow
                          key={index}
                          data={r}
                          index={index}
                        />
                      ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

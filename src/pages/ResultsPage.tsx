import React, { useMemo, useState } from 'react';
import { Program, ProgramStatus } from '../types';
import { Link } from 'react-router-dom';

/* =====================================================
   HELPERS
===================================================== */

// -------- EXTRACT ZONE FROM CATEGORY --------
const extractZone = (category: string): string => {
  const catLower = category.toLowerCase();
  if (catLower.includes('a zone')) return 'A';
  if (catLower.includes('b zone')) return 'B';
  if (catLower.includes('c zone')) return 'C';
  return 'General';
};

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
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${index === 0
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
  </div>
);

/* =====================================================
   COMPONENT
===================================================== */

interface ResultsPageProps {
  programs: Program[];
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ programs }) => {
  // State for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');

  // Get all completed and published programs
  const completedPrograms = useMemo(
    () =>
      programs.filter(
        p =>
          p.status === ProgramStatus.COMPLETED &&
          p.isResultPublished
      ),
    [programs]
  );

  // Filter programs based on search and zone
  const filteredPrograms = useMemo(() => {
    let filtered = completedPrograms;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Apply zone filter
    if (selectedZone !== 'All') {
      filtered = filtered.filter(p => extractZone(p.category) === selectedZone);
    }

    // Sort by zone
    return filtered.sort((a, b) => {
      const zoneA = extractZone(a.category);
      const zoneB = extractZone(b.category);

      // Sort order: A, B, C, General
      const zoneOrder: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'General': 4 };
      return (zoneOrder[zoneA] || 5) - (zoneOrder[zoneB] || 5);
    });
  }, [completedPrograms, searchQuery, selectedZone]);

  // Get unique zones for filter dropdown
  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    completedPrograms.forEach(p => {
      zones.add(extractZone(p.category));
    });
    return Array.from(zones).sort();
  }, [completedPrograms]);

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

          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by program name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium"
              />
            </div>

            {/* Zone Filter */}
            <div className="md:w-64">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-bold uppercase cursor-pointer"
              >
                <option value="All">All Zones</option>
                {availableZones.map(zone => (
                  <option key={zone} value={zone}>
                    {zone === 'General' ? 'General' : `Zone ${zone}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm font-bold uppercase text-slate-500 mb-6">
            Showing {filteredPrograms.length} of {completedPrograms.length} programs
          </p>

          {/* Programs Grid */}
          {filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map(prog => (
                <div
                  key={prog.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Program Header */}
                  <div className="h-36 bg-slate-100 rounded-[1.5rem] p-4 relative">
                    <div className="flex gap-2">
                      <span className="inline-block bg-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                        {prog.category}
                      </span>
                      <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                        Zone {extractZone(prog.category)}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
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
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl font-black uppercase text-slate-300 mb-2">
                No Results Found
              </p>
              <p className="text-sm font-bold text-slate-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

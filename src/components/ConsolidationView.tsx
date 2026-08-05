import React, { useMemo } from 'react';
import { Program } from '../types';
import { calculateConsolidatedResults } from '../utils/consolidationCalc';

interface ConsolidationViewProps {
  programs: Program[];
}

export const ConsolidationView: React.FC<ConsolidationViewProps> = ({ programs }) => {
  
  // Using the shared, bug-free utility function
  const stats = useMemo(() => calculateConsolidatedResults(programs), [programs]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-black min-h-screen p-4 sm:p-8 font-serif" id="print-area">
      
      {/* Header & Actions */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider">Final Result Consolidation</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">Live Dynamic Calculation Report</p>
        </div>
        <button 
          onClick={handlePrint}
          className="print:hidden px-6 py-2 bg-black text-white font-bold uppercase text-xs hover:bg-gray-800 transition-colors border-2 border-black"
        >
          Download PDF / Print
        </button>
      </div>

      {/* TOP SECTION: HIGHLIGHT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black mb-10">
        
        {/* Team Standings */}
        <div className="border-b-2 md:border-b-0 md:border-r-2 border-black p-5">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-2 mb-3">Overall Team Standings</h2>
          <table className="w-full text-sm text-left">
            <tbody>
              {stats.sortedTeams.map((team, idx) => (
                <tr key={team.name} className="border-b border-gray-300 last:border-0">
                  <td className="py-2 font-bold">{idx + 1}. {team.name}</td>
                  <td className="py-2 text-right font-bold text-lg">{team.score.toFixed(1)}</td>
                </tr>
              ))}
              {stats.sortedTeams.length === 0 && (
                <tr><td className="py-2 text-gray-500 italic">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kala Prathibha */}
        <div className="border-b-2 md:border-b-0 md:border-r-2 border-black p-5 bg-gray-50">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-2 mb-3">Kala Prathibha (Stage)</h2>
          {stats.kalaPrathibha && stats.kalaPrathibha.individualPoints > 0 ? (
            <div className="text-center mt-4">
              <h3 className="text-2xl font-black uppercase mb-1">{stats.kalaPrathibha.name}</h3>
              <p className="text-sm font-bold">{stats.kalaPrathibha.teamName}</p>
              <p className="text-xs text-gray-600 mb-3">Chest No: {stats.kalaPrathibha.chestNumber}</p>
              <div className="inline-block border-2 border-black px-4 py-1 text-xl font-bold">
                {stats.kalaPrathibha.individualPoints} Pts
              </div>
            </div>
          ) : (
            <div className="text-center mt-8 text-gray-400 italic">Pending Results</div>
          )}
        </div>

        {/* Sarga Prathibha */}
        <div className="p-5 bg-gray-50">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-2 mb-3">Sarga Prathibha (Off-Stage)</h2>
          {stats.sargaPrathibha && stats.sargaPrathibha.offStagePoints > 0 ? (
            <div className="text-center mt-4">
              <h3 className="text-2xl font-black uppercase mb-1">{stats.sargaPrathibha.name}</h3>
              <p className="text-sm font-bold">{stats.sargaPrathibha.teamName}</p>
              <p className="text-xs text-gray-600 mb-3">Chest No: {stats.sargaPrathibha.chestNumber}</p>
              <div className="inline-block border-2 border-black px-4 py-1 text-xl font-bold">
                {stats.sargaPrathibha.offStagePoints} Pts
              </div>
            </div>
          ) : (
            <div className="text-center mt-8 text-gray-400 italic">Pending Results</div>
          )}
        </div>
      </div>

      {/* TOP 15 CANDIDATES TABLE */}
      <div className="mb-10 page-break-inside-avoid">
        <h2 className="text-lg font-black uppercase mb-3 bg-black text-white inline-block px-4 py-1">Top 15 Candidates</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-black p-3 uppercase w-16 text-center">Rank</th>
                <th className="border border-black p-3 uppercase">Chest No</th>
                <th className="border border-black p-3 uppercase">Candidate Name</th>
                <th className="border border-black p-3 uppercase">Team</th>
                <th className="border border-black p-3 uppercase text-center w-32">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {stats.top15.length > 0 ? stats.top15.map((cand, idx) => (
                <tr key={cand.chestNumber} className="hover:bg-gray-50">
                  <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-black p-2 font-mono">{cand.chestNumber}</td>
                  <td className="border border-black p-2 font-bold uppercase">{cand.name}</td>
                  <td className="border border-black p-2 uppercase text-gray-700">{cand.teamName}</td>
                  <td className="border border-black p-2 text-center font-black text-base">{cand.totalPoints}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="border border-black p-4 text-center italic text-gray-500">No candidate data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PERFORMANCE TABLE */}
      <div className="page-break-before-always">
        <h2 className="text-lg font-black uppercase mb-3 bg-black text-white inline-block px-4 py-1">Detailed Performance Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-black p-3 uppercase">Chest No</th>
                <th className="border border-black p-3 uppercase">Candidate Name</th>
                <th className="border border-black p-3 uppercase">Team</th>
                <th className="border border-black p-3 uppercase text-center w-16" title="1st Places">1st</th>
                <th className="border border-black p-3 uppercase text-center w-16" title="2nd Places">2nd</th>
                <th className="border border-black p-3 uppercase text-center w-16" title="3rd Places">3rd</th>
                <th className="border border-black p-3 uppercase text-center w-24">Points</th>
              </tr>
            </thead>
            <tbody>
              {stats.allCandidates.length > 0 ? stats.allCandidates.map((cand) => (
                <tr key={cand.chestNumber} className="hover:bg-gray-50">
                  <td className="border border-black p-2 font-mono">{cand.chestNumber}</td>
                  <td className="border border-black p-2 font-bold uppercase">{cand.name}</td>
                  <td className="border border-black p-2 text-xs uppercase text-gray-700">{cand.teamName}</td>
                  <td className="border border-black p-2 text-center font-bold text-emerald-600">{cand.firsts || '-'}</td>
                  <td className="border border-black p-2 text-center font-bold text-blue-600">{cand.seconds || '-'}</td>
                  <td className="border border-black p-2 text-center font-bold text-amber-600">{cand.thirds || '-'}</td>
                  <td className="border border-black p-2 text-center font-black">{cand.totalPoints}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="border border-black p-4 text-center italic text-gray-500">No performance data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
          .page-break-inside-avoid { break-inside: avoid; }
          .page-break-before-always { break-before: page; }
        }
      `}</style>
    </div>
  );
};
import { describe, it, expect } from 'vitest';
import { rankProgramResults, collectScoreInputs, calculatePoints } from '../pointsCalculator';
import { calculateConsolidatedResults } from '../consolidationCalc';
import { getProgramWinners, winnersByPlace, getProgramZone, getTeamZones } from '../resultsUtils';
import { Program, ProgramStatus, Team } from '../../types';

const p = (name: string, chestNumber: string, extra: object = {}) => ({ name, chestNumber, ...extra });
const team = (id: string, teamName: string, participants: any[], extra: object = {}): Team => ({ id, teamName, participants, ...extra } as Team);
const program = (over: Partial<Program>): Program => ({
  id: 'p1', festId: 'f', name: 'Event', category: 'Senior (Stage)', status: ProgramStatus.COMPLETED,
  teams: [], description: '', participantsCount: 0, isGroup: false, isResultPublished: true, ...over
} as Program);

describe('rankProgramResults (judge submit + admin edit)', () => {
  it('ranks group programs per team, not per member (audit bug 1)', () => {
    const prog = program({
      isGroup: true,
      teams: [
        team('a', 'Red', [p('A1', '1'), p('A2', '2'), p('A3', '3'), p('A4', '4'), p('A5', '5')]),
        team('b', 'Blue', [p('B1', '6'), p('B2', '7'), p('B3', '8'), p('B4', '9'), p('B5', '10')])
      ]
    });
    const teams = rankProgramResults(prog, { '1': { score: 90, grade: 'A+' }, '6': { score: 80, grade: 'A+' } });
    expect(teams[0].rank).toBe(1);
    expect(teams[1].rank).toBe(2); // was 6 before the fix
    expect(teams[0].points).toBe(10 + 10);
    expect(teams[1].points).toBe(10 + 6);
    expect(teams[1].participants.every(m => m.rank === 2)).toBe(true);
  });

  it('does not rank or award points to absent/unscored entries (audit bug 2)', () => {
    const prog = program({ teams: [team('a', 'Red', [p('X', '1'), p('Y', '2'), p('Absent1', '3'), p('Absent2', '4')])] });
    const [t] = rankProgramResults(prog, { '1': { score: 85, grade: 'A+' }, '2': { score: 72, grade: 'A' }, '3': { score: '' }, '4': undefined });
    const byName = Object.fromEntries(t.participants.map(m => [m.name, m]));
    expect(byName.X.rank).toBe(1);
    expect(byName.Y.rank).toBe(2);
    expect(byName.Absent1.rank).toBe(0);
    expect(byName.Absent1.points).toBe(0);
    expect(byName.Absent2.points).toBe(0);
    expect(t.points).toBe((5 + 5) + (5 + 3));
  });

  it('uses competition ranking for ties and gives tied entries equal points', () => {
    const prog = program({ teams: [team('a', 'Red', [p('A', '1'), p('B', '2')]), team('b', 'Blue', [p('C', '3')])] });
    const teams = rankProgramResults(prog, { '1': { score: 80, grade: 'A+' }, '2': { score: 80, grade: 'A+' }, '3': { score: 70, grade: 'A' } });
    const all = teams.flatMap(t => t.participants);
    expect(all.map(m => m.rank)).toEqual([1, 1, 3]);
    expect(all[0].points).toBe(all[1].points);
    expect(all[2].points).toBe(5 + 1);
  });

  it('applies a custom point table', () => {
    const custom = { gradePoints: { 'A+': 7, A: 6, B: 4, C: 2, 'No Grade': 0 }, rankPoints: { 1: 8, 2: 5, 3: 2 } };
    const [t] = rankProgramResults(program({ teams: [team('a', 'Red', [p('A', '1')])] }), { '1': { score: 90, grade: 'A+' } }, custom);
    expect(t.participants[0].points).toBe(15);
  });

  it('splits a group team into sub-teams of membersPerGroup', () => {
    const prog = program({ isGroup: true, membersPerGroup: 2, teams: [team('a', 'Red', [p('A1', '1'), p('A2', '2'), p('A3', '3'), p('A4', '4')]), team('b', 'Blue', [p('B1', '5'), p('B2', '6')])] });
    const teams = rankProgramResults(prog, { '1': { score: 70, grade: 'A' }, '3': { score: 90, grade: 'A+' }, '5': { score: 80, grade: 'A+' } });
    expect(teams[0].participants.map(m => m.rank)).toEqual([3, 3, 1, 1]);
    expect(teams[0].rank).toBe(1); // best sub-team represents the team
    expect(teams[1].rank).toBe(2);
  });

  it('survives programs with no teams / missing participants (RTDB drops empty arrays)', () => {
    expect(rankProgramResults(program({ teams: undefined as any }), {})).toEqual([]);
    expect(rankProgramResults(program({ teams: [{ id: 'a', teamName: 'Red' } as any] }), {})[0].participants).toEqual([]);
  });

  it('collectScoreInputs re-ranks stored results identically', () => {
    const prog = program({ teams: [team('a', 'Red', [p('A', '1'), p('B', '2')])] });
    const first = rankProgramResults(prog, { '1': { score: 60, grade: 'B' }, '2': { score: 75, grade: 'A' } });
    const again = rankProgramResults({ ...prog, teams: first }, collectScoreInputs(first));
    expect(again).toEqual(first);
  });

  it('calculatePoints keeps the documented tables', () => {
    expect(calculatePoints(85, 'A+', false, 1)).toBe(10);
    expect(calculatePoints(85, 'A+', true, 1)).toBe(20);
    expect(calculatePoints(40, 'C', false, 4)).toBe(1);
  });
});

describe('calculateConsolidatedResults', () => {
  const individual = (id: string, category: string, red: any[], published = true) =>
    program({ id, category, isResultPublished: published, teams: [team('r', 'Red', red)] });

  it('counts individual General programs toward the team total but not individual stats (audit bug 3)', () => {
    const res = calculateConsolidatedResults([individual('g', 'General (Stage)', [p('A', '1', { points: 10, rank: 1 })])]);
    expect(res.sortedTeams.find(t => t.name === 'RED')?.score).toBe(10);
    expect(res.allCandidates.find(c => c.chestNumber === '1')?.individualPoints).toBe(0);
  });

  it('counts non-General individual points for team and candidate', () => {
    const res = calculateConsolidatedResults([individual('s', 'Senior (Stage)', [p('A', '1', { points: 8, rank: 1 })])]);
    expect(res.sortedTeams[0].score).toBe(8);
    expect(res.allCandidates[0].individualPoints).toBe(8);
    expect(res.allCandidates[0].firsts).toBe(1);
  });

  it('excludes unpublished results unless asked', () => {
    const progs = [individual('s', 'Senior (Stage)', [p('A', '1', { points: 8 })], false)];
    expect(calculateConsolidatedResults(progs).sortedTeams).toEqual([]);
    expect(calculateConsolidatedResults(progs, true).sortedTeams[0].score).toBe(8);
  });

  it('does not crash on a completed program with no teams (audit bug 6)', () => {
    expect(() => calculateConsolidatedResults([program({ teams: undefined as any })], true)).not.toThrow();
  });

  it('gives tied teams the same position', () => {
    const progs = [program({ isGroup: true, teams: [team('r', 'Red', [], { points: 10 }), team('b', 'Blue', [], { points: 10 }), team('g', 'Green', [], { points: 4 })] })];
    expect(calculateConsolidatedResults(progs).sortedTeams.map(t => t.position)).toEqual([1, 1, 3]);
  });
});

describe('results helpers', () => {
  it('returns every tied winner (audit bug 8)', () => {
    const prog = program({ teams: [team('r', 'Red', [p('A', '1', { rank: 1, points: 10 }), p('B', '2', { rank: 1, points: 10 })]), team('b', 'Blue', [p('C', '3', { rank: 3, points: 6 }), p('D', '4', { rank: 0, points: 0 })])] });
    const places = winnersByPlace(getProgramWinners(prog));
    expect(places[1].map(w => w.name)).toEqual(['A', 'B']);
    expect(places[2]).toEqual([]);
    expect(places[3].map(w => w.name)).toEqual(['C']);
  });

  it('uses the stored program zone, falling back to the category wording', () => {
    expect(getProgramZone({ zone: 'North', category: 'Senior' })).toBe('North');
    expect(getProgramZone({ zone: '', category: 'Kerala Zone' } as any)).toBe('General'); // no longer misread as "A"
    expect(getProgramZone({ category: 'B Zone Stage' } as any)).toBe('B');
  });

  it('assigns each team its own zone (audit bug 9)', () => {
    const zones = getTeamZones([
      program({ id: '1', zone: 'A', teams: [team('r', 'Red', [])] }),
      program({ id: '2', zone: 'B', teams: [team('b', 'Blue', [])] }),
      program({ id: '3', zone: '', category: 'General (Stage)', teams: [team('r', 'Red', []), team('b', 'Blue', [])] })
    ]);
    expect(zones).toEqual({ RED: 'A', BLUE: 'B' });
  });
});

describe('zone standings on the results page', () => {
  it('labels zones by their settings name, and bare letters as "Zone X"', async () => {
    const { zoneLabel } = await import('../resultsUtils');
    expect(zoneLabel('A')).toBe('Zone A');
    expect(zoneLabel('Kerala North')).toBe('Kerala North');
  });

  it('reuses the consolidation rules on one zone\'s programs only', () => {
    const programs = [
      program({ id: 'x', zone: 'Zone 1', teams: [team('a', 'Red', [p('R1', '1', { points: 5 })])] }),
      program({ id: 'y', zone: 'Zone 2', teams: [team('b', 'Blue', [p('B1', '2', { points: 3 })])] })
    ];
    const zone1 = calculateConsolidatedResults(programs.filter(pr => getProgramZone(pr) === 'Zone 1'));
    expect(zone1.sortedTeams).toEqual([{ name: 'RED', score: 5, position: 1 }]);
  });
});

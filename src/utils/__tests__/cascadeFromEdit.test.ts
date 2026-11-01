import { describe, it, expect } from 'vitest';
import { cascadeFromEdit, getStagePrograms, detectBatchClashes, resolveTimeEdit } from '../scheduleCalculator';
import { Program, ProgramStatus } from '../../types';

// All times are written with the IST offset so the tests pass in any machine timezone.
const ist = (hhmm: string, day = '2026-11-05') => new Date(`${day}T${hhmm}:00+05:30`).toISOString();
const hhmm = (iso: string) => new Date(new Date(iso).getTime() + 330 * 60_000).toISOString().slice(11, 16); // IST clock

const prog = (id: string, start: string, duration: number, extra: Partial<Program> = {}): Program => ({
  id, festId: 'f', name: id, category: 'Senior (Stage)', status: ProgramStatus.PENDING, teams: [], description: '',
  participantsCount: 0, isGroup: false, venue: 'Main Stage', duration,
  startTime: ist(start), endTime: new Date(new Date(ist(start)).getTime() + duration * 60_000).toISOString(), ...extra
} as Program);

/** Applies a cascade's updates and returns "id start-end" (IST) for the stage, in order. */
const applied = (programs: Program[], updates: { id: string; updates: Partial<Program> }[]) =>
  programs.map(p => ({ ...p, ...(updates.find(u => u.id === p.id)?.updates || {}) }))
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
    .map(p => `${p.id} ${hhmm(p.startTime!)}-${hhmm(p.endTime!)} ${p.duration}m`);

const edit = (programs: Program[], id: string, newStart: string, mode?: 'keepBreaks' | 'backToBack') => {
  const target = programs.find(p => p.id === id)!;
  const resolved = resolveTimeEdit(target, { start: ist(newStart), end: '', duration: String(target.duration) });
  if ('error' in resolved) throw new Error(resolved.error);
  return cascadeFromEdit({ stagePrograms: programs, editedId: id, editedUpdates: resolved.updates, mode });
};

const fiveProgramDay = () => [
  prog('A', '09:00', 30), prog('B', '09:30', 45), prog('C', '10:15', 30), prog('D', '10:45', 60), prog('E', '11:45', 30)
];

describe('cascadeFromEdit — the requested example', () => {
  it('moving B from 09:30 to 10:00 shifts C, D, E and leaves A alone', () => {
    const programs = fiveProgramDay();
    const result = edit(programs, 'B', '10:00');
    expect(applied(programs, result.updates)).toEqual([
      'A 09:00-09:30 30m',
      'B 10:00-10:45 45m',
      'C 10:45-11:15 30m',
      'D 11:15-12:15 60m',
      'E 12:15-12:45 30m'
    ]);
    expect(result.updates.map(u => u.id)).toEqual(['B', 'C', 'D', 'E']); // A is not written
    expect(result.rows.filter(r => r.changed).map(r => r.id)).toEqual(['B', 'C', 'D', 'E']);
  });

  it('changing the first program shifts every program', () => {
    const programs = fiveProgramDay();
    expect(applied(programs, edit(programs, 'A', '08:30').updates)).toEqual([
      'A 08:30-09:00 30m', 'B 09:00-09:45 45m', 'C 09:45-10:15 30m', 'D 10:15-11:15 60m', 'E 11:15-11:45 30m'
    ]);
  });

  it('changing the last program moves only that program', () => {
    const programs = fiveProgramDay();
    const result = edit(programs, 'E', '13:00');
    expect(result.updates.map(u => u.id)).toEqual(['E']);
    expect(applied(programs, result.updates).at(-1)).toBe('E 13:00-13:30 30m');
  });

  it('moving a program EARLIER pulls the later programs earlier too', () => {
    const programs = fiveProgramDay();
    expect(applied(programs, edit(programs, 'C', '10:00').updates).slice(2)).toEqual([
      'C 10:00-10:30 30m', 'D 10:30-11:30 60m', 'E 11:30-12:00 30m'
    ]);
  });
});

describe('cascadeFromEdit — any position in a 20-program stage', () => {
  const twenty = () => Array.from({ length: 20 }, (_, i) => {
    const minutes = 9 * 60 + i * 30;
    const start = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    return prog(`P${String(i + 1).padStart(2, '0')}`, start, i % 3 === 0 ? 45 : 30);
  });

  it.each([1, 2, 12, 20])('editing program %i keeps earlier programs and cascades the rest', (n) => {
    // Make the input consistent first: lay the 20 programs out back-to-back by their durations.
    const base = twenty();
    const laidOut = applied(base, edit(base, 'P01', '09:00', 'backToBack').updates);
    const programs = base.map((p, i) => {
      const [, times, dur] = laidOut[i].split(' ');
      const [s] = times.split('-');
      return prog(p.id, s, parseInt(dur));
    });

    const id = `P${String(n).padStart(2, '0')}`;
    const original = programs.find(p => p.id === id)!;
    const newStart = hhmm(new Date(new Date(original.startTime!).getTime() + 25 * 60_000).toISOString()); // +25 min
    const result = edit(programs, id, newStart);
    const after = programs.map(p => ({ ...p, ...(result.updates.find(u => u.id === p.id)?.updates || {}) }));

    after.forEach((p, i) => {
      const before = programs[i];
      expect(p.duration).toBe(before.duration);                       // durations preserved
      expect(new Date(p.endTime!).getTime() - new Date(p.startTime!).getTime()).toBe(p.duration! * 60_000);
      if (i < n - 1) expect(p.startTime).toBe(before.startTime);      // earlier programs untouched
      if (i >= n - 1) expect(new Date(p.startTime!).getTime()).toBe(new Date(before.startTime!).getTime() + 25 * 60_000);
      if (i > n - 1) expect(p.startTime).toBe(after[i - 1].endTime); // starts exactly when the previous ends
    });
    expect(result.updates.length).toBe(20 - n + 1);
  });
});

describe('cascadeFromEdit — breaks, stages, status, midnight', () => {
  it('keeps an intentional lunch break by default and can close it on request', () => {
    const programs = [prog('A', '11:00', 60), prog('B', '12:00', 30), prog('C', '13:30', 30), prog('D', '14:00', 30)]; // 12:30-13:30 lunch
    const keep = edit(programs, 'B', '12:15');
    expect(keep.hasBreaks).toBe(true);
    expect(applied(programs, keep.updates).slice(1)).toEqual(['B 12:15-12:45 30m', 'C 13:45-14:15 30m', 'D 14:15-14:45 30m']);
    const closed = edit(programs, 'B', '12:15', 'backToBack');
    expect(applied(programs, closed.updates).slice(1)).toEqual(['B 12:15-12:45 30m', 'C 12:45-13:15 30m', 'D 13:15-13:45 30m']);
  });

  it('never touches programs on other stages', () => {
    const main = fiveProgramDay();
    const other = [prog('X', '09:30', 30, { venue: 'Stage 2' }), prog('Y', '10:00', 30, { venue: 'stage 2' })];
    const stage = getStagePrograms([...main, ...other], 'main stage');
    expect(stage.map(p => p.id)).toEqual(['A', 'B', 'C', 'D', 'E']);
    const result = cascadeFromEdit({ stagePrograms: stage, editedId: 'B', editedUpdates: { startTime: ist('10:00'), endTime: ist('10:45') } });
    expect(result.updates.some(u => u.id === 'X' || u.id === 'Y')).toBe(false);
  });

  it('leaves cancelled programs where they are', () => {
    const programs = [...fiveProgramDay(), prog('Z', '10:20', 15, { status: ProgramStatus.CANCELLED })];
    const result = edit(programs, 'B', '10:00');
    expect(result.updates.some(u => u.id === 'Z')).toBe(false);
    expect(result.rows.some(r => r.id === 'Z')).toBe(false);
  });

  it('handles hour, noon and midnight transitions', () => {
    const programs = [prog('A', '23:00', 30), prog('B', '23:30', 45), prog('C', '00:15', 30)].map((p, i) =>
      i === 2 ? { ...p, startTime: ist('00:15', '2026-11-06'), endTime: ist('00:45', '2026-11-06') } : p);
    const result = edit(programs, 'A', '23:20');
    const b = result.updates.find(u => u.id === 'B')!.updates;
    const c = result.updates.find(u => u.id === 'C')!.updates;
    expect(hhmm(b.startTime!)).toBe('23:50');
    expect(hhmm(b.endTime!)).toBe('00:35');
    expect(new Date(c.startTime!).toISOString()).toBe(ist('00:35', '2026-11-06'));
  });

  it('stores ISO (UTC) timestamps consistently', () => {
    const result = edit(fiveProgramDay(), 'B', '10:00');
    result.updates.forEach(u => {
      expect(u.updates.startTime).toMatch(/Z$/);
      expect(u.updates.endTime).toMatch(/Z$/);
    });
  });

  it('a cascade that pushes into a participant\'s other-stage program is reported as a clash', () => {
    const singer = { name: 'Asha', chestNumber: '101' };
    const programs = [
      prog('A', '09:00', 30), prog('B', '09:30', 30, { teams: [{ id: 't', teamName: 'Red', participants: [singer] }] as any }),
      prog('X', '10:30', 30, { venue: 'Stage 2', teams: [{ id: 't2', teamName: 'Red', participants: [singer] }] as any })
    ];
    const result = edit(programs.filter(p => p.venue === 'Main Stage'), 'B', '10:15');
    const clashes = detectBatchClashes(result.updates, programs);
    expect(clashes.some(c => c.type === 'participant' && c.chestNumber === '101')).toBe(true);
  });

  it('an edit that overlaps the PREVIOUS program on the stage is reported as a stage clash', () => {
    const programs = fiveProgramDay();
    const result = edit(programs, 'B', '09:15'); // A runs until 09:30
    const clashes = detectBatchClashes(result.updates, programs);
    expect(clashes.some(c => c.type === 'venue')).toBe(true);
  });
});

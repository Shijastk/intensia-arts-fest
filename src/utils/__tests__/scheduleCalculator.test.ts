import { describe, it, expect } from 'vitest';
import { Program, ProgramStatus } from '../../types';
import {
  calculateCascadingTimes,
  detectClashes,
  detectBatchClashes,
  getProgramInterval,
  resolveTimeEdit,
  ScheduleUpdate,
} from '../scheduleCalculator';
import { toStoredTime, formatTime, parseScheduleTime, toDateTimeLocalValue } from '../timeUtils';

const at = (h: number, m = 0, day = 5) => new Date(2026, 10, day, h, m, 0, 0);
const iso = (h: number, m = 0, day = 5) => toStoredTime(at(h, m, day));

let seq = 0;
const prog = (over: Partial<Program> & { name: string }): Program => ({
  id: over.id || `p${++seq}`,
  festId: 'fest',
  category: 'General',
  status: ProgramStatus.PENDING,
  teams: [],
  description: '',
  participantsCount: 0,
  isGroup: false,
  duration: 30,
  ...over,
});

const scheduled = (id: string, h: number, m = 0, extra: Partial<Program> = {}, day = 5) =>
  prog({ id, name: id, venue: 'Main Stage', startTime: iso(h, m, day), endTime: iso(h, m + (extra.duration || 30), day), ...extra });

const withTeam = (p: Program, ...chests: string[]): Program => ({
  ...p,
  teams: [{ id: 't', teamName: 'Team', participants: chests.map(c => ({ name: `Student ${c}`, chestNumber: c })) }],
});

/** Apply updates and return id -> "HH:MM AM" start labels. */
const starts = (list: Program[], updates: ScheduleUpdate[]) => {
  const map = new Map(updates.map(u => [u.id, u.updates]));
  return Object.fromEntries(list.map(p => [p.id, formatTime({ ...p, ...map.get(p.id) }.startTime)]));
};

describe('calculateCascadingTimes', () => {
  it('reorder keeps the venue baseline (drag C to top: C 09:00, A 09:30, B 10:00)', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30), C = scheduled('C', 10, 0);
    const updates = calculateCascadingTimes({ before: [A, B, C], after: [C, A, B], movedId: 'C', venue: 'Main Stage' })!;
    expect(starts([A, B, C], updates)).toEqual({ C: '09:00 AM', A: '09:30 AM', B: '10:00 AM' });
  });

  it('same-position drop is a no-op (no writes)', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30);
    expect(calculateCascadingTimes({ before: [A, B], after: [A, B], movedId: 'A', venue: 'Main Stage' })).toEqual([]);
  });

  it('preserves existing gaps (lunch break) and only cascades from the drop index', () => {
    // A 09:00, B 09:30, [lunch], C 13:00, D 13:30. Move D before C.
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30), C = scheduled('C', 13, 0), D = scheduled('D', 13, 30);
    const updates = calculateCascadingTimes({ before: [A, B, C, D], after: [A, B, D, C], movedId: 'D', venue: 'Main Stage' })!;
    expect(updates.map(u => u.id).sort()).toEqual(['C', 'D']); // A and B untouched
    expect(starts([A, B, C, D], updates)).toEqual({ A: '09:00 AM', B: '09:30 AM', D: '01:00 PM', C: '01:30 PM' });
  });

  it('moving a program up past a gap keeps later programs at their own start', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30), C = scheduled('C', 13, 0);
    // Move A to just before C: B takes A's slot, A follows B, C keeps 13:00.
    const updates = calculateCascadingTimes({ before: [A, B, C], after: [B, A, C], movedId: 'A', venue: 'Main Stage' })!;
    expect(starts([A, B, C], updates)).toEqual({ B: '09:00 AM', A: '09:30 AM', C: '01:00 PM' });
    expect(updates.find(u => u.id === 'C')).toBeUndefined();
  });

  it('keeps programs on a later day of a multi-day venue', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30), D2 = scheduled('D2', 9, 0, {}, 6);
    const X = prog({ id: 'X', name: 'X', duration: 30 });
    const updates = calculateCascadingTimes({ before: [A, B, D2], after: [A, X, B, D2], movedId: 'X', venue: 'Main Stage' })!;
    const byId = new Map(updates.map(u => [u.id, u.updates]));
    expect(byId.get('X')!.startTime).toBe(iso(9, 30));
    expect(byId.get('B')!.startTime).toBe(iso(10, 0));
    expect(byId.has('D2')).toBe(false);
  });

  it('inserting from another venue takes the slot of the program it was dropped on', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30);
    const X = prog({ id: 'X', name: 'X', venue: 'Stage 2', startTime: iso(15, 0), endTime: iso(15, 45), duration: 45 });
    const updates = calculateCascadingTimes({ before: [A, B], after: [X, A, B], movedId: 'X', venue: 'Main Stage' })!;
    const x = updates.find(u => u.id === 'X')!.updates;
    expect(x.venue).toBe('Main Stage');
    expect(x.startTime).toBe(iso(9, 0));
    expect(x.endTime).toBe(iso(9, 45));
    expect(starts([A, B, X], updates)).toMatchObject({ A: '09:45 AM', B: '10:15 AM' });
  });

  it('appending to a non-empty venue starts after the last program', () => {
    const A = scheduled('A', 9, 0, { duration: 60, endTime: iso(10, 0) });
    const X = prog({ id: 'X', name: 'X' });
    const updates = calculateCascadingTimes({ before: [A], after: [A, X], movedId: 'X', venue: 'Main Stage' })!;
    expect(updates).toEqual([{ id: 'X', updates: { startTime: iso(10, 0), endTime: iso(10, 30), venue: 'Main Stage' } }]);
  });

  it('empty venue needs a baseline (returns null), then uses it', () => {
    const X = prog({ id: 'X', name: 'X', venue: 'Stage 2', startTime: iso(15, 0) });
    expect(calculateCascadingTimes({ before: [], after: [X], movedId: 'X', venue: 'Stage 3' })).toBeNull();
    const updates = calculateCascadingTimes({ before: [], after: [X], movedId: 'X', venue: 'Stage 3', baseline: at(8, 0) })!;
    expect(updates[0].updates).toEqual({ startTime: iso(8, 0), endTime: iso(8, 30), venue: 'Stage 3' });
  });

  it('reads legacy stored formats and always writes ISO', () => {
    const A = prog({ id: 'A', name: 'A', venue: 'Main Stage', startTime: '2026-11-05T09:00:00.000', endTime: '2026-11-05T09:30:00.000' });
    const B = prog({ id: 'B', name: 'B', venue: 'Main Stage', startTime: '2026-11-05 09:30', endTime: '2026-11-05 10:00' });
    const updates = calculateCascadingTimes({ before: [A, B], after: [B, A], movedId: 'B', venue: 'Main Stage' })!;
    updates.forEach(u => expect(u.updates.startTime).toMatch(/Z$/));
    expect(starts([A, B], updates)).toEqual({ B: '09:00 AM', A: '09:30 AM' });
  });
});

describe('detectClashes', () => {
  it('back-to-back programs on the same venue are not a clash', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30);
    expect(detectClashes(B, B.startTime!, 'Main Stage', [A, B])).toEqual([]);
  });

  it('overlap on the same venue is a clash even without participants', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 15);
    const clashes = detectClashes(B, B.startTime!, 'Main Stage', [A, B]);
    expect(clashes).toHaveLength(1);
    expect(clashes[0]).toMatchObject({ type: 'venue', conflictingProgramName: 'A' });
  });

  it('overlap on different venues without shared participants is fine', () => {
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 15, { venue: 'Stage 2' });
    expect(detectClashes(B, B.startTime!, 'Stage 2', [A, B])).toEqual([]);
  });

  it('cancelled and completed programs are ignored', () => {
    const A = scheduled('A', 9, 0, { status: ProgramStatus.CANCELLED });
    const C = withTeam(scheduled('C', 9, 0, { venue: 'Stage 2', status: ProgramStatus.COMPLETED }), '101');
    const B = withTeam(scheduled('B', 9, 10), '101');
    expect(detectClashes(B, B.startTime!, 'Main Stage', [A, B, C])).toEqual([]);
  });

  it('participant on two stages within the 15-minute switch buffer is a clash', () => {
    const A = withTeam(scheduled('A', 9, 0, { venue: 'Stage 2' }), '101');
    const B = withTeam(scheduled('B', 9, 40), '101');
    const clashes = detectClashes(B, B.startTime!, 'Main Stage', [A, B]);
    expect(clashes).toEqual([expect.objectContaining({ type: 'participant', chestNumber: '101', conflictingProgramName: 'A' })]);
  });

  it('no switch buffer for a participant staying on the same stage back-to-back', () => {
    const A = withTeam(scheduled('A', 9, 0), '101');
    const B = withTeam(scheduled('B', 9, 30), '101');
    expect(detectClashes(B, B.startTime!, 'Main Stage', [A, B])).toEqual([]);
  });

  it('uses the stored endTime for intervals (half-open)', () => {
    const A = scheduled('A', 9, 0, { duration: 30, endTime: iso(10, 0) }); // runs late until 10:00
    expect(getProgramInterval(A)).toEqual({ start: at(9).getTime(), end: at(10).getTime() });
    const B = scheduled('B', 9, 30);
    expect(detectClashes(B, B.startTime!, 'Main Stage', [A, B])).toHaveLength(1);
  });

  it('batch check covers every changed program, not only the dragged one', () => {
    // Moving X to the top pushes B into C's slot on the same venue.
    const A = scheduled('A', 9, 0), B = scheduled('B', 9, 30);
    const C = prog({ id: 'C', name: 'C', venue: 'Main Stage', startTime: iso(10, 15), endTime: iso(10, 45), status: ProgramStatus.PENDING });
    const X = prog({ id: 'X', name: 'X', duration: 30 });
    // Only A and B are part of the reorder list (C sits in the venue but the batch pushes B onto it).
    const updates = calculateCascadingTimes({ before: [A, B], after: [X, A, B], movedId: 'X', venue: 'Main Stage' })!;
    const clashes = detectBatchClashes(updates, [A, B, C, X]);
    expect(clashes.some(c => c.type === 'venue' && [c.programName, c.conflictingProgramName].sort().join() === 'B,C')).toBe(true);
  });
});

describe('resolveTimeEdit', () => {
  const P = scheduled('P', 9, 0); // 09:00-09:30, 30 min
  const input = (start: Date, end: Date, duration: number | string) => ({
    start: toDateTimeLocalValue(start),
    end: toDateTimeLocalValue(end),
    duration: String(duration),
  });

  it('duration change updates endTime', () => {
    const r = resolveTimeEdit(P, input(at(9), at(9, 30), 45));
    expect('updates' in r && r.updates).toEqual({ startTime: iso(9), endTime: iso(9, 45), duration: 45 });
  });

  it('end change updates duration', () => {
    const r = resolveTimeEdit(P, input(at(9), at(10), 30));
    expect('updates' in r && r.updates).toEqual({ startTime: iso(9), endTime: iso(10), duration: 60 });
  });

  it('start change keeps duration and moves the end', () => {
    const r = resolveTimeEdit(P, input(at(11), at(9, 30), 30));
    expect('updates' in r && r.updates).toEqual({ startTime: iso(11), endTime: iso(11, 30), duration: 30 });
  });

  it('rejects end before start', () => {
    const r = resolveTimeEdit(P, input(at(9), at(8), 30));
    expect('error' in r).toBe(true);
  });

  it('rejects invalid durations', () => {
    expect('error' in resolveTimeEdit(P, input(at(9), at(9, 30), 0))).toBe(true);
  });

  it('works for programs stored in the old zone-less format', () => {
    const old = prog({ id: 'O', name: 'O', startTime: '2026-11-05T09:00:00.000', endTime: '2026-11-05T09:30:00.000', duration: 30 });
    const r = resolveTimeEdit(old, input(at(9), at(9, 30), 60));
    expect('updates' in r && parseScheduleTime(r.updates.endTime)!.getTime()).toBe(at(10).getTime());
  });
});

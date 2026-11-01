import { Program, ProgramStatus } from '../types';
import {
  addMinutes,
  compareScheduleTimes,
  getDurationMinutes,
  parseScheduleTime,
  toStoredTime,
} from './timeUtils';

export interface ClashDetail {
  /** 'participant' = same chest number in two overlapping programs; 'venue' = two programs overlap on one stage. */
  type?: 'participant' | 'venue';
  participantName: string;
  chestNumber: string;
  conflictingProgramName: string;
  /** Program that was being scheduled when the clash was found (set by detectBatchClashes). */
  programName?: string;
  venue?: string;
}

export interface ScheduleUpdate {
  id: string;
  updates: Partial<Program>;
}

const PARTICIPANT_SWITCH_BUFFER_MS = 15 * 60_000;

const isInactive = (p: Program) => p.status === ProgramStatus.CANCELLED || p.status === ProgramStatus.COMPLETED;
const sameVenue = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Half-open interval [start, end) in ms. End comes from the stored endTime, else start + duration (default 30). */
export const getProgramInterval = (p: Pick<Program, 'startTime' | 'endTime' | 'duration'>): { start: number; end: number } | null => {
  const start = parseScheduleTime(p.startTime);
  if (!start) return null;
  const end = parseScheduleTime(p.endTime);
  const startMs = start.getTime();
  const endMs = end && end.getTime() > startMs ? end.getTime() : addMinutes(start, getDurationMinutes(p.duration)).getTime();
  return { start: startMs, end: endMs };
};

const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }, bufferMs = 0) =>
  a.start < b.end + bufferMs && b.start < a.end + bufferMs;

/**
 * Clashes for `targetProgram` if it starts at `newStartTimeStr` on `newVenue`.
 * - Venue overlap: another active program on the same venue overlaps [start, end).
 * - Participant clash: a shared chest number in an overlapping active program
 *   (15-min stage-switch buffer only when the venues differ).
 * CANCELLED/COMPLETED programs are ignored on both sides.
 */
export const detectClashes = (
  targetProgram: Program,
  newStartTimeStr: string,
  newVenue: string,
  allPrograms: Program[]
): ClashDetail[] => {
  if (!newStartTimeStr || isInactive(targetProgram)) return [];
  const start = parseScheduleTime(newStartTimeStr);
  if (!start) return [];

  // Use the stored end only when it belongs to this start; otherwise derive it from duration.
  const storedStart = parseScheduleTime(targetProgram.startTime);
  const target =
    storedStart && storedStart.getTime() === start.getTime()
      ? getProgramInterval(targetProgram)!
      : { start: start.getTime(), end: addMinutes(start, getDurationMinutes(targetProgram.duration)).getTime() };

  const targetChestNumbers = new Set<string>();
  targetProgram.teams?.forEach(team => team?.participants?.forEach(p => { if (p?.chestNumber) targetChestNumbers.add(p.chestNumber); }));

  const clashes: ClashDetail[] = [];
  const seen = new Set<string>();
  const push = (c: ClashDetail) => {
    const key = `${c.type}|${c.chestNumber}|${c.conflictingProgramName}`;
    if (!seen.has(key)) { seen.add(key); clashes.push(c); }
  };

  allPrograms.forEach(other => {
    if (other.id === targetProgram.id || isInactive(other)) return;
    const interval = getProgramInterval(other);
    if (!interval) return;
    const onSameVenue = sameVenue(newVenue, other.venue);

    if (onSameVenue && overlaps(target, interval)) {
      push({ type: 'venue', participantName: '', chestNumber: '', conflictingProgramName: other.name, venue: other.venue });
    }

    if (targetChestNumbers.size === 0) return;
    if (!overlaps(target, interval, onSameVenue ? 0 : PARTICIPANT_SWITCH_BUFFER_MS)) return;
    other.teams?.forEach(team => team?.participants?.forEach(p => {
      if (p?.chestNumber && targetChestNumbers.has(p.chestNumber)) {
        push({ type: 'participant', participantName: p.name, chestNumber: p.chestNumber, conflictingProgramName: other.name });
      }
    }));
  });

  return clashes;
};

/** Run detectClashes for every program changed in a batch, against the post-batch state. */
export const detectBatchClashes = (changes: ScheduleUpdate[], allPrograms: Program[]): ClashDetail[] => {
  const changed = new Map(changes.map(c => [c.id, c.updates]));
  const projected = allPrograms.map(p => (changed.has(p.id) ? { ...p, ...changed.get(p.id) } : p));
  const result: ClashDetail[] = [];
  const seen = new Set<string>();

  changes.forEach(({ id }) => {
    const program = projected.find(p => p.id === id);
    if (!program?.startTime) return;
    detectClashes(program, program.startTime, program.venue || '', projected).forEach(c => {
      // A<->B is the same clash as B<->A.
      const pair = [program.name, c.conflictingProgramName].sort().join('|');
      const key = `${c.type}|${c.chestNumber}|${pair}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ ...c, programName: program.name });
    });
  });
  return result;
};

const sortByStart = (list: Program[]) => [...list].sort((a, b) => compareScheduleTimes(a.startTime, b.startTime));

/**
 * 'keepBreaks': each later program keeps the break it had after the previous one (the whole
 *               timetable shifts earlier/later). 'backToBack': later programs start the moment the
 *               previous one ends (breaks are removed).
 */
export type CascadeMode = 'keepBreaks' | 'backToBack';

/** Scheduled programs on one stage (same case-insensitive venue match the clash check uses). */
export const getStagePrograms = (programs: Program[], venue: string): Program[] =>
  programs.filter(p => !!p.startTime && sameVenue(p.venue, venue));

export interface CascadePreviewRow {
  id: string;
  name: string;
  oldStart: string;
  oldEnd: string;
  newStart: string;
  newEnd: string;
  duration: number;
  isEdited: boolean;
  changed: boolean;
}

export interface CascadeResult {
  rows: CascadePreviewRow[];      // every program on the stage, in schedule order
  updates: ScheduleUpdate[];      // only the programs whose times change (edited one always included)
  hasBreaks: boolean;             // true when a later program had a gap before it
}

/**
 * Cascade a start-time edit through the rest of the same stage.
 *
 * Programs before the edited one are untouched; the edited program takes its new start/end;
 * every later program (in the existing order) starts at the previous program's new end
 * (+ its original break in 'keepBreaks' mode) and keeps its own duration. Programs on other
 * stages and CANCELLED programs are never moved.
 */
export const cascadeFromEdit = ({
  stagePrograms,
  editedId,
  editedUpdates,
  mode = 'keepBreaks',
}: {
  stagePrograms: Program[];
  editedId: string;
  editedUpdates: Partial<Program>;
  mode?: CascadeMode;
}): CascadeResult => {
  const ordered = sortByStart(stagePrograms.filter(p => !!p.startTime && p.status !== ProgramStatus.CANCELLED));
  const index = ordered.findIndex(p => p.id === editedId);
  const edited = ordered[index];
  const newEditedStart = parseScheduleTime(editedUpdates.startTime);
  if (index < 0 || !edited || !newEditedStart) return { rows: [], updates: [], hasBreaks: false };

  const editedDuration = getDurationMinutes(editedUpdates.duration ?? edited.duration);
  const newEditedEnd = parseScheduleTime(editedUpdates.endTime) ?? addMinutes(newEditedStart, editedDuration);

  const rows: CascadePreviewRow[] = [];
  const updates: ScheduleUpdate[] = [];
  let hasBreaks = false;
  let prevOldEnd = getProgramInterval(edited)!.end; // original end of the previous program
  let cursor = newEditedEnd.getTime();               // new end of the previous program

  ordered.forEach((p, i) => {
    const old = getProgramInterval(p)!;
    const duration = i === index ? editedDuration : getDurationMinutes(p.duration);
    let start = old.start;
    let end = old.end;

    if (i === index) {
      start = newEditedStart.getTime();
      end = newEditedEnd.getTime();
    } else if (i > index) {
      const gap = Math.max(0, old.start - prevOldEnd);
      if (gap > 0) hasBreaks = true;
      start = cursor + (mode === 'keepBreaks' ? gap : 0);
      end = addMinutes(new Date(start), duration).getTime();
      prevOldEnd = old.end;
      cursor = end;
    }

    const changed = start !== old.start || end !== old.end;
    rows.push({
      id: p.id, name: p.name, duration,
      oldStart: toStoredTime(new Date(old.start)), oldEnd: toStoredTime(new Date(old.end)),
      newStart: toStoredTime(new Date(start)), newEnd: toStoredTime(new Date(end)),
      isEdited: i === index, changed
    });
    if (i === index) {
      updates.push({ id: p.id, updates: { ...editedUpdates, startTime: toStoredTime(new Date(start)), endTime: toStoredTime(new Date(end)), duration } });
    } else if (i > index && changed) {
      // Durations are preserved; only the start/end timestamps move.
      updates.push({ id: p.id, updates: { startTime: toStoredTime(new Date(start)), endTime: toStoredTime(new Date(end)) } });
    }
  });

  return { rows, updates, hasBreaks };
};

/**
 * Recompute times for one venue after a drop.
 *
 * - `before`: programs on the venue before the move (moved program included if it was already there).
 * - `after`:  the new order on the venue (moved program included).
 * Cascades only from the first position whose program changed. The program placed at that
 * position takes the slot's start (the start of whatever was there before; for index 0 that is
 * the venue's earliest start before the move). Later programs start at
 * max(previous end, their own existing start), so gaps (breaks, other days) are preserved.
 *
 * Returns [] when nothing changed, or null when the venue was empty and no `baseline` was given.
 */
export const calculateCascadingTimes = ({
  before,
  after,
  movedId,
  venue,
  baseline,
}: {
  before: Program[];
  after: Program[];
  movedId: string;
  venue: string;
  baseline?: Date;
}): ScheduleUpdate[] | null => {
  const prev = sortByStart(before);
  const sameOrder = prev.length === after.length && prev.every((p, i) => p.id === after[i].id);
  if (sameOrder) return [];

  let fromIndex = 0;
  while (fromIndex < after.length && fromIndex < prev.length && prev[fromIndex].id === after[fromIndex].id) fromIndex++;

  let cursor: number | null = null; // end of the previous program, ms
  if (fromIndex > 0) cursor = getProgramInterval(after[fromIndex - 1])?.end ?? null;

  const slotProgram = prev[fromIndex];
  const slotStart = slotProgram ? getProgramInterval(slotProgram)?.start ?? null : null;

  let firstStart: number | null;
  if (baseline && prev.length === 0) firstStart = baseline.getTime();
  else if (slotStart !== null && cursor !== null) firstStart = Math.max(slotStart, cursor);
  else firstStart = slotStart ?? cursor ?? (baseline ? baseline.getTime() : null);
  if (firstStart === null) return null; // empty venue: caller must ask for a baseline

  const updates: ScheduleUpdate[] = [];
  for (let i = fromIndex; i < after.length; i++) {
    const p = after[i];
    let start: number;
    if (i === fromIndex) start = firstStart;
    else {
      const own = p.id === movedId ? null : getProgramInterval(p)?.start ?? null;
      start = own !== null ? Math.max(cursor!, own) : cursor!;
    }
    const end = addMinutes(new Date(start), getDurationMinutes(p.duration)).getTime();
    cursor = end;

    const current = getProgramInterval(p);
    const unchanged = p.id !== movedId && sameVenue(p.venue, venue) && current?.start === start && parseScheduleTime(p.endTime)?.getTime() === end;
    if (unchanged) continue;
    updates.push({ id: p.id, updates: { startTime: toStoredTime(new Date(start)), endTime: toStoredTime(new Date(end)), venue } });
  }
  return updates;
};

export type TimeEditResult = { updates: Partial<Program> } | { error: string };

/**
 * Resolve the Edit Time modal inputs (datetime-local strings + minutes) into consistent updates.
 * - duration changed           -> endTime = start + duration
 * - only end changed           -> duration = end - start
 * - only start changed         -> endTime = start + duration (duration kept)
 * End must be after start.
 */
export const resolveTimeEdit = (
  program: Pick<Program, 'startTime' | 'endTime' | 'duration'>,
  input: { start: string; end: string; duration: string }
): TimeEditResult => {
  const start = parseScheduleTime(input.start);
  const end = parseScheduleTime(input.end);
  const oldDuration = getDurationMinutes(program.duration);
  const parsedDuration = input.duration ? parseInt(input.duration, 10) : oldDuration;
  if (!Number.isFinite(parsedDuration) || parsedDuration < 1) return { error: 'Duration must be at least 1 minute.' };
  if (!start) return { error: 'Please choose a start time.' };

  const oldStart = parseScheduleTime(program.startTime);
  const oldEnd = parseScheduleTime(program.endTime);
  const minute = (d: Date | null) => (d ? Math.floor(d.getTime() / 60_000) : null);
  const durationChanged = parsedDuration !== oldDuration;
  const startChanged = minute(start) !== minute(oldStart);
  const endChanged = !!end && minute(end) !== minute(oldEnd);

  let duration = parsedDuration;
  let finalEnd: Date;
  if (durationChanged || !end) finalEnd = addMinutes(start, duration);
  else if (endChanged) {
    finalEnd = end;
    duration = Math.round((end.getTime() - start.getTime()) / 60_000);
  } else if (startChanged) finalEnd = addMinutes(start, duration);
  else finalEnd = end;

  if (finalEnd.getTime() <= start.getTime()) return { error: 'End time must be after the start time.' };

  return { updates: { startTime: toStoredTime(start), endTime: toStoredTime(finalEnd), duration } };
};

import { describe, it, expect } from 'vitest';
import { Program, ProgramStatus } from '../../types';
import type { BackgroundSettings } from '../backgroundService';
import {
  DEFAULT_CERT_BODY_TEMPLATE,
  LEGACY_CERT_DATES,
  LEGACY_CERT_VENUE,
  TEMPLATE_DEFAULTS,
  aggregateParticipants,
  aspectRatioWarning,
  autoFitBlockFontSize,
  autoFitFontSize,
  buildCertificateData,
  cleanFestName,
  computeBackgroundBox,
  fillPlaceholders,
  mergeTemplateConfig,
  parseRichText,
  pickTemplate,
  stripRichMarkers,
  toPosterWinners,
  validateUploadFile,
} from '../exportService';
import { getProgramWinners } from '../../utils/resultsUtils';

const prog = (over: Partial<Program>): Program => ({
  id: 'p', festId: 'f', name: 'P', category: 'General', status: ProgramStatus.COMPLETED,
  teams: [], description: '', participantsCount: 0, isGroup: false, ...over,
});

describe('pickTemplate', () => {
  const bgs: BackgroundSettings = {
    certificateBgs: { '1000': 'old.png', '3000': 'newest.png', '2000': 'mid.png' },
    configs: { '2000': { bgScale: 120, configVersion: 2, contentTop: 300 }, blank: { bgPositionX: 10 } },
  };

  it('uses the active background when it exists', () => {
    const t = pickTemplate({ ...bgs, active: { certificateBgs: '2000' } }, 'certificateBgs');
    expect(t.id).toBe('2000');
    expect(t.url).toBe('mid.png');
    expect(t.config.bgScale).toBe(120);
    expect(t.config.contentTop).toBe(300);
  });

  it('falls back to the most recently added when active is missing or stale', () => {
    expect(pickTemplate(bgs, 'certificateBgs').id).toBe('3000');
    expect(pickTemplate({ ...bgs, active: { certificateBgs: 'deleted' } }, 'certificateBgs').id).toBe('3000');
  });

  it('falls back to blank with the blank config when nothing is uploaded', () => {
    const t = pickTemplate(bgs, 'posterBgs');
    expect(t).toMatchObject({ id: 'blank', url: '' });
    expect(t.config.contentTop).toBe(350);
    expect(pickTemplate(null, 'certificateBgs').id).toBe('blank');
    expect(pickTemplate(bgs, 'studentCardBgs').config.cardsPerPage).toBe(9);
  });

  it('reads legacy single-image fields', () => {
    const t = pickTemplate({ certificateBg: 'legacy.png' }, 'certificateBgs');
    expect(t).toMatchObject({ id: 'legacy', url: 'legacy.png' });
  });

  it('prefers numeric (timestamp) ids over legacy ids', () => {
    expect(pickTemplate({ certificateBgs: { legacy: 'a', '5': 'b' } }, 'certificateBgs').id).toBe('5');
  });
});

describe('mergeTemplateConfig', () => {
  it('old poster config without new fields yields today\'s defaults for them', () => {
    const c = mergeTemplateConfig('posterBgs', { contentTop: 400, textColor: '#fff' });
    expect(c.contentTop).toBe(400);
    expect(c.textColor).toBe('#fff');
    expect(c.titleFontSize).toBe(48);
    expect(c.bodyFontSize).toBe(30);
    expect(c.fontWeight).toBe(900);
    expect(c.fontFamily).toBe('Playfair Display');
    expect(c.bgScale).toBe(100);
    expect(c.posterSize).toBe('portrait');
  });

  it('old certificate config keeps only background fields (layout fields were never used)', () => {
    // What the old editor saved for a certificate: the poster defaults + background position.
    const old = { contentTop: 350, contentLeft: 96, textAlign: 'left' as const, textColor: '#000000', secondaryColor: '#ca8a04', bgPositionX: 20, bgPositionY: 70, bgScale: 100 };
    const c = mergeTemplateConfig('certificateBgs', old);
    expect(c).toMatchObject({ contentTop: 200, contentLeft: 0, textAlign: 'center', secondaryColor: '#dc2626', bgPositionX: 20, bgPositionY: 70 });
    expect(c.textColor).toBeUndefined();
    expect(c.bodyTemplate).toBe(DEFAULT_CERT_BODY_TEMPLATE);
    expect(c.festVenue).toBe(LEGACY_CERT_VENUE);
    expect(c.festDates).toBe(LEGACY_CERT_DATES);
  });

  it('new certificate config (configVersion 2) is honoured', () => {
    const c = mergeTemplateConfig('certificateBgs', { configVersion: 2, contentTop: 500, textColor: '#111111' });
    expect(c.contentTop).toBe(500);
    expect(c.textColor).toBe('#111111');
    expect(c.titleFontSize).toBe(48);
  });

  it('ignores null/undefined values and missing config', () => {
    expect(mergeTemplateConfig('posterBgs', { contentTop: undefined, textAlign: null as any })).toEqual(TEMPLATE_DEFAULTS.posterBgs);
    expect(mergeTemplateConfig('studentCardBgs', undefined)).toEqual(TEMPLATE_DEFAULTS.studentCardBgs);
  });
});

describe('placeholders', () => {
  const all = { name: 'Asha', chestNo: '101', team: 'Red', events: 'Painting, Drawing', category: 'Junior', festName: 'ARTS FEST', position: '1st Place', grade: 'A', date: '1 Jan', venue: 'Hall' };

  it('fills every placeholder', () => {
    const tpl = '{name}|{chestNo}|{team}|{events}|{category}|{festName}|{position}|{grade}|{date}|{venue}';
    expect(fillPlaceholders(tpl, all)).toBe('Asha|101|Red|Painting, Drawing|Junior|ARTS FEST|1st Place|A|1 Jan|Hall');
  });

  it('missing values become empty, unknown tokens stay', () => {
    expect(fillPlaceholders('{name} got {position} {unknown}', { name: 'Asha' })).toBe('Asha got  {unknown}');
  });

  it('default template reproduces the old sentence', () => {
    const text = stripRichMarkers(fillPlaceholders(DEFAULT_CERT_BODY_TEMPLATE, { ...all, venue: LEGACY_CERT_VENUE, date: LEGACY_CERT_DATES }));
    expect(text).toBe('has participated in Painting, Drawing\nat ARTS FEST — Celebration of Creativity, held at Ismath Campus, Ismath English School Kalad, on 11, 12 & 13 August 2026.');
  });

  it('parses bold / strong markers and line breaks', () => {
    const lines = parseRichText('a **b** c\n##d## e');
    expect(lines).toEqual([
      [{ text: 'a ' }, { text: 'b', bold: true }, { text: ' c' }],
      [{ text: 'd', bold: true, strong: true }, { text: ' e' }],
    ]);
  });

  it('handles long text without truncating it', () => {
    const events = Array.from({ length: 40 }, (_, i) => `Event ${i}`).join(', ');
    const out = fillPlaceholders('in **{events}**', { events });
    expect(out).toContain('Event 39');
    expect(parseRichText(out)[0][1].text).toBe(events);
  });
});

describe('auto-fit', () => {
  it('keeps the base size for short names and shrinks long ones down to a minimum', () => {
    expect(autoFitFontSize('JOHN DOE', 48, { charsPerLineAtBase: 22 })).toBe(48);
    expect(autoFitFontSize('A'.repeat(22), 48, { charsPerLineAtBase: 22 })).toBe(48);
    expect(autoFitFontSize('A'.repeat(33), 48, { charsPerLineAtBase: 22 })).toBe(32);
    expect(autoFitFontSize('A'.repeat(200), 48, { charsPerLineAtBase: 22, minSize: 26 })).toBe(26);
  });

  it('is monotonic in text length', () => {
    let prev = Infinity;
    for (let n = 1; n < 120; n += 7) {
      const s = autoFitFontSize('X'.repeat(n), 48, { charsPerLineAtBase: 22 });
      expect(s).toBeLessThanOrEqual(prev);
      prev = s;
    }
  });

  it('shrinks body blocks that exceed capacity', () => {
    expect(autoFitBlockFontSize('x'.repeat(100), 18, 500)).toBe(18);
    expect(autoFitBlockFontSize('x'.repeat(2000), 18, 500)).toBe(10);
    expect(autoFitBlockFontSize('x'.repeat(1000), 18, 500)).toBeCloseTo(12.7, 1);
  });
});

describe('participant aggregation', () => {
  const programs: Program[] = [
    prog({ id: 'a', name: 'Painting', category: 'Junior', isResultPublished: true, teams: [
      { id: 't1', teamName: 'Red', participants: [{ name: 'Asha', chestNumber: '101', rank: 1, grade: 'A' }, { name: 'Ben', chestNumber: '102', rank: 1, grade: 'A' }] },
    ] }),
    prog({ id: 'b', name: 'Dance', category: 'Senior', isGroup: true, isResultPublished: false, teams: [
      { id: 't2', teamName: 'Red', rank: 2, grade: 'B', participants: [{ name: 'Asha', chestNumber: '101' }] },
    ] }),
    prog({ id: 'c', name: 'Cancelled Show', status: ProgramStatus.CANCELLED, teams: [
      { id: 't3', teamName: 'Red', participants: [{ name: 'Asha', chestNumber: '101' }, { name: 'Cara', chestNumber: '103' }] },
    ] }),
    prog({ id: 'd', name: 'Essay', category: 'Junior', status: ProgramStatus.PENDING, teams: [
      { id: 't4', teamName: 'Blue', participants: [{ name: 'Dev', chestNumber: '104' }, { name: 'Asha', chestNumber: '101' }] },
    ] }),
  ];

  it('excludes cancelled programs and participants only in cancelled programs', () => {
    const all = aggregateParticipants(programs);
    expect(all.map(p => p.chestNumber)).toEqual(['101', '102', '104']);
    expect(all.find(p => p.chestNumber === '101')!.programs.map(e => e.name)).toEqual(['Painting', 'Dance', 'Essay']);
  });

  it('builds certificate data with real categories and performed events only', () => {
    const asha = aggregateParticipants(programs).find(p => p.chestNumber === '101')!;
    const d = buildCertificateData(asha, 'ARTS FEST');
    expect(d.events).toEqual(['Painting', 'Dance']);
    expect(d.category).toBe('Junior / Senior');
    // Only published results contribute position/grade.
    expect(d.position).toBe('1st Place in Painting');
    expect(d.grade).toBe('A in Painting');
  });

  it('falls back to pending programs when nothing has been performed yet', () => {
    const dev = aggregateParticipants(programs).find(p => p.chestNumber === '104')!;
    expect(buildCertificateData(dev, 'X').events).toEqual(['Essay']);
  });

  it('program-level export uses that program only, ties keep the same position', () => {
    const list = aggregateParticipants([programs[0]]).map(p => buildCertificateData(p, 'X', 'a'));
    expect(list.map(d => [d.participantName, d.position, d.category, d.events.join()])).toEqual([
      ['Asha', '1st Place', 'Junior', 'Painting'],
      ['Ben', '1st Place', 'Junior', 'Painting'],
    ]);
  });

  it('group programs take rank/grade from the team', () => {
    const asha = aggregateParticipants(programs).find(p => p.chestNumber === '101')!;
    expect(asha.programs.find(e => e.programId === 'b')).toMatchObject({ rank: 2, grade: 'B' });
  });

  it('cleans the fest id into a display name', () => {
    expect(cleanFestName('kerala-arts-fest-2026')).toBe('KERALA ARTS FEST');
    expect(cleanFestName('single')).toBe('SINGLE');
    expect(cleanFestName(undefined)).toBe('ARTS FEST');
  });
});

describe('poster winners', () => {
  it('keeps every tied winner with unique keys and does not mutate input', () => {
    const p = prog({ teams: [
      { id: 't1', teamName: 'Red', participants: [{ name: 'A', chestNumber: '1', rank: 1 }, { name: 'B', chestNumber: '2', rank: 1 }, { name: 'C', chestNumber: '3', rank: 3 }, { name: 'D', chestNumber: '4', rank: 3 }] },
    ] });
    const raw = getProgramWinners(p);
    const copy = JSON.parse(JSON.stringify(raw));
    const w = toPosterWinners(raw, false);
    expect(w.map(x => x.place)).toEqual([1, 1, 3, 3]);
    expect(new Set(w.map(x => x.id)).size).toBe(4);
    expect(w[0].team).toBe('Red');
    expect(raw).toEqual(copy);
  });

  it('group winners have no team line', () => {
    expect(toPosterWinners([{ name: 'Red', teamName: 'Red', rank: 2 }], true)[0]).toMatchObject({ place: 2, name: 'Red', team: '' });
  });
});

describe('background box', () => {
  it('100% is plain cover at the drag position', () => {
    expect(computeBackgroundBox(100, 30, 70)).toEqual({ width: 100, height: 100, left: 0, top: 0, objectPosition: '30% 70%' });
  });
  it('scales around the drag position and clamps the range', () => {
    expect(computeBackgroundBox(200, 50, 0)).toMatchObject({ width: 200, left: -50, top: 0 });
    expect(computeBackgroundBox(50, 100, 100)).toMatchObject({ width: 50, left: 50, top: 50 });
    expect(computeBackgroundBox(999, 50, 50).width).toBe(200);
  });
});

describe('upload validation', () => {
  it('accepts png/jpeg/webp up to 7 MB', () => {
    expect(validateUploadFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateUploadFile({ type: 'image/webp', size: 7 * 1024 * 1024 })).toBeNull();
    expect(validateUploadFile({ type: 'image/gif', size: 10 })).toMatch(/PNG, JPEG or WebP/);
    expect(validateUploadFile({ type: 'image/jpeg', size: 8 * 1024 * 1024 })).toMatch(/7 MB/);
  });
  it('warns when the aspect ratio is far from the template', () => {
    expect(aspectRatioWarning('certificateBgs', 794, 1123)).toBeNull();
    expect(aspectRatioWarning('certificateBgs', 1123, 794)).toMatch(/A4/);
    expect(aspectRatioWarning('posterBgs', 1080, 1080)).toBeNull();
    expect(aspectRatioWarning('posterBgs', 1920, 1080)).toMatch(/portrait/);
  });
});

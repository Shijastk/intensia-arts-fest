// Shared logic for certificate / poster / student-card exports.
//
// The top half is DOM-free (unit-tested in src/services/__tests__): template selection,
// config defaults, placeholder filling, auto-fit sizing, participant aggregation and upload
// validation. The bottom half holds the browser-only render helpers (toDataUrl, ensureFonts,
// renderNodeToJpeg, renderToPdf). React rendering of the templates lives in
// src/components/generators/OffscreenRenderer.tsx so this file stays importable from tests.

import { toJpeg, getFontEmbedCSS } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Program, ProgramStatus } from '../types';
import type { BackgroundSettings, BackgroundType, TemplateConfig } from './backgroundService';

// ---------------------------------------------------------------------------
// Sizes / render settings
// ---------------------------------------------------------------------------

export const A4_PX = { width: 794, height: 1123 } as const;
export const POSTER_PX = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
} as const;

/** One setting for every export so the output looks the same wherever it is generated. */
export const RENDER_OPTIONS = { pixelRatio: 2, quality: 0.92 } as const;

export const getTemplateSize = (type: BackgroundType, config?: TemplateConfig) => {
  if (type === 'posterBgs') return config?.posterSize === 'square' ? POSTER_PX.square : POSTER_PX.portrait;
  return A4_PX;
};

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

/** Fonts loaded by index.html / style.css. `stack` is the CSS font-family value. */
export const FONT_OPTIONS: { family: string; stack: string; weights: number[] }[] = [
  { family: 'Playfair Display', stack: '"Playfair Display", serif', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Bricolage Grotesque', stack: '"Bricolage Grotesque", "Bricolage Grotesque Fallback", sans-serif', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Inter', stack: '"Inter", sans-serif', weights: [400, 500, 600] },
  { family: 'Poppins', stack: '"Poppins", sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Montserrat', stack: '"Montserrat", sans-serif', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Lora', stack: '"Lora", serif', weights: [400, 500, 600, 700] },
  { family: 'Great Vibes', stack: '"Great Vibes", cursive', weights: [400] },
];

export const fontStack = (family?: string): string => {
  const known = FONT_OPTIONS.find(f => f.family === family);
  if (known) return known.stack;
  return family ? `"${family}", sans-serif` : FONT_OPTIONS[1].stack;
};

// ---------------------------------------------------------------------------
// Template config defaults
// ---------------------------------------------------------------------------

export const LEGACY_CERT_VENUE = 'Ismath Campus, Ismath English School Kalad';
export const LEGACY_CERT_DATES = '11, 12 & 13 August 2026';
/** Reproduces the sentence that used to be hard-coded in CertificateTemplate. */
export const DEFAULT_CERT_BODY_TEMPLATE =
  'has participated in **{events}**\nat ##{festName} — Celebration of Creativity##, held at {venue}, on {date}.';

export const CURRENT_CONFIG_VERSION = 2;

const BG_DEFAULTS = { bgPositionX: 50, bgPositionY: 50, bgScale: 100 };

/**
 * Defaults per template type. Values match what the templates rendered before the fields
 * existed, so an old config (or none) produces the same output as before.
 * Certificate textColor is deliberately absent: when unset the template keeps its original
 * per-line greys/black; once the user picks a colour it applies to every body line.
 */
export const TEMPLATE_DEFAULTS: Record<BackgroundType, TemplateConfig> = {
  certificateBgs: {
    ...BG_DEFAULTS,
    contentTop: 200,
    contentLeft: 0,
    textAlign: 'center',
    secondaryColor: '#dc2626',
    fontFamily: 'Playfair Display',
    bodyFontFamily: 'Bricolage Grotesque',
    titleFontSize: 48,
    bodyFontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.05,
    lineHeight: 1.625,
    bodyTemplate: DEFAULT_CERT_BODY_TEMPLATE,
    festVenue: LEGACY_CERT_VENUE,
    festDates: LEGACY_CERT_DATES,
  },
  posterBgs: {
    ...BG_DEFAULTS,
    contentTop: 350,
    contentLeft: 96,
    textAlign: 'left',
    textColor: '#000000',
    secondaryColor: '#ca8a04',
    posterSize: 'portrait',
    fontFamily: 'Playfair Display',
    bodyFontFamily: 'Bricolage Grotesque',
    titleFontSize: 48,
    bodyFontSize: 30,
    fontWeight: 900,
    letterSpacing: 0.05,
    lineHeight: 1.25,
  },
  studentCardBgs: {
    ...BG_DEFAULTS,
    layout: 'detailed',
    cardsPerPage: 9,
  },
};

const BG_FIELDS: (keyof TemplateConfig)[] = ['bgPositionX', 'bgPositionY', 'bgScale'];

const stripEmpty = (config?: TemplateConfig | null): TemplateConfig => {
  const out: Record<string, unknown> = {};
  if (!config) return out;
  Object.entries(config).forEach(([k, v]) => {
    if (v !== undefined && v !== null && !(typeof v === 'number' && Number.isNaN(v))) out[k] = v;
  });
  return out as TemplateConfig;
};

/**
 * Saved config merged over the type defaults. Old certificate configs (no configVersion) were
 * written by an editor that saved the *poster* defaults (contentTop 350, left aligned, gold...)
 * which the certificate never used; only their background fields are honoured so existing
 * certificates keep their look.
 */
export const mergeTemplateConfig = (type: BackgroundType, config?: TemplateConfig | null): TemplateConfig => {
  const saved = stripEmpty(config);
  if (type === 'certificateBgs' && !saved.configVersion) {
    const bgOnly: TemplateConfig = {};
    BG_FIELDS.forEach(k => { if (saved[k] !== undefined) (bgOnly as any)[k] = saved[k]; });
    return { ...TEMPLATE_DEFAULTS[type], ...bgOnly };
  }
  return { ...TEMPLATE_DEFAULTS[type], ...saved };
};

// ---------------------------------------------------------------------------
// Background selection
// ---------------------------------------------------------------------------

export interface PickedTemplate {
  /** Background id, or 'blank' when no background is uploaded. */
  id: string;
  /** Background URL ('' for blank). */
  url: string;
  config: TemplateConfig;
}

/** Folds the legacy single-image fields into the per-type maps. */
export const getBackgroundMap = (backgrounds: BackgroundSettings | null | undefined, type: BackgroundType): Record<string, string> => {
  if (!backgrounds) return {};
  const map = { ...(backgrounds[type] || {}) };
  if (Object.keys(map).length === 0) {
    if (type === 'certificateBgs' && backgrounds.certificateBg) map.legacy = backgrounds.certificateBg;
    if (type === 'studentCardBgs' && backgrounds.studentCardBg) map.legacy = backgrounds.studentCardBg;
  }
  Object.keys(map).forEach(k => { if (!map[k]) delete map[k]; });
  return map;
};

/** Ids are Date.now() strings; the largest is the newest. Non-numeric ids ('legacy') rank oldest. */
export const mostRecentBackgroundId = (map: Record<string, string>): string | undefined => {
  const ids = Object.keys(map);
  if (ids.length === 0) return undefined;
  let best = ids[0];
  let bestNum = Number(best);
  ids.forEach(id => {
    const n = Number(id);
    const nOk = Number.isFinite(n);
    const bOk = Number.isFinite(bestNum);
    if ((nOk && (!bOk || n > bestNum))) { best = id; bestNum = n; }
  });
  return best;
};

/**
 * The background + merged config every export uses: the one marked "Use for exports" →
 * the most recently added → blank (configs.blank).
 */
export const pickTemplate = (backgrounds: BackgroundSettings | null | undefined, type: BackgroundType): PickedTemplate => {
  const map = getBackgroundMap(backgrounds, type);
  const activeId = backgrounds?.active?.[type];
  const id = activeId && map[activeId] ? activeId : mostRecentBackgroundId(map);
  if (id) return { id, url: map[id], config: mergeTemplateConfig(type, backgrounds?.configs?.[id]) };
  return { id: 'blank', url: '', config: mergeTemplateConfig(type, backgrounds?.configs?.blank) };
};

// ---------------------------------------------------------------------------
// Fest name / placeholders / rich text
// ---------------------------------------------------------------------------

/** "kerala-arts-fest-2026" → "KERALA ARTS FEST" (drops the trailing suffix). */
export const cleanFestName = (festId?: string | null): string => {
  const raw = festId || 'Arts Fest';
  const parts = raw.split('-');
  return (parts.length > 1 ? parts.slice(0, -1).join(' ') : raw).toUpperCase();
};

export type PlaceholderKey =
  | 'name' | 'chestNo' | 'team' | 'events' | 'category' | 'festName' | 'position' | 'grade' | 'date' | 'venue';

export const PLACEHOLDER_KEYS: PlaceholderKey[] = ['name', 'chestNo', 'team', 'events', 'category', 'festName', 'position', 'grade', 'date', 'venue'];

/** Replaces known {placeholders}; missing values become ''. Unknown {tokens} are left untouched. */
export const fillPlaceholders = (template: string, values: Partial<Record<PlaceholderKey, string | null | undefined>>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(PLACEHOLDER_KEYS as string[]).includes(key)) return match;
    const v = values[key as PlaceholderKey];
    return v == null ? '' : String(v);
  });

export interface RichSegment { text: string; bold?: boolean; strong?: boolean }

/**
 * Splits text into lines (\n) of segments. `**x**` = bold, `##x##` = bold in the strong colour.
 */
export const parseRichText = (text: string): RichSegment[][] =>
  text.split('\n').map(line => {
    const segments: RichSegment[] = [];
    const re = /\*\*([\s\S]*?)\*\*|##([\s\S]*?)##/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) segments.push({ text: line.slice(last, m.index) });
      if (m[1] !== undefined) segments.push({ text: m[1], bold: true });
      else segments.push({ text: m[2], bold: true, strong: true });
      last = m.index + m[0].length;
    }
    if (last < line.length) segments.push({ text: line.slice(last) });
    return segments;
  });

export const stripRichMarkers = (text: string) => text.replace(/\*\*|##/g, '');

export const ordinal = (n: number): string => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th';
  return `${n}${s}`;
};

// ---------------------------------------------------------------------------
// Auto-fit
// ---------------------------------------------------------------------------

/**
 * Font size for a heading: full size up to `charsPerLineAtBase` characters, then shrinks in
 * proportion to the length so it stays on one line, never below `minSize`. Text that still
 * does not fit at minSize wraps (the template allows wrapping and clamps the line count).
 */
export const autoFitFontSize = (
  text: string,
  baseSize: number,
  opts: { charsPerLineAtBase: number; minSize?: number }
): number => {
  const len = (text || "").trim().length;
  const { charsPerLineAtBase, minSize = Math.round(baseSize * 0.55) } = opts;
  if (len <= charsPerLineAtBase) return baseSize;
  return Math.max(minSize, Math.floor((baseSize * charsPerLineAtBase) / len));
};

/**
 * Font size for a paragraph block: full size while the text fits `capacityChars` characters,
 * then shrinks by the square root of the overflow (area scales with size²) down to minSize.
 */
export const autoFitBlockFontSize = (text: string, baseSize: number, capacityChars: number, minSize = 10): number => {
  const len = (text || '').length;
  if (len <= capacityChars) return baseSize;
  return Math.max(minSize, Math.floor(baseSize * Math.sqrt(capacityChars / len) * 10) / 10);
};

// ---------------------------------------------------------------------------
// Participant aggregation / certificate data
// ---------------------------------------------------------------------------

export interface ParticipantProgramEntry {
  programId: string;
  name: string;
  category: string;
  status: ProgramStatus;
  isResultPublished: boolean;
  rank?: number;
  grade?: string;
}

export interface AggregatedParticipant {
  name: string;
  chestNumber: string;
  teamName: string;
  programs: ParticipantProgramEntry[];
}

/**
 * Every participant across programs, keyed by chest number (first-seen name/team win).
 * Cancelled programs are excluded. Rank/grade come from the participant, else their team
 * (group programs).
 */
export const aggregateParticipants = (programs: Program[]): AggregatedParticipant[] => {
  const map = new Map<string, AggregatedParticipant>();
  (programs || []).forEach(prog => {
    if (prog.status === ProgramStatus.CANCELLED) return;
    (prog.teams || []).forEach(team => (team.participants || []).forEach(p => {
      if (!p?.chestNumber) return;
      if (!map.has(p.chestNumber)) map.set(p.chestNumber, { name: p.name, chestNumber: p.chestNumber, teamName: team.teamName, programs: [] });
      const entry = map.get(p.chestNumber)!;
      if (entry.programs.some(e => e.programId === prog.id)) return;
      entry.programs.push({
        programId: prog.id,
        name: prog.name,
        category: prog.category || '',
        status: prog.status,
        isResultPublished: !!prog.isResultPublished,
        rank: p.rank || team.rank || undefined,
        grade: p.grade || team.grade || undefined,
      });
    }));
  });
  return Array.from(map.values()).sort((a, b) => a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true }));
};

/** Legacy ParticipantSummary shape used by ProgramList. */
export const toParticipantSummary = (p: AggregatedParticipant) => ({
  name: p.name,
  chestNumber: p.chestNumber,
  teamName: p.teamName,
  programCount: p.programs.length,
  programNames: p.programs.map(e => e.name),
  achievements: p.programs.filter(e => e.rank).map(e => ({ programName: e.name, rank: e.rank! })),
  totalWins: p.programs.filter(e => e.rank === 1).length,
});

const unique = (xs: string[]) => Array.from(new Set(xs.filter(Boolean)));

export interface CertificateData {
  participantName: string;
  chestNo: string;
  team: string;
  category: string;
  events: string[];
  festName: string;
  position?: string;
  grade?: string;
}

/**
 * Certificate data for one participant.
 * - `programId` given (program-level export): that program only.
 * - otherwise: programs the participant performed in (judging/completed); if none yet, all
 *   non-cancelled ones so certificates can still be printed before the fest.
 * position/grade are only filled from programs whose result is published.
 */
export const buildCertificateData = (p: AggregatedParticipant, festName: string, programId?: string): CertificateData => {
  let entries = p.programs;
  if (programId) entries = entries.filter(e => e.programId === programId);
  else {
    const performed = entries.filter(e => e.status === ProgramStatus.COMPLETED || e.status === ProgramStatus.JUDGING);
    if (performed.length > 0) entries = performed;
  }
  const published = entries.filter(e => e.isResultPublished);
  const single = entries.length === 1;
  const position = published.filter(e => e.rank && e.rank >= 1 && e.rank <= 3)
    .map(e => single ? `${ordinal(e.rank!)} Place` : `${ordinal(e.rank!)} Place in ${e.name}`).join(', ');
  const grade = published.filter(e => e.grade)
    .map(e => single ? e.grade! : `${e.grade} in ${e.name}`).join(', ');
  return {
    participantName: p.name,
    chestNo: p.chestNumber,
    team: p.teamName,
    category: unique(entries.map(e => e.category)).join(' / '),
    events: entries.map(e => e.name),
    festName,
    position: position || undefined,
    grade: grade || undefined,
  };
};

// ---------------------------------------------------------------------------
// Poster winners
// ---------------------------------------------------------------------------

export interface PosterWinner {
  /** Stable unique key (ties share a place). */
  id: string;
  place: 1 | 2 | 3;
  name: string;
  team: string;
}

/** Maps resultsUtils.getProgramWinners output to poster rows, keeping every tied winner. */
export const toPosterWinners = (
  winners: { name: string; teamName?: string; rank: number; chestNumber?: string }[],
  isGroup: boolean
): PosterWinner[] =>
  winners
    .filter(w => w.rank >= 1 && w.rank <= 3)
    .map((w, i) => ({ w, i }))
    .sort((a, b) => a.w.rank - b.w.rank || a.i - b.i)
    .map(({ w, i }) => ({
      id: `${w.rank}-${w.chestNumber || w.name}-${i}`,
      place: w.rank as 1 | 2 | 3,
      name: w.name,
      team: isGroup ? '' : (w.teamName || ''),
    }));

// ---------------------------------------------------------------------------
// Upload validation
// ---------------------------------------------------------------------------

export const ALLOWED_UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_UPLOAD_BYTES = 7 * 1024 * 1024;
export const UPLOAD_ACCEPT = ALLOWED_UPLOAD_TYPES.join(',');

export const validateUploadFile = (file: { type: string; size: number }): string | null => {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return 'Please upload a PNG, JPEG or WebP image.';
  if (file.size > MAX_UPLOAD_BYTES) return `This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is 7 MB — please compress it and try again.`;
  return null;
};

/** Target width/height ratios per type (posters accept portrait or square). */
export const TARGET_RATIOS: Record<BackgroundType, { label: string; ratio: number }[]> = {
  certificateBgs: [{ label: 'A4 portrait (794×1123)', ratio: 794 / 1123 }],
  posterBgs: [{ label: 'IG portrait 4:5 (1080×1350)', ratio: 1080 / 1350 }, { label: 'IG square 1:1 (1080×1080)', ratio: 1 }],
  studentCardBgs: [{ label: '2:3 vertical', ratio: 2 / 3 }],
};

/** Returns a warning when the image ratio is more than `tolerance` off every target ratio. */
export const aspectRatioWarning = (type: BackgroundType, width: number, height: number, tolerance = 0.15): string | null => {
  if (!width || !height) return null;
  const ratio = width / height;
  const targets = TARGET_RATIOS[type];
  if (targets.some(t => Math.abs(ratio / t.ratio - 1) <= tolerance)) return null;
  return `This image is ${width}×${height}px, which does not match the ${targets.map(t => t.label).join(' or ')} layout. It will be cropped to fit. Upload it anyway?`;
};

// ---------------------------------------------------------------------------
// Browser-only helpers
// ---------------------------------------------------------------------------

/** Fetches an image and returns a data URL. Throws (no silent fallback to the remote URL). */
export const toDataUrl = async (url: string): Promise<string> => {
  if (!url) throw new Error('No image URL');
  if (url.startsWith('data:')) return url;
  let response: Response;
  try {
    response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
  } catch (e) {
    throw new Error(`Could not download the background image (network/CORS): ${url}`);
  }
  if (!response.ok) throw new Error(`Could not download the background image (HTTP ${response.status}).`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('Could not read the background image.'));
    reader.readAsDataURL(blob);
  });
};

/** Loads and decodes an image; resolves with its natural size. */
export const loadImage = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try { await img.decode?.(); } catch { /* already loaded */ }
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Could not load the image.'));
    img.src = src;
  });

/** Waits until every <img> inside node is decoded. */
export const waitForImages = async (node: HTMLElement): Promise<void> => {
  const imgs = Array.from(node.querySelectorAll('img'));
  await Promise.all(imgs.map(async img => {
    if (!img.complete) {
      await new Promise<void>((resolve, reject) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(new Error('A template image failed to load.')), { once: true });
      });
    }
    try { await img.decode(); } catch { /* decode() rejects for some already-painted images */ }
  }));
};

export const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** Fonts (and weights) a config needs. */
export const fontsForConfig = (config: TemplateConfig): { family: string; weight: number }[] => {
  const title = config.fontFamily || 'Playfair Display';
  const body = config.bodyFontFamily || 'Bricolage Grotesque';
  return [
    { family: title, weight: config.fontWeight || 700 },
    { family: body, weight: 400 },
    { family: body, weight: 700 },
    { family: body, weight: 900 },
  ];
};

/** Loads each family/weight then waits for document.fonts.ready. */
export const ensureFonts = async (fonts: { family: string; weight: number }[]): Promise<void> => {
  if (typeof document === 'undefined' || !document.fonts) return;
  const seen = new Set<string>();
  await Promise.all(fonts.map(f => {
    const key = `${f.weight} 32px "${f.family}"`;
    if (seen.has(key)) return Promise.resolve();
    seen.add(key);
    return document.fonts.load(key).catch(() => []);
  }));
  await document.fonts.ready;
};

/** Font CSS for html-to-image; compute once per batch and reuse. Empty string on failure. */
export const computeFontEmbedCSS = async (node: HTMLElement): Promise<string> => {
  try {
    return await getFontEmbedCSS(node);
  } catch (e) {
    console.warn('Font embedding failed; export will use fallback fonts.', e);
    return '';
  }
};

export const renderNodeToJpeg = (node: HTMLElement, size: { width: number; height: number }, fontEmbedCSS?: string): Promise<string> =>
  toJpeg(node, {
    ...RENDER_OPTIONS,
    width: size.width,
    height: size.height,
    backgroundColor: '#ffffff',
    fontEmbedCSS,
    style: { transform: 'none', margin: '0' },
  });

/** A4 portrait PDF in millimetres (210×297), not the old 794×1123 px page (~373×528 mm). */
export const createA4Pdf = (): jsPDF => new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });

/** Adds a full-page JPEG; page 0 uses the page the document was created with. */
export const addA4Page = (pdf: jsPDF, jpeg: string, index: number) => {
  if (index > 0) pdf.addPage("a4", "p");
  pdf.addImage(jpeg, "JPEG", 0, 0, 210, 297, undefined, "FAST");
};

/** Builds an A4 PDF with one full-page JPEG per page. */
export const renderToPdf = (pages: string[]): jsPDF => {
  const pdf = createA4Pdf();
  pages.forEach((img, i) => addA4Page(pdf, img, i));
  return pdf;
};

export const downloadDataUrl = (dataUrl: string, fileName: string) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const safeFileName = (s: string) => (s || 'export').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');

// ---------------------------------------------------------------------------
// Background scaling (shared by every template, editor and export alike)
// ---------------------------------------------------------------------------

export const BG_SCALE_MIN = 50;
export const BG_SCALE_MAX = 200;

/**
 * Box (in % of the template) that holds the background image with object-fit: cover.
 * bgScale 100 = plain cover; other values scale the covered image around the drag position
 * (bgPositionX/Y have the same meaning as CSS background-position percentages). Pure math,
 * so the editor preview and the export are pixel-identical.
 */
export const computeBackgroundBox = (bgScale = 100, bgPositionX = 50, bgPositionY = 50) => {
  const s = Math.min(BG_SCALE_MAX, Math.max(BG_SCALE_MIN, Number(bgScale) || 100));
  const px = Math.min(100, Math.max(0, Number(bgPositionX)));
  const py = Math.min(100, Math.max(0, Number(bgPositionY)));
  return {
    width: s,
    height: s,
    left: ((100 - s) * px) / 100 + 0,
    top: ((100 - s) * py) / 100 + 0,
    objectPosition: `${px}% ${py}%`,
  };
};

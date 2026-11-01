import { ref, get, set, remove } from 'firebase/database';
import { db } from '../config/firebase';

export interface TemplateConfig {
  contentTop?: number;
  contentLeft?: number;
  textAlign?: 'left'|'center'|'right';
  textColor?: string;
  secondaryColor?: string;
  layout?: 'detailed'|'simple';
  posterSize?: 'portrait' | 'square';
  cardsPerPage?: 9 | 12 | 16;
  bgPositionX?: number;
  bgPositionY?: number;
  bgScale?: number;

  // --- Added later; every field is optional so configs saved before these existed still load.
  // Missing values are filled from the per-type defaults in exportService.mergeTemplateConfig.
  /** 2 = saved by the editor that understands certificate layout fields (see mergeTemplateConfig). */
  configVersion?: number;
  /** Heading font (certificate name / poster event title). */
  fontFamily?: string;
  /** Body font (certificate sentence / poster winners). */
  bodyFontFamily?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  /** Heading font weight (400-900). */
  fontWeight?: number;
  /** Heading letter spacing in em. */
  letterSpacing?: number;
  /** Body line height (unitless multiplier). */
  lineHeight?: number;
  /** Certificate sentence with {placeholders}; **bold**, ##bold in strong colour##, newline = line break. */
  bodyTemplate?: string;
  festVenue?: string;
  festDates?: string;
  /** Separate font per text role. Missing values fall back to fontFamily / bodyFontFamily. */
  titleFontFamily?: string;   // poster event title
  nameFontFamily?: string;    // poster winner names / certificate participant name
  teamFontFamily?: string;    // poster team line / certificate team in the details line
  /** Letter case per text role (default: the look the templates always had). */
  titleCase?: TextCase;
  nameCase?: TextCase;
  teamCase?: TextCase;
}

/** upper = JOHN DOE, title = John Doe, lower = john doe, none = as typed. */
export type TextCase = 'upper' | 'title' | 'lower' | 'none';

export type BackgroundType = 'certificateBgs' | 'posterBgs' | 'studentCardBgs';

export interface BackgroundSettings {
  certificateBgs?: Record<string, string>;
  posterBgs?: Record<string, string>;
  studentCardBgs?: Record<string, string>;
  
  configs?: Record<string, TemplateConfig>;

  /** Background id chosen with "Use for exports", per type. */
  active?: Partial<Record<BackgroundType, string>>;
  
  // Legacy
  certificateBg?: string;
  studentCardBg?: string;
}

const getBackgroundsRef = (festId: string) => `fests/${festId}/settings/backgrounds`;

export const getBackgroundSettings = async (festId: string): Promise<BackgroundSettings | null> => {
  const snapshot = await get(ref(db, getBackgroundsRef(festId)));
  if (snapshot.exists()) {
    return snapshot.val() as BackgroundSettings;
  }
  return null;
};

export const saveBackground = async (
  festId: string, 
  type: 'certificateBgs' | 'posterBgs' | 'studentCardBgs', 
  id: string, 
  url: string
): Promise<void> => {
  await set(ref(db, `${getBackgroundsRef(festId)}/${type}/${id}`), url);
};

export const deleteBackground = async (
  festId: string, 
  type: 'certificateBgs' | 'posterBgs' | 'studentCardBgs', 
  id: string
): Promise<void> => {
  await remove(ref(db, `${getBackgroundsRef(festId)}/${type}/${id}`));
  // Also remove config if it exists
  await remove(ref(db, `${getBackgroundsRef(festId)}/configs/${id}`));
  // ...and the export selection if it pointed at this background (exports then fall back
  // to the most recently added one).
  const activeRef = ref(db, `${getBackgroundsRef(festId)}/active/${type}`);
  const active = await get(activeRef);
  if (active.exists() && active.val() === id) await remove(activeRef);
};

/** Marks a background as the one used by certificate/poster/student-card exports. */
export const setActiveBackground = async (
  festId: string,
  type: BackgroundType,
  id: string
): Promise<void> => {
  await set(ref(db, `${getBackgroundsRef(festId)}/active/${type}`), id);
};

export const saveBackgroundConfig = async (
  festId: string,
  id: string,
  config: TemplateConfig
): Promise<void> => {
  await set(ref(db, `${getBackgroundsRef(festId)}/configs/${id}`), config);
};

import { ref, get, push, remove } from 'firebase/database';
import { db } from '../config/firebase';

// Fonts uploaded by a fest admin. The file is stored as a base64 data URL at
// fests/{festId}/customFonts/{id} (max 1 MB, so no extra storage service is needed) and is
// registered with an @font-face rule. Because the rule is a <style> element with an inline
// data URL, html-to-image embeds it in exports exactly like the built-in Google Fonts.

export interface CustomFont {
  id: string;
  family: string;
  dataUrl: string;
}

export const MAX_FONT_BYTES = 1024 * 1024;
export const FONT_ACCEPT = '.ttf,.otf,.woff,.woff2';

const FAMILY_PATTERN = /^[A-Za-z0-9 _-]{1,60}$/;
const DATA_URL_PATTERN = /^data:[a-z0-9.+\/-]*;base64,[A-Za-z0-9+/=]+$/i;

/** Font family name from a file name: "Anek Malayalam-Bold.ttf" -> "Anek Malayalam-Bold". */
export const familyFromFileName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9 _-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Custom Font';

/** Returns an error message, or null when the file can be uploaded. */
export const validateFontFile = (file: { name: string; size: number }): string | null => {
  if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) return 'Please choose a .ttf, .otf, .woff or .woff2 font file.';
  if (file.size > MAX_FONT_BYTES) return `This font is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is 1 MB (use .woff2 to make it smaller).`;
  return null;
};

export const isValidCustomFont = (font: Partial<CustomFont> | null | undefined): font is CustomFont =>
  !!font && typeof font.family === 'string' && FAMILY_PATTERN.test(font.family) &&
  typeof font.dataUrl === 'string' && DATA_URL_PATTERN.test(font.dataUrl);

export const getCustomFonts = async (festId: string): Promise<CustomFont[]> => {
  if (!festId) return [];
  const snap = await get(ref(db, `fests/${festId}/customFonts`));
  const data = (snap.val() || {}) as Record<string, Omit<CustomFont, 'id'>>;
  return Object.entries(data).map(([id, f]) => ({ id, ...f })).filter(isValidCustomFont);
};

/** Adds (or replaces) the @font-face rules for these fonts on the page. */
export const registerCustomFonts = (fonts: CustomFont[]) => {
  if (typeof document === 'undefined') return;
  const id = 'intensia-custom-fonts';
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);
  }
  // Values are validated (no quotes possible), so they are safe inside the CSS string.
  style.textContent = fonts.filter(isValidCustomFont)
    .map(f => `@font-face{font-family:"${f.family}";src:url("${f.dataUrl}");font-display:block;}`)
    .join('\n');
};

/** Fetch + register; safe to call before every export. Returns the fonts (empty on failure). */
export const loadCustomFonts = async (festId: string): Promise<CustomFont[]> => {
  try {
    const fonts = await getCustomFonts(festId);
    registerCustomFonts(fonts);
    return fonts;
  } catch (e) {
    console.warn('Custom fonts could not be loaded; exports will use the built-in fonts.', e);
    return [];
  }
};

const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error || new Error('Could not read the font file.'));
  reader.readAsDataURL(file);
});

export const uploadCustomFont = async (festId: string, file: File, family = familyFromFileName(file.name)): Promise<CustomFont> => {
  const problem = validateFontFile(file);
  if (problem) throw new Error(problem);
  // Some browsers report fonts as application/octet-stream or an empty type; normalise it.
  const raw = await readAsDataUrl(file);
  const ext = file.name.split('.').pop()!.toLowerCase();
  const dataUrl = raw.replace(/^data:[^;]*;base64,/, `data:font/${ext};base64,`);
  const font = { family, dataUrl };
  if (!isValidCustomFont({ id: 'new', ...font })) throw new Error('Font name may only use letters, numbers, spaces, "-" and "_".');
  const created = await push(ref(db, `fests/${festId}/customFonts`), font);
  return { id: created.key as string, ...font };
};

export const deleteCustomFont = (festId: string, id: string) => remove(ref(db, `fests/${festId}/customFonts/${id}`));

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
}

export interface BackgroundSettings {
  certificateBgs?: Record<string, string>;
  posterBgs?: Record<string, string>;
  studentCardBgs?: Record<string, string>;
  
  configs?: Record<string, TemplateConfig>;
  
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
};

export const saveBackgroundConfig = async (
  festId: string,
  id: string,
  config: TemplateConfig
): Promise<void> => {
  await set(ref(db, `${getBackgroundsRef(festId)}/configs/${id}`), config);
};

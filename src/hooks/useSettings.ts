import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { settingsService } from '../services/settingsService';
import { CATEGORIES } from '../constants/categories';
import { reportError } from '../utils/errorReporting';

const DEFAULT_SETTINGS: Settings = {
  categories: CATEGORIES,
  maxStudentsPerTeam: 50,
  maxNonGeneralPerStudent: 3,
  showOverallLeaderboardInPublic: false,
};

export const useSettings = (festId: string | null) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!festId) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = settingsService.subscribeToSettings(festId, (data) => {
      setSettings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [festId]);

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!festId) return false;
    try {
      return await settingsService.updateSettings(festId, updates);
    } catch (err) {
      return reportError('Settings not saved', err);
    }
  };

  return { settings, loading, updateSettings };
};

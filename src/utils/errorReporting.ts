import { appDialog } from '../components/ui/AppDialog';

// One place that turns a failed save/delete into a message the user actually sees.
// Every write in the app should end here (or show its own message) instead of only
// logging to the console, so nothing fails silently.

/** Plain-language reason for a Firebase / network / Cloud Function error. */
export const describeError = (error: unknown): string => {
  const e = error as { code?: string; message?: string } | undefined;
  const code = String(e?.code || '').toLowerCase();
  const message = String(e?.message || '');

  if (code.includes('permission') || /permission.denied/i.test(message)) {
    return 'Permission denied: this account is not allowed to do this, or the login has expired. Please sign in again.';
  }
  if (code === 'functions/not-found' || code === 'functions/internal' || /^internal$/i.test(message)) {
    return 'The server function for this action is not available. The Cloud Functions may not be deployed yet.';
  }
  if (code === 'functions/unauthenticated' || code === 'auth/user-token-expired') {
    return 'Your login has expired. Please sign in again.';
  }
  if (code === 'functions/unavailable' || code.includes('network') || /network|offline|failed to fetch/i.test(message)) {
    return 'Could not reach the server. Check the internet connection and try again.';
  }
  return message || 'Unknown error.';
};

// The same failure often hits many writes at once (e.g. "send all to Green Room");
// show it once instead of one dialog per program.
let lastShown = { key: '', at: 0 };

const show = (title: string, error: unknown, suffix: string, context?: Record<string, unknown>) => {
  console.error(`${title}:`, { ...context, code: (error as any)?.code, message: (error as any)?.message });
  const reason = describeError(error);
  const key = `${title}|${reason}`;
  const now = Date.now();
  if (key !== lastShown.key || now - lastShown.at > 4000) {
    lastShown = { key, at: now };
    appDialog.alert(`${reason} ${suffix}`, { title, variant: 'danger' });
  }
};

/** Logs a failed save/delete and shows it to the user. Always returns false, for `return reportError(...)`. */
export const reportError = (title: string, error: unknown, context?: Record<string, unknown>): false => {
  show(title, error, 'This change was not saved.', context);
  return false;
};

/**
 * A live data listener was refused (e.g. permission lost). Without this the page just shows
 * empty lists. Pass `signedIn` so a listener cancelled by logging out stays quiet.
 */
export const reportLoadError = (what: string, error: unknown, signedIn: boolean) => {
  if (!signedIn) { console.warn(`Stopped loading ${what} (signed out).`, error); return; }
  show(`Could not load ${what}`, error, 'The page may be empty or out of date until this is fixed and the page is reloaded.');
};

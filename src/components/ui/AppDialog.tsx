import React, { useEffect, useState } from 'react';

// App-wide replacement for window.alert / confirm / prompt, rendered with the same styled
// modal used in ProgramAccordion. Call it from anywhere (components or services):
//   await appDialog.alert('Saved!', { variant: 'success' });
//   if (!(await appDialog.confirm('Delete this?', { variant: 'danger', confirmText: 'Delete' }))) return;
//   const value = await appDialog.prompt('How many stages?', '3');
// <AppDialogHost /> must be mounted once (App.tsx).

export type DialogVariant = 'primary' | 'warning' | 'danger' | 'success';

interface DialogOptions {
  title?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

interface DialogRequest extends DialogOptions {
  id: number;
  type: 'alert' | 'confirm' | 'prompt';
  message: string;
  defaultValue?: string;
  resolve: (value: any) => void;
}

let nextId = 1;
let queue: DialogRequest[] = [];
const listeners = new Set<(queue: DialogRequest[]) => void>();
const emit = () => listeners.forEach(l => l([...queue]));

// When a call site gives no variant, pick one from the wording so messages keep a consistent look.
const inferVariant = (type: DialogRequest['type'], message: string): DialogVariant => {
  const m = message.toLowerCase();
  if (type === 'prompt') return 'primary';
  if (type === 'confirm') {
    return /delete|remove|wipe|cannot be undone|deactivate/.test(m) ? 'danger' : 'warning';
  }
  if (/fail|error|blocked|not authori[sz]ed/.test(m)) return 'danger';
  if (/^(cannot|please|no |unable)|not allowed|limit reached|already exist/.test(m)) return 'warning';
  if (/success|deleted|wiped|fixed|finished|saved|updated|seeded/.test(m)) return 'success';
  return 'primary';
};

const open = <T,>(request: Omit<DialogRequest, 'id' | 'resolve'>, fallback: () => T): Promise<T> => {
  // If no host is mounted (should not happen), fall back to the browser dialog.
  if (listeners.size === 0) return Promise.resolve(fallback());
  return new Promise<T>(resolve => {
    queue = [...queue, { ...request, variant: request.variant || inferVariant(request.type, request.message), id: nextId++, resolve }];
    emit();
  });
};

const defaultTitle = (type: DialogRequest['type'], variant?: DialogVariant) => {
  if (type === 'confirm' || type === 'prompt') return variant === 'danger' ? 'Are you sure?' : 'Please confirm';
  if (variant === 'danger') return 'Something went wrong';
  if (variant === 'warning') return 'Action not allowed';
  if (variant === 'success') return 'Success';
  return 'Notification';
};

export const appDialog = {
  alert: (message: string, options: DialogOptions = {}) =>
    open<void>({ type: 'alert', message, ...options }, () => window.alert(message)),
  confirm: (message: string, options: DialogOptions = {}) =>
    open<boolean>({ type: 'confirm', message, ...options }, () => window.confirm(message)),
  prompt: (message: string, defaultValue = '', options: DialogOptions = {}) =>
    open<string | null>({ type: 'prompt', message, defaultValue, ...options }, () => window.prompt(message, defaultValue))
};

const VARIANT_STYLES: Record<DialogVariant, { icon: string; button: string }> = {
  primary: { icon: 'bg-indigo-100 text-indigo-600', button: 'bg-indigo-600 hover:bg-indigo-700' },
  warning: { icon: 'bg-amber-100 text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' },
  danger: { icon: 'bg-rose-100 text-rose-600', button: 'bg-rose-600 hover:bg-rose-700' },
  success: { icon: 'bg-emerald-100 text-emerald-600', button: 'bg-emerald-600 hover:bg-emerald-700' }
};

export const AppDialogHost: React.FC = () => {
  const [items, setItems] = useState<DialogRequest[]>([]);
  const [promptValue, setPromptValue] = useState('');
  const current = items[0];

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  useEffect(() => {
    if (current?.type === 'prompt') setPromptValue(current.defaultValue || '');
  }, [current?.id]);

  if (!current) return null;

  const close = (value: any) => {
    queue = queue.filter(q => q.id !== current.id);
    emit();
    current.resolve(value);
  };
  const cancelValue = current.type === 'confirm' ? false : current.type === 'prompt' ? null : undefined;
  const confirmValue = current.type === 'confirm' ? true : current.type === 'prompt' ? promptValue : undefined;
  const variant = current.variant || 'primary';
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => { if (e.key === 'Escape') close(cancelValue); }}
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 transform transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${styles.icon}`}>
            {variant === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">{current.title || defaultTitle(current.type, current.variant)}</h4>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed pl-1 whitespace-pre-line break-words">{current.message}</p>

        {current.type === 'prompt' && (
          <div className="mb-5">
            <input
              type="text"
              autoFocus
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter') close(promptValue); }}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          {(current.type === 'confirm' || current.type === 'prompt') && (
            <button
              type="button"
              onClick={() => close(cancelValue)}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {current.cancelText || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            autoFocus={current.type !== 'prompt'}
            onClick={() => close(confirmValue)}
            className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-sm ${styles.button}`}
          >
            {current.type === 'alert' ? (current.confirmText || 'OK') : (current.confirmText || 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

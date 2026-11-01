import React, { useEffect, useState } from 'react';
import { CustomProgramScore } from '../types';
import { FestDefaultScores, getDefaultCustomScore, getStandardScore, maxPoints } from '../utils/pointsCalculator';

// Settings → Default Scoring. Tap a value to edit it; changes are kept as a draft until
// "Save defaults", so the confirmation and the recalculation of results happen once.

type Kind = 'individual' | 'group';
type Cell = { kind: Kind; section: 'gradePoints' | 'rankPoints'; key: string };

const GRADE_ROWS = ['A+', 'A', 'B', 'C'] as const;
const RANK_ROWS = [{ key: '1', label: '🥇 1st Place' }, { key: '2', label: '🥈 2nd Place' }, { key: '3', label: '🥉 3rd Place' }];
const MAX_VALUE = 1000;

const tablesFrom = (defaults?: FestDefaultScores): Record<Kind, CustomProgramScore> => ({
  individual: getDefaultCustomScore(false, defaults),
  group: getDefaultCustomScore(true, defaults),
});

const sameTable = (a: CustomProgramScore, b: CustomProgramScore) => JSON.stringify(a) === JSON.stringify(b);

interface DefaultScoringEditorProps {
  defaults?: FestDefaultScores;
  /** Saves both tables; resolves false when nothing was saved (the caller shows why). */
  onSave: (next: Record<Kind, CustomProgramScore>, changed: Kind[]) => Promise<boolean>;
}

export const DefaultScoringEditor: React.FC<DefaultScoringEditorProps> = ({ defaults, onSave }) => {
  const saved = tablesFrom(defaults);
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState<Cell | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Follow changes saved elsewhere (another admin / another tab) while nothing is being edited.
  const savedKey = JSON.stringify(saved);
  const changed = (['individual', 'group'] as Kind[]).filter(k => !sameTable(draft[k], saved[k]));
  useEffect(() => { if (changed.length === 0 && !editing) setDraft(saved); }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const valueOf = (c: Cell) => (draft[c.kind][c.section] as Record<string, number>)[c.key] ?? 0;
  const isEditing = (c: Cell) => editing?.kind === c.kind && editing.section === c.section && editing.key === c.key;

  const startEdit = (c: Cell) => { setEditing(c); setText(String(valueOf(c))); setError(''); };
  const commit = () => {
    if (!editing) return;
    const n = Number(text.trim());
    if (text.trim() === '' || !Number.isFinite(n) || n < 0 || n > MAX_VALUE) {
      setError(`Enter a number from 0 to ${MAX_VALUE}.`);
      return;
    }
    const { kind, section, key } = editing;
    setDraft(d => ({ ...d, [kind]: { ...d[kind], [section]: { ...d[kind][section], [key]: n } } }));
    setEditing(null);
    setError('');
  };

  const save = async () => {
    if (editing) return;
    setIsSaving(true);
    try {
      await onSave(draft, changed);
    } finally {
      setIsSaving(false);
    }
  };

  const valueCell = (c: Cell, prefix = '') => (
    <td className="px-4 py-1.5 text-right">
      {isEditing(c) ? (
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_VALUE}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(null); setError(''); } }}
          className="w-20 px-2 py-1 border border-indigo-400 rounded-md text-right text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
          aria-label="Points"
        />
      ) : (
        <button
          type="button"
          onClick={() => startEdit(c)}
          title="Tap to edit"
          className={`px-2 py-1 rounded-md font-black hover:bg-indigo-50 hover:text-indigo-700 border border-dashed border-transparent hover:border-indigo-300 transition-colors ${
            valueOf(c) !== (getStandardScore(c.kind === 'group')[c.section] as Record<string, number>)[c.key] ? 'text-indigo-700' : 'text-slate-800'
          }`}
        >
          {prefix}{valueOf(c)} pts
        </button>
      )}
    </td>
  );

  const table = (kind: Kind, title: string, tone: { head: string; text: string; sub: string }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className={`px-4 py-2.5 ${tone.head} flex items-center justify-between`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${tone.text}`}>{title}</p>
        <span className={`text-xs font-black ${tone.sub}`}>Max {maxPoints(draft[kind])} pts</span>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {GRADE_ROWS.map(g => (
            <tr key={g} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-1.5 text-slate-500 font-medium">Grade {g}</td>
              {valueCell({ kind, section: 'gradePoints', key: g })}
            </tr>
          ))}
          {RANK_ROWS.map((r, i) => (
            <tr key={r.key} className={i === 0 ? 'border-t-2 border-slate-100' : 'border-t border-slate-100'}>
              <td className="px-4 py-1.5 text-slate-500 font-medium">{r.label}</td>
              {valueCell({ kind, section: 'rankPoints', key: r.key }, '+')}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Default Scoring</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Points used for every program without a custom score. Tap a value to change it.</p>
        </div>
        <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-black uppercase tracking-wider shrink-0">Editable</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {table('individual', 'Individual', { head: 'bg-teal-50 border-b border-teal-100', text: 'text-teal-700', sub: 'text-teal-600' })}
          {table('group', 'Group', { head: 'bg-purple-50 border-b border-purple-100', text: 'text-purple-700', sub: 'text-purple-600' })}
        </div>

        {error && <p className="text-[11px] font-bold text-rose-600 mt-3" role="alert">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={() => { setDraft({ individual: getStandardScore(false), group: getStandardScore(true) }); setEditing(null); setError(''); }}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline"
          >
            Reset to standard (10 / 20)
          </button>
          {changed.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDraft(saved); setEditing(null); setError(''); }}
                disabled={isSaving}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-black hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={isSaving || !!editing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save defaults'}
              </button>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400 italic mt-3">
          Use <span className="font-bold text-slate-600">Custom Program Scores</span> above to override these for one specific program.
        </p>
      </div>
    </section>
  );
};

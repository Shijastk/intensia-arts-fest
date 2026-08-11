import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, Program, CustomProgramScore } from '../types';
import {
  getDefaultCustomScore,
  AVAILABLE_GRADES,
  INDIVIDUAL_GRADE_POINTS,
  INDIVIDUAL_RANK_POINTS,
  GROUP_GRADE_POINTS,
  GROUP_RANK_POINTS,
} from '../utils/pointsCalculator';

interface SettingsPageProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>;
  programs?: Program[];
}

const GRADE_LABEL: Record<string, string> = {
  'A+': 'A+',
  'A': 'A',
  'B': 'B',
  'C': 'C',
};

const emptyCustomForm = (isGroup: boolean) => {
  const def = getDefaultCustomScore(isGroup);
  return {
    gradePoints: {
      'A+': String(def.gradePoints['A+']),
      'A': String(def.gradePoints['A']),
      'B': String(def.gradePoints['B']),
      'C': String(def.gradePoints['C']),
      'No Grade': '0',
    },
    rankPoints: {
      1: String(def.rankPoints[1]),
      2: String(def.rankPoints[2]),
      3: String(def.rankPoints[3]),
    },
  };
};

// ── Small reusable tag chip ──────────────────────────────────────────────────
const Chip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
    <span className="text-xs font-bold text-slate-700">{label}</span>
    <button onClick={onRemove} className="text-slate-400 hover:text-rose-500 transition-colors leading-none">✕</button>
  </div>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, updateSettings, programs = [] }) => {
  // ── General settings ──────────────────────────────────────────────────────
  const [categories, setCategories] = useState<string[]>(settings?.categories || []);
  const [newCategory, setNewCategory] = useState('');
  const [zones, setZones] = useState<string[]>(settings?.zones || []);
  const [newZone, setNewZone] = useState('');
  const [editingZoneIdx, setEditingZoneIdx] = useState<number | null>(null);
  const [editingZoneValue, setEditingZoneValue] = useState('');
  const [maxStudents, setMaxStudents] = useState<number>(settings?.maxStudentsPerTeam || 50);
  const [maxNonGeneral, setMaxNonGeneral] = useState<number>(settings?.maxNonGeneralPerStudent || 3);
  const [showOverallPoints, setShowOverallPoints] = useState<boolean>(settings?.showOverallLeaderboardInPublic ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // ── Custom score state ────────────────────────────────────────────────────
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [customForm, setCustomForm] = useState(emptyCustomForm(false));
  const [customSaveMsg, setCustomSaveMsg] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  // ── Searchable dropdown ───────────────────────────────────────────────────
  const [programQuery, setProgramQuery] = useState('');
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const programDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (programDropdownRef.current && !programDropdownRef.current.contains(e.target as Node)) {
        setIsProgramDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const handleProgramSelect = useCallback((programId: string) => {
    setSelectedProgramId(programId);
    setCustomSaveMsg('');
    if (!programId) { setCustomForm(emptyCustomForm(false)); return; }
    const prog = programs.find(p => p.id === programId);
    const existing = settings?.customScores?.[programId];
    if (existing) {
      setCustomForm({
        gradePoints: {
          'A+': String(existing.gradePoints['A+']),
          'A': String(existing.gradePoints['A']),
          'B': String(existing.gradePoints['B']),
          'C': String(existing.gradePoints['C']),
          'No Grade': '0',
        },
        rankPoints: {
          1: String(existing.rankPoints[1]),
          2: String(existing.rankPoints[2]),
          3: String(existing.rankPoints[3]),
        },
      });
    } else {
      setCustomForm(emptyCustomForm(prog?.isGroup ?? false));
    }
  }, [programs, settings?.customScores]);

  // ── Zone helpers ──────────────────────────────────────────────────────────
  const handleAddZone = () => {
    const v = newZone.trim();
    if (v && !zones.includes(v)) { setZones([...zones, v]); setNewZone(''); }
  };
  const handleRemoveZone = (z: string) => setZones(zones.filter(x => x !== z));
  const startEditZone = (idx: number) => { setEditingZoneIdx(idx); setEditingZoneValue(zones[idx]); };
  const confirmEditZone = () => {
    if (editingZoneIdx === null) return;
    const v = editingZoneValue.trim();
    if (!v) return;
    const updated = zones.map((z, i) => i === editingZoneIdx ? v : z);
    setZones(updated);
    setEditingZoneIdx(null);
  };

  // ── Category helpers ──────────────────────────────────────────────────────
  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  // ── Save general settings ─────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    const success = await updateSettings({
      categories,
      zones,
      maxStudentsPerTeam: maxStudents,
      maxNonGeneralPerStudent: maxNonGeneral,
      showOverallLeaderboardInPublic: showOverallPoints,
    });
    setIsSaving(false);
    if (success) {
      setSaveMessage('Settings updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('Failed to update settings.');
    }
  };

  // ── Custom score helpers ──────────────────────────────────────────────────
  const handleCustomFormChange = (section: 'gradePoints' | 'rankPoints', key: string, value: string) => {
    setCustomForm(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const handleSaveCustomScore = async () => {
    if (!selectedProgramId) return;
    setIsSavingCustom(true);
    setCustomSaveMsg('');
    const parsed: CustomProgramScore = {
      gradePoints: {
        'A+': Number(customForm.gradePoints['A+']) || 0,
        'A': Number(customForm.gradePoints['A']) || 0,
        'B': Number(customForm.gradePoints['B']) || 0,
        'C': Number(customForm.gradePoints['C']) || 0,
        'No Grade': 0,
      },
      rankPoints: {
        1: Number(customForm.rankPoints[1]) || 0,
        2: Number(customForm.rankPoints[2]) || 0,
        3: Number(customForm.rankPoints[3]) || 0,
      },
    };
    const updatedCustomScores = { ...(settings?.customScores || {}), [selectedProgramId]: parsed };
    const success = await updateSettings({ customScores: updatedCustomScores });
    setIsSavingCustom(false);
    setCustomSaveMsg(success ? 'Custom score saved!' : 'Failed to save.');
    if (success) setTimeout(() => setCustomSaveMsg(''), 3000);
  };

  const handleRemoveCustomScore = async (programId: string) => {
    const updated = { ...(settings?.customScores || {}) };
    delete updated[programId];
    await updateSettings({ customScores: updated });
    if (selectedProgramId === programId) { setSelectedProgramId(''); setCustomForm(emptyCustomForm(false)); }
  };

  const existingCustomScorePrograms = Object.keys(settings?.customScores || {});

  return (
    <div className="max-w-4xl mx-auto font-sans pb-16">

      {/* ── Sticky Page Header ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 -mx-4 px-4 py-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Festival Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">Zones · Categories · Score rules · Limits</p>
          </div>
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className={`text-xs font-bold ${saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#3B3BFA] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 shrink-0"
            >
              {isSaving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">


      {/* ── Public Portal Settings ── */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Public Portal Settings</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Control what visitors see on the public results page.</p>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Overall Championship Leaderboard</label>
            <p className="text-[11px] text-slate-400">Display the total team points in the results page carousel.</p>
          </div>
          <button
            onClick={() => setShowOverallPoints(!showOverallPoints)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${showOverallPoints ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showOverallPoints ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* ── Rules & Limits ── */}

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Rules &amp; Limits</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Participation caps for students and teams.</p>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Max Students Per Team</label>
            <p className="text-[11px] text-slate-400 mb-2">Maximum unique students a team can register.</p>
            <input
              type="number" value={maxStudents}
              onChange={e => setMaxStudents(Number(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-center focus:border-[#3B3BFA] outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase mb-1">Max Non-General Per Student</label>
            <p className="text-[11px] text-slate-400 mb-2">How many non-general programs one student may join.</p>
            <input
              type="number" value={maxNonGeneral}
              onChange={e => setMaxNonGeneral(Number(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-center focus:border-[#3B3BFA] outline-none"
            />
          </div>
        </div>
      </section>

      {/* ── Zone Management ── */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Zone Management</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Add, rename, or remove competition zones.</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Add zone input */}
          <div className="flex gap-2">
            <input
              type="text" value={newZone}
              onChange={e => setNewZone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddZone()}
              placeholder="e.g. Zone A, Zone B…"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B3BFA] outline-none"
            />
            <button
              onClick={handleAddZone}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              + Add Zone
            </button>
          </div>

          {/* Zone list */}
          {zones.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-3">No zones configured yet.</p>
          ) : (
            <div className="space-y-2">
              {zones.map((z, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  {editingZoneIdx === idx ? (
                    <>
                      <input
                        autoFocus
                        value={editingZoneValue}
                        onChange={e => setEditingZoneValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEditZone(); if (e.key === 'Escape') setEditingZoneIdx(null); }}
                        className="flex-1 px-2 py-1 border border-indigo-300 rounded-lg text-sm font-bold outline-none focus:border-indigo-500"
                      />
                      <button onClick={confirmEditZone} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-colors">Save</button>
                      <button onClick={() => setEditingZoneIdx(null)} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-50">Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-bold text-slate-800">{z}</span>
                      <button
                        onClick={() => startEditZone(idx)}
                        className="px-2.5 py-1 text-[10px] font-black uppercase bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleRemoveZone(z)}
                        className="px-2.5 py-1 text-[10px] font-black uppercase bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-400 italic">
            Changes will apply the next time a program is created or edited.
          </p>
        </div>
      </section>

      {/* ── Program Categories ── */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Program Categories</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage event category labels (e.g. Sub Junior, General).</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              type="text" value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder="E.g. Super Senior (Stage)"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B3BFA] outline-none"
            />
            <button onClick={handleAddCategory} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">+ Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, idx) => (
              <Chip key={idx} label={cat} onRemove={() => setCategories(categories.filter(c => c !== cat))} />
            ))}
            {categories.length === 0 && <p className="text-xs text-slate-400 italic">No categories added yet.</p>}
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Categories containing "General" bypass the non-general programs limit.
          </p>
        </div>
      </section>

      {/* ── Custom Program Scores ── */}
      <section className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Custom Program Scores</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Override default point values for individual programs.</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Active overrides list */}
          {existingCustomScorePrograms.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Active Overrides</p>
              <div className="space-y-2">
                {existingCustomScorePrograms.map(pid => {
                  const prog = programs.find(p => p.id === pid);
                  const cs = settings.customScores?.[pid];
                  if (!cs) return null;
                  const maxGrade = Math.max(cs.gradePoints['A+'], cs.gradePoints['A']);
                  const maxRank = cs.rankPoints[1];
                  return (
                    <div key={pid} className="flex items-center justify-between gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{prog?.name || pid}</p>
                        <p className="text-[11px] text-indigo-600 font-bold mt-0.5">
                          Max: {maxGrade + maxRank} pts · {prog?.isGroup ? 'Group' : 'Individual'} · A+: {maxGrade} · Rank 1st: +{maxRank}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { handleProgramSelect(pid); setProgramQuery(''); setIsProgramDropdownOpen(false); }} className="px-2.5 py-1 text-[10px] font-black uppercase bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors">Edit</button>
                        <button onClick={() => handleRemoveCustomScore(pid)} className="px-2.5 py-1 text-[10px] font-black uppercase bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 mt-4" />
            </div>
          )}

          {/* Searchable program picker */}
          <div ref={programDropdownRef}>
            <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Select Program to Customize</label>
            <div className="relative">
              <input
                type="text"
                value={selectedProgram ? selectedProgram.name : programQuery}
                onChange={e => {
                  if (selectedProgram) { handleProgramSelect(''); }
                  setProgramQuery(e.target.value);
                  setIsProgramDropdownOpen(true);
                }}
                onFocus={() => setIsProgramDropdownOpen(true)}
                placeholder="Search programs by name or category…"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold focus:border-indigo-500 outline-none transition-colors pr-10 ${
                  selectedProgram ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-800'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {selectedProgram ? (
                  <button
                    type="button"
                    onClick={() => { handleProgramSelect(''); setProgramQuery(''); setIsProgramDropdownOpen(false); }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-200 hover:bg-rose-400 hover:text-white text-indigo-700 transition-colors text-[10px] font-black"
                  >✕</button>
                ) : (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>

              {isProgramDropdownOpen && !selectedProgram && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                  {(() => {
                    const q = programQuery.toLowerCase();
                    const filtered = programs.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
                    const displayed = programQuery.trim() === '' ? filtered.slice(0, 6) : filtered;
                    if (displayed.length === 0) return <div className="p-4 text-xs text-slate-500 text-center">No programs found</div>;
                    return (
                      <>
                        {programQuery.trim() === '' && (
                          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                            Suggested Programs
                          </div>
                        )}
                        {displayed.map(p => {
                          const hasCustom = !!settings?.customScores?.[p.id];
                          return (
                            <div
                              key={p.id}
                              onClick={() => { handleProgramSelect(p.id); setProgramQuery(''); setIsProgramDropdownOpen(false); }}
                              className="px-3 py-2.5 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-indigo-50 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-800">{p.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${p.isGroup ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                                    {p.isGroup ? 'Group' : 'Indiv'}
                                  </span>
                                  {hasCustom && <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-amber-100 text-amber-600">✦ Custom</span>}
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{p.category}</div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            {selectedProgram && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                Default max: {selectedProgram.isGroup ? '20 pts (10 Grade + 10 Rank)' : '10 pts (5 Grade + 5 Rank)'}
              </p>
            )}
          </div>

          {/* Custom score form */}
          {selectedProgram && (
            <div className="border border-indigo-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-indigo-600 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Configuring</p>
                <p className="text-sm font-black">{selectedProgram.name}</p>
                <p className="text-[11px] opacity-60">{selectedProgram.category} · {selectedProgram.isGroup ? 'Group' : 'Individual'}</p>
              </div>
              <div className="p-5 space-y-5 bg-indigo-50/30">
                {/* Grade Points */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-3">Grade Points</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AVAILABLE_GRADES.filter(g => g !== 'No Grade').map(grade => (
                      <div key={grade}>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{GRADE_LABEL[grade] || grade}</label>
                        <input
                          type="number" min="0" max="999"
                          value={customForm.gradePoints[grade as keyof typeof customForm.gradePoints]}
                          onChange={e => handleCustomFormChange('gradePoints', grade, e.target.value)}
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-bold text-center focus:border-indigo-500 outline-none bg-white"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">A+ and A typically share the same value.</p>
                </div>

                {/* Rank Points */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-700 mb-3">Rank Bonus Points</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([1, 2, 3] as const).map(rank => (
                      <div key={rank}>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          {rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd'}
                        </label>
                        <input
                          type="number" min="0" max="999"
                          value={customForm.rankPoints[rank]}
                          onChange={e => handleCustomFormChange('rankPoints', String(rank), e.target.value)}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm font-bold text-center focus:border-purple-500 outline-none bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview bar */}
                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Max Points Preview (Grade + Rank 1)</p>
                  <div className="flex flex-wrap gap-4">
                    {(['A+', 'A', 'B', 'C'] as const).map(grade => {
                      const g = Number(customForm.gradePoints[grade]) || 0;
                      const r = Number(customForm.rankPoints[1]) || 0;
                      return (
                        <div key={grade} className="text-center">
                          <p className="text-[10px] text-slate-400 font-bold">{grade}</p>
                          <p className="text-xl font-black text-indigo-600">{g + r}</p>
                          <p className="text-[9px] text-slate-400">pts</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {customSaveMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${customSaveMsg.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {customSaveMsg}
                  </div>
                )}

                <button
                  onClick={handleSaveCustomScore}
                  disabled={isSavingCustom}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {isSavingCustom ? 'Saving…' : `Save Custom Score for "${selectedProgram.name}"`}
                </button>
              </div>
            </div>
          )}

          {!selectedProgram && programs.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-4">No programs found. Add programs first.</p>
          )}
        </div>
      </section>

      {/* ── Default Scoring Reference (read-only, bottom) ── */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Default Scoring Reference</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Global point values used when no custom override is set.</p>
          </div>
          <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-1 rounded-full font-black uppercase tracking-wider">Read-only</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Individual */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-700">Individual</p>
                <span className="text-xs font-black text-teal-600">Max 10 pts</span>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {[
                    { label: 'Grade A+', val: INDIVIDUAL_GRADE_POINTS['A+'] },
                    { label: 'Grade A',  val: INDIVIDUAL_GRADE_POINTS['A']  },
                    { label: 'Grade B',  val: INDIVIDUAL_GRADE_POINTS['B']  },
                    { label: 'Grade C',  val: INDIVIDUAL_GRADE_POINTS['C']  },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-500 font-medium">{row.label}</td>
                      <td className="px-4 py-2 text-right font-black text-slate-800">{row.val} pts</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-100">
                    <td className="px-4 py-2 text-slate-500 font-medium">🥇 1st Place</td>
                    <td className="px-4 py-2 text-right font-black text-slate-800">+{INDIVIDUAL_RANK_POINTS[1]} pts</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-500 font-medium">🥈 2nd Place</td>
                    <td className="px-4 py-2 text-right font-black text-slate-800">+{INDIVIDUAL_RANK_POINTS[2]} pts</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-500 font-medium">🥉 3rd Place</td>
                    <td className="px-4 py-2 text-right font-black text-slate-800">+{INDIVIDUAL_RANK_POINTS[3]} pts</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Group */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-700">Group</p>
                <span className="text-xs font-black text-purple-600">Max 20 pts</span>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {[
                    { label: 'Grade A+', val: GROUP_GRADE_POINTS['A+'] },
                    { label: 'Grade A',  val: GROUP_GRADE_POINTS['A']  },
                    { label: 'Grade B',  val: GROUP_GRADE_POINTS['B']  },
                    { label: 'Grade C',  val: GROUP_GRADE_POINTS['C']  },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-500 font-medium">{row.label}</td>
                      <td className="px-4 py-2 text-right font-black text-slate-800">{row.val} pts</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-100">
                    <td className="px-4 py-2 text-slate-500 font-medium">🥇 1st Place</td>
                    <td className="px-4 py-2 text-right font-black text-slate-800">+{GROUP_RANK_POINTS[1]} pts</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-500 font-medium">🥈 2nd Place</td>
                    <td className="px-4 py-2 text-right font-black text-slate-800">+{GROUP_RANK_POINTS[2]} pts</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-500 font-medium">🥉 3rd Place</td>
                    <td className="px-4 py-2 text-right font-black text-slate-800">+{GROUP_RANK_POINTS[3]} pts</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
          <p className="text-[11px] text-slate-400 italic mt-3">
            Use <span className="font-bold text-slate-600">Custom Program Scores</span> above to override these for any specific program.
          </p>
        </div>
      </section>

      </div>
    </div>
  );
};

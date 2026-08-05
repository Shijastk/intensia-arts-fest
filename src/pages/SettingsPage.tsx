import React, { useState } from 'react';
import { Settings } from '../types';

interface SettingsPageProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, updateSettings }) => {
  const [categories, setCategories] = useState<string[]>(settings?.categories || []);
  const [newCategory, setNewCategory] = useState('');
  const [maxStudents, setMaxStudents] = useState<number>(settings?.maxStudentsPerTeam || 50);
  const [maxNonGeneral, setMaxNonGeneral] = useState<number>(settings?.maxNonGeneralPerStudent || 3);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    const success = await updateSettings({
      categories,
      maxStudentsPerTeam: maxStudents,
      maxNonGeneralPerStudent: maxNonGeneral
    });
    setIsSaving(false);
    if (success) {
      setSaveMessage('Settings updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('Failed to update settings.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            Festival Settings ⚙️
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage rules, categories, and system limits.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-6 py-3 bg-[#3B3BFA] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold ${saveMessage.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {saveMessage}
        </div>
      )}

      {/* Rules & Limits */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Rules & Limits</h2>
          <p className="text-xs text-slate-500 mt-1">Set participation limits for students and teams.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-black text-slate-700 uppercase mb-1">Max Students Per Team</label>
              <p className="text-[11px] text-slate-500">The maximum total number of unique students a team can register.</p>
            </div>
            <input 
              type="number" 
              value={maxStudents}
              onChange={(e) => setMaxStudents(Number(e.target.value) || 0)}
              className="w-full sm:w-32 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-center focus:border-[#3B3BFA] outline-none"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-black text-slate-700 uppercase mb-1">Max Non-General Programs Per Student</label>
              <p className="text-[11px] text-slate-500">Limit how many individual/group programs a student can participate in (General programs have no limit).</p>
            </div>
            <input 
              type="number" 
              value={maxNonGeneral}
              onChange={(e) => setMaxNonGeneral(Number(e.target.value) || 0)}
              className="w-full sm:w-32 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-center focus:border-[#3B3BFA] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Program Categories</h2>
          <p className="text-xs text-slate-500 mt-1">Manage the available categories for events (e.g., Sub Junior, General, etc).</p>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="E.g. Super Senior (Stage)"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B3BFA] outline-none"
            />
            <button 
              onClick={handleAddCategory}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors hover:bg-slate-800"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-700">{cat}</span>
                <button 
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-slate-400 italic">No categories added yet.</p>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-4 italic">
            Note: Programs assigned to a category containing the word "General" will bypass the 'Max Non-General Programs' limit.
          </p>
        </div>
      </div>
    </div>
  );
};

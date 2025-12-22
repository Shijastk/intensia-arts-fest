import React from 'react';
import { Program } from '../types';

interface ProgramFormModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent<HTMLFormElement>) => void;
    editingProgram: Program | null;
    isGroup: boolean;
    setIsGroup: (value: boolean) => void;
    categories: string[];
}

export const ProgramFormModal: React.FC<ProgramFormModalProps> = ({
    show,
    onClose,
    onSave,
    editingProgram,
    isGroup,
    setIsGroup,
    categories
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-6">
                <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center text-white">
                    <h3 className="text-sm font-black uppercase tracking-widest">{editingProgram ? 'Update Event Config' : 'Initialize New Event'}</h3>
                    <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <form onSubmit={onSave} className="p-8 space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Event Name</label>
                            <input name="name" defaultValue={editingProgram?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="e.g. Solo Verse" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                            <select name="category" defaultValue={editingProgram?.category} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none cursor-pointer focus:border-indigo-500">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Time Slot</label>
                                <input name="startTime" defaultValue={editingProgram?.startTime} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none" placeholder="10:00 AM" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Venue</label>
                                <input name="venue" defaultValue={editingProgram?.venue} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none" placeholder="Auditorium A" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5 items-center">
                        {!isGroup && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Participants</label>
                                <input name="participantsCount" type="number" defaultValue={editingProgram?.participantsCount || 0} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none" />
                            </div>
                        )}
                        <div className={`${isGroup ? 'col-span-2' : ''} pt-5 flex items-center`}>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="ml-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Is Group Event?</span>
                            </label>
                        </div>
                    </div>
                    {isGroup && (
                        <div className="grid grid-cols-2 gap-5 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 animate-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Groups Count</label>
                                <input name="groupCount" type="number" defaultValue={editingProgram?.groupCount || 0} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-2xl text-sm outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Per Group Count</label>
                                <input name="membersPerGroup" type="number" defaultValue={editingProgram?.membersPerGroup || 0} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-2xl text-sm outline-none" />
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Dismiss</button>
                        <button type="submit" className="px-12 py-4 bg-indigo-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Save Config</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

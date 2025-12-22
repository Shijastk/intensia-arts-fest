import React, { useState } from 'react';
import { Program } from '../types';

interface ParticipantRegistrationFormProps {
    program: Program;
    onClose: () => void;
    onSubmit: (data: { name: string; chestNumber: string; role?: string }) => void;
}

export const ParticipantRegistrationForm: React.FC<ParticipantRegistrationFormProps> = ({
    program,
    onClose,
    onSubmit
}) => {
    const [name, setName] = useState('');
    const [chestNumber, setChestNumber] = useState('');
    const [role, setRole] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !chestNumber.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        onSubmit({
            name: name.trim(),
            chestNumber: chestNumber.trim(),
            role: role.trim() || undefined
        });

        // Reset form
        setName('');
        setChestNumber('');
        setRole('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-sm font-black uppercase tracking-widest">Add Participant</h3>
                    <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
                        <p className="text-sm font-black text-indigo-900 uppercase">{program.name}</p>
                        <p className="text-xs text-indigo-600 font-medium">{program.category}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Participant Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="Enter participant name"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Chest Number *
                        </label>
                        <input
                            type="text"
                            value={chestNumber}
                            onChange={(e) => setChestNumber(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="Enter chest number"
                            required
                        />
                    </div>

                    {program.isGroup && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Role (Optional)
                            </label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="E.g., Lead, Vocalist, Dancer"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                        >
                            Add Participant
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

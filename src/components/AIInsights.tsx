import React, { useState, useEffect } from 'react';
import { Program } from '../types';
import { generateFestInsights } from '../services/geminiService';

interface AIInsightsProps {
    programs: Program[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ programs }) => {
    const [insights, setInsights] = useState<string>('Analyzing festival data...');
    const [loadingInsights, setLoadingInsights] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            setLoadingInsights(true);
            try {
                const result = await generateFestInsights(programs);
                setInsights(result);
            } catch (error) {
                setInsights("Unable to load insights at this time.");
            } finally {
                setLoadingInsights(false);
            }
        };
        fetchInsights();
    }, [programs.length]);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">AI Analysis Engine</h3>
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                {loadingInsights ? (
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Generating Insights...</p>
                    </div>
                ) : <p className="text-xs font-medium text-slate-700 leading-relaxed italic border-l-2 border-indigo-300 pl-3">"{insights}"</p>}
            </div>
        </div>
    );
};

import React from 'react';

export const MaintenancePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
                <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 text-center max-w-lg w-full">

                {/* Icon/Animation */}
                <div className="w-32 h-32 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl ring-4 ring-slate-800/50">
                    <svg className="w-16 h-16 text-amber-400 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">System Under Maintenance</h1>

                <p className="text-lg text-slate-400 mb-8 font-medium">
                    We're currently upgrading the Arts Fest Portal to make it even better.
                    Please check back shortly.
                </p>

                <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                    <div className="flex items-center gap-4">
                        <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-1/3 animate-progress-indeterminate"></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs font-mono text-slate-500 uppercase tracking-widest">
                        <span>System Status</span>
                        <span className="text-amber-400 font-bold">• Maintenance Mode</span>
                    </div>
                </div>

            </div>

            <div className="fixed bottom-6 text-center w-full text-slate-600 text-xs font-medium">
                &copy; 2025 Arts Fest Admin Pro. All rights reserved.
            </div>

            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                @keyframes progress-indeterminate {
                    0% { width: 0%; margin-left: 0%; }
                    50% { width: 50%; margin-left: 25%; }
                    100% { width: 0%; margin-left: 100%; }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

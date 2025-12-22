import React from 'react';

interface NotificationModalProps {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onClose: () => void;
    confirmText?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
    show,
    type,
    title,
    message,
    onClose,
    confirmText = 'OK'
}) => {
    if (!show) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'info':
                return (
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const getTitleColor = () => {
        switch (type) {
            case 'success': return 'text-emerald-900';
            case 'error': return 'text-rose-900';
            case 'warning': return 'text-amber-900';
            case 'info': return 'text-indigo-900';
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'success': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200';
            case 'error': return 'bg-rose-600 hover:bg-rose-700 shadow-rose-200';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-200';
            case 'info': return 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] p-8 text-center border border-slate-200 animate-in zoom-in-95 duration-200">
                {getIcon()}
                <h3 className={`text-xl font-black mb-3 uppercase tracking-tight ${getTitleColor()}`}>{title}</h3>
                <p className="text-sm text-slate-600 mb-8 leading-relaxed whitespace-pre-line">{message}</p>
                <button
                    onClick={onClose}
                    className={`w-full py-4 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all ${getButtonColor()}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
};

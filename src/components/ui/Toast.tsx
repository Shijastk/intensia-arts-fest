import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // മൾട്ടി-കളർ സ്റ്റൈലുകൾ (സ്ക്രീൻഷോട്ടിലെ പോലെ ഗ്രീൻ അല്ലെങ്കിൽ റഡ്/ഇൻഡിഗോ)
  const themeStyles = {
    success: 'bg-[#00875A] text-white',
    error: 'bg-[#DE350B] text-white',
    info: 'bg-[#0747A6] text-white'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl font-medium text-sm ${themeStyles[type]}`}>
        {/* Success / Status Icon */}
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
          {type === 'success' ? '✓' : '!'}
        </div>

        {/* Message */}
        <span className="pr-2">{message}</span>

        {/* Separator Line */}
        <div className="h-5 w-[1px] bg-white/30 mx-1"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 text-xs font-bold transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
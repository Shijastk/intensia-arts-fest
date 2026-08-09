import React from 'react';
import { Logo } from '../Logo';

export const MarketingFooter: React.FC = () => {
  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#FFFDF8] py-16 border-t-[4px] border-black relative z-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-4 mb-2">
            <Logo className="w-24 h-24" />
            <div className="text-[48px] font-black tracking-tight text-black uppercase mt-2">
              Artflow.
            </div>
          </div>
          <div className="text-[14px] text-black/60 font-bold uppercase tracking-widest">
            Copyright © {new Date().getFullYear()} Festloom. All rights reserved.
          </div>
        </div>
        
        <div className="flex gap-8 text-[16px] font-black text-black tracking-widest uppercase">
          <a href="#hero" onClick={(e) => smoothScroll(e, 'hero')} className="hover:text-[#FF3366] transition-colors">Overview</a>
          <a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="hover:text-[#FF3366] transition-colors">Features</a>
          <a href="#admin" onClick={(e) => smoothScroll(e, 'admin')} className="hover:text-[#FF3366] transition-colors">Admin</a>
          <a href="/#/login" className="hover:text-[#FF3366] transition-colors">Sign In</a>
        </div>
      </div>
    </footer>
  );
};

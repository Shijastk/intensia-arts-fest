import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '../Logo';

export const MarketingNav: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed w-full top-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-[1024px] transition-all duration-500 rounded-full px-8 py-3 flex items-center justify-between gap-12 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer gap-3" onClick={(e) => smoothScroll(e as any, 'hero')}>
            <Logo className="w-16 h-16" />
            <span className="text-[32px] font-black tracking-tight text-black mt-1">
              Artflow.
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            <a href="#hero" onClick={(e) => smoothScroll(e, 'hero')} className="text-[16px] text-black font-black hover:text-[#FF3366] transition-colors tracking-wide uppercase">Overview</a>
            <a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="text-[16px] text-black font-black hover:text-[#FF3366] transition-colors tracking-wide uppercase">Features</a>
            <a href="#admin" onClick={(e) => smoothScroll(e, 'admin')} className="text-[16px] text-black font-black hover:text-[#FF3366] transition-colors tracking-wide uppercase">Admin</a>
            
            <button 
              onClick={() => navigate('/login')}
              className="bg-[#06D6A0] text-black px-6 py-2.5 rounded-full text-[15px] font-black hover:-translate-y-1 transition-transform border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest"
            >
              Sign In
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-black bg-[#FFD166] p-2 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD166]/80 transition-colors">
              {mobileMenuOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu (Light) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#FFFDF8] pt-32 h-screen">
          <div className="px-8 space-y-6 flex flex-col">
            <a href="#hero" onClick={(e) => smoothScroll(e, 'hero')} className="block text-black font-black text-4xl border-b-[3px] border-black pb-4 uppercase tracking-wider">Overview</a>
            <a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="block text-black font-black text-4xl border-b-[3px] border-black pb-4 uppercase tracking-wider">Features</a>
            <a href="#admin" onClick={(e) => smoothScroll(e, 'admin')} className="block text-black font-black text-4xl border-b-[3px] border-black pb-4 uppercase tracking-wider">Admin</a>
            <button 
              onClick={() => navigate('/login')}
              className="mt-8 w-full text-center bg-[#06D6A0] text-black px-6 py-5 rounded-2xl font-black text-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </>
  );
};

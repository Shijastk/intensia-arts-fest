import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, Activity } from 'lucide-react';
import dashboardImg from '../../images/dashboard.png';

export const MarketingHero: React.FC = () => {
  const navigate = useNavigate();

  const smoothScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 flex flex-col justify-center items-center text-center overflow-hidden bg-[#FFFDF8]">
      
      {/* Background Pattern to remove empty feel */}
      <div className="absolute inset-0 opacity-[0.04] z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>

      {/* Decorative Wavy/Squiggly Shapes */}
      <div className="absolute top-24 left-8 w-24 h-24 bg-[#FF90E8] rounded-full border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] opacity-80 hidden lg:block animate-bounce" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-60 right-12 w-20 h-20 bg-[#06D6A0] rounded-lg border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] opacity-80 hidden lg:flex items-center justify-center -rotate-12 animate-pulse">
        <span className="text-3xl font-black">★</span>
      </div>
      <div className="absolute top-48 right-24 w-12 h-12 bg-[#FFD166] rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-80 hidden xl:block"></div>

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Pill Badge */}
        <div data-aos="fade-down" className="inline-flex items-center gap-3 mb-8 px-6 py-2.5 rounded-full border-[3px] border-black bg-[#FFD166] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="w-3 h-3 rounded-full bg-black animate-pulse"></span>
          <span className="text-[14px] font-black tracking-widest uppercase text-black">Introducing Artflow 2.0</span>
        </div>

        {/* Tightly Kerned Headline */}
        <h1 data-aos="fade-up" className="text-[56px] md:text-[76px] lg:text-[96px] font-black tracking-tight leading-[1.05] text-black mb-8 relative">
          The Ultimate <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 text-black">College Arts Fest App.</span>
            <span className="absolute bottom-2 left-0 w-full h-8 bg-[#23B5D3] -rotate-2 -z-0 rounded-lg border-[3px] border-black"></span>
          </span>
        </h1>
        
        {/* Description */}
        <p data-aos="fade-up" data-aos-delay="100" className="text-[20px] md:text-[24px] text-black mb-12 max-w-[850px] mx-auto font-bold tracking-tight leading-relaxed bg-white/40 p-4 rounded-xl border-2 border-black/5 backdrop-blur-sm">
          A complete digital ecosystem built for Indian campuses. Manage off-stage and on-stage programmes, automate zone registrations, enforce unbiased judging via Green Room codes, and publish live leaderboards. No more messy spreadsheets.
        </p>

        {/* CTAs */}
        <div data-aos="fade-up" data-aos-delay="200" className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-28">
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-black text-white px-10 py-4 rounded-full font-black text-[18px] transition-transform hover:-translate-y-1 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            Sign In to Admin
          </button>
          <button 
            onClick={() => smoothScroll('features')}
            className="group w-full sm:w-auto flex items-center justify-center gap-2 text-black bg-[#FF90E8] px-10 py-4 rounded-full font-black text-[18px] transition-transform hover:-translate-y-1 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            See how it works <ChevronRight size={22} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Central Dashboard Mockup with Floating Elements */}
        <div data-aos="fade-up" data-aos-delay="300" className="relative w-full max-w-[1024px] mx-auto">
          
          {/* Floating UI Element Left */}
          <div className="absolute -left-12 top-20 z-20 bg-white p-4 rounded-2xl border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hidden lg:flex items-center gap-4 rotate-[-6deg] hover:rotate-0 transition-transform">
            <div className="w-12 h-12 rounded-full bg-[#EF476F] border-2 border-black flex items-center justify-center text-white">
              <Bell size={20} strokeWidth={3} />
            </div>
            <div className="text-left">
              <div className="text-[12px] font-black uppercase text-black/50">New Score</div>
              <div className="text-[16px] font-black text-black">Dance A+</div>
            </div>
          </div>

          {/* Floating UI Element Right */}
          <div className="absolute -right-16 bottom-24 z-20 bg-white p-4 rounded-2xl border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hidden lg:flex items-center gap-4 rotate-[6deg] hover:rotate-0 transition-transform">
            <div className="text-left">
              <div className="text-[12px] font-black uppercase text-black/50">Live Points</div>
              <div className="text-[18px] font-black text-black">Blue Zone Leads</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#23B5D3] border-2 border-black flex items-center justify-center text-white">
              <Activity size={20} strokeWidth={3} />
            </div>
          </div>

          {/* Main Dashboard Window */}
          <div className="relative rounded-[32px] bg-[#A388EE] border-[4px] border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {/* Mac OS Window Header */}
            <div className="h-14 border-b-[4px] border-black flex items-center px-6 bg-white">
              <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EF476F] border-2 border-black hover:bg-[#EF476F]/80 cursor-pointer"></div>
                <div className="w-4 h-4 rounded-full bg-[#FFD166] border-2 border-black hover:bg-[#FFD166]/80 cursor-pointer"></div>
                <div className="w-4 h-4 rounded-full bg-[#06D6A0] border-2 border-black hover:bg-[#06D6A0]/80 cursor-pointer"></div>
              </div>
              <div className="mx-auto text-sm font-black text-black uppercase tracking-widest hidden sm:block">Artflow Dashboard</div>
              <div className="w-16 hidden sm:block"></div>
            </div>
            {/* Dashboard Image */}
            <div className="relative w-full p-4 sm:p-8 flex items-center justify-center overflow-hidden">
              <img 
                src={dashboardImg} 
                alt="Dashboard Preview" 
                className="w-full h-auto rounded-[16px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-[4px] border-black hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

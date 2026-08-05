import React from 'react';

export const MarketingBentoGrid: React.FC = () => {
  return (
    <section id="bento" className="py-32 relative z-20 bg-[#FFFDF8] overflow-hidden">
      
      {/* Background Grid Pattern to remove empty feel */}
      <div className="absolute inset-0 opacity-[0.05] z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header with Floating Elements */}
        <div className="text-center mb-24 flex flex-col items-center relative" data-aos="fade-up">
          
          <div className="absolute -left-4 -top-8 w-16 h-16 bg-[#23B5D3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg rotate-12 hidden md:block animate-pulse"></div>
          <div className="absolute right-10 bottom-0 w-24 h-12 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center -rotate-12 bg-white hidden md:flex">
             <span className="font-black text-xl">WOW</span>
          </div>

          <div className="inline-block px-6 py-2 rounded-full bg-[#FF90E8] text-black font-black text-[15px] uppercase tracking-widest border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            Smart Features
          </div>
          <h2 className="text-[56px] md:text-[80px] font-black tracking-tight text-black leading-[1.0] relative z-10">
            Streamline your festival <br/>
            with <span className="text-[#4f46e5]">powerful tools.</span>
          </h2>
        </div>

        {/* Bento Grid Layout */}
        <div className="flex flex-col gap-8">
          
          {/* Top Row: 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div data-aos="fade-up" className="bg-[#A388EE] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[420px] group hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="p-8 pb-0 text-white">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Real-Time Analytics</h3>
                <p className="text-[18px] text-white/90 font-bold leading-relaxed">
                  Monitor your zone points live with clear, intuitive dashboards.
                </p>
              </div>
              <div className="flex-1 w-full flex items-end justify-center pt-8 relative overflow-hidden">
                <div className="w-[85%] h-[140px] bg-white rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-[4px] border-b-0 border-black flex items-center justify-center relative transform group-hover:-translate-y-4 transition-transform duration-500">
                  <div className="w-20 h-20 rounded-full border-[6px] border-black border-r-[#FFD166] flex items-center justify-center bg-[#fcfcfd]">
                    <span className="text-black font-black text-3xl">♪</span>
                  </div>
                  <div className="absolute top-[-24px] right-2 bg-[#06D6A0] text-black px-4 py-2 rounded-xl border-[3px] border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[16px] rotate-6 group-hover:rotate-12 transition-transform">
                    1,235 pts
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div data-aos="fade-up" data-aos-delay="100" className="bg-[#FFD166] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[420px] group hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="p-8 pb-0 text-black">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Automated Reports</h3>
                <p className="text-[18px] text-black/80 font-bold leading-relaxed">
                  Generate final score summaries instantly—no manual work needed.
                </p>
              </div>
              <div className="flex-1 w-full flex items-end justify-center px-8 pb-8 relative">
                <div className="w-full h-36 relative flex items-end group-hover:scale-105 transition-transform duration-500 bg-white border-[4px] border-black rounded-[24px] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                    <path d="M0,40 Q20,40 30,30 T50,20 T70,10 T100,5" fill="none" stroke="#EF476F" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="50" cy="20" r="5" fill="#118AB2" className="shadow-lg border-[3px] border-black" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div data-aos="fade-up" data-aos-delay="200" className="bg-[#06D6A0] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[420px] group hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="p-8 pb-0 text-black">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Smart Judging</h3>
                <p className="text-[18px] text-black/80 font-bold leading-relaxed">
                  Automated grade calculation (A/B/C) based on custom rulesets.
                </p>
              </div>
              <div className="flex-1 w-full flex items-center justify-center relative mt-4">
                <div className="relative w-[200px] h-[140px] transform group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute left-0 top-0 w-28 h-28 bg-[#FF90E8] rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-[4px] border-black flex items-center justify-center -rotate-6">
                    <div className="w-14 h-14 rounded-full border-[6px] border-black border-t-white"></div>
                  </div>
                  <div className="absolute right-0 bottom-0 w-28 h-28 bg-white rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-[4px] border-black flex items-center justify-center rotate-6">
                    <div className="w-14 h-14 rounded-full border-[6px] border-black border-l-[#A388EE]"></div>
                    <span className="absolute text-[14px] font-black text-black bg-[#FFD166] px-3 py-1.5 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] top-[-16px] right-[-16px] rotate-12">A+</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 4 */}
            <div data-aos="fade-up" className="bg-[#EF476F] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row items-center p-10 group h-auto md:h-[260px] hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="w-full md:w-3/5 mb-8 md:mb-0 text-white">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Secure Syncing</h3>
                <p className="text-[18px] text-white/90 font-bold leading-relaxed max-w-[90%]">
                  Link multiple stages safely with real-time offline-first data syncing. No dropouts.
                </p>
              </div>
              <div className="w-full md:w-2/5 flex items-center justify-center relative">
                 <div className="w-36 h-36 bg-white rounded-full border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <div className="w-24 h-24 rounded-full border-t-[8px] border-l-[8px] border-black border-r-[8px] border-gray-200 border-dashed transform rotate-45"></div>
                 </div>
              </div>
            </div>

            {/* Card 5 */}
            <div data-aos="fade-up" data-aos-delay="100" className="bg-[#118AB2] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row items-center p-10 group h-auto md:h-[260px] hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="w-full md:w-3/5 mb-8 md:mb-0 text-white">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Performance Score</h3>
                <p className="text-[18px] text-white/90 font-bold leading-relaxed max-w-[90%]">
                  View key metrics and participant trends at a glance.
                </p>
              </div>
              <div className="w-full md:w-2/5 flex items-center justify-center relative">
                 <div className="relative w-40 h-28 flex flex-col items-center justify-end group-hover:scale-110 transition-transform duration-500 bg-white rounded-t-full border-[4px] border-b-0 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
                    <svg viewBox="0 0 100 50" className="w-full overflow-visible absolute top-5 left-0 px-3">
                      <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
                      <path d="M10,50 A40,40 0 0,1 70,15" fill="none" stroke="#FFD166" strokeWidth="12" strokeLinecap="round" />
                    </svg>
                    <span className="text-[44px] font-black text-black z-10 mt-2">98</span>
                 </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

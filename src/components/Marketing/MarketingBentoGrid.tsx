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
            Run your arts fest <br/>
            like a <span className="text-[#4f46e5]">pro.</span>
          </h2>
        </div>

        {/* Bento Grid Layout */}
        <div className="flex flex-col gap-8">
          
          {/* Top Row: 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div data-aos="fade-up" className="bg-[#A388EE] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[420px] group hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="p-8 pb-0 text-white">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Live Zone Standings</h3>
                <p className="text-[18px] text-white/90 font-bold leading-relaxed">
                  Monitor your zone points live with clear, intuitive public dashboards.
                </p>
              </div>
              <div className="flex-1 w-full flex items-end justify-center pt-8 relative overflow-hidden">
                <div className="w-[85%] h-[140px] bg-white rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-[4px] border-b-0 border-black flex items-end justify-center relative transform group-hover:-translate-y-4 transition-transform duration-500 pb-0 gap-3 px-4">
                  {/* 2nd Place */}
                  <div className="w-14 h-[60%] bg-[#23B5D3] border-[4px] border-b-0 border-black rounded-t-lg flex justify-center pt-2">
                     <span className="font-black text-white text-xl">2</span>
                  </div>
                  {/* 1st Place */}
                  <div className="w-16 h-[85%] bg-[#FFD166] border-[4px] border-b-0 border-black rounded-t-lg flex justify-center pt-2 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                     <span className="absolute -top-8 text-4xl drop-shadow-[0_2px_0_rgba(0,0,0,1)]">👑</span>
                     <span className="font-black text-black text-xl">1</span>
                  </div>
                  {/* 3rd Place */}
                  <div className="w-14 h-[40%] bg-[#EF476F] border-[4px] border-b-0 border-black rounded-t-lg flex justify-center pt-2">
                     <span className="font-black text-white text-xl">3</span>
                  </div>
                  
                  <div className="absolute top-[-20px] right-2 bg-[#06D6A0] text-black px-3 py-1.5 rounded-xl border-[3px] border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[14px] rotate-6 group-hover:rotate-12 transition-transform z-20">
                    1,235 pts
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div data-aos="fade-up" data-aos-delay="100" className="bg-[#FFD166] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[420px] group hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="p-8 pb-0 text-black">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Automated Results</h3>
                <p className="text-[18px] text-black/80 font-bold leading-relaxed">
                  Generate final score summaries and winner lists instantly—no manual tallying needed.
                </p>
              </div>
              <div className="flex-1 w-full flex items-end justify-center px-8 pb-8 relative">
                <div className="w-48 h-[140px] relative flex flex-col justify-center gap-3 group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500 bg-white border-[4px] border-black rounded-[20px] p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  {/* Header line */}
                  <div className="w-1/2 h-3 bg-gray-200 rounded-full mb-1"></div>
                  {/* Winner 1 */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FFD166] border-2 border-black flex items-center justify-center flex-shrink-0 text-xs font-black">1</div>
                    <div className="w-full h-3 bg-gray-200 rounded-full"></div>
                  </div>
                  {/* Winner 2 */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#A388EE] border-2 border-black flex items-center justify-center flex-shrink-0 text-xs font-black text-white">2</div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded-full"></div>
                  </div>
                  {/* Seal */}
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#06D6A0] rounded-full border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12 group-hover:rotate-[24deg] transition-transform">
                     <span className="text-xl">🏆</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div data-aos="fade-up" data-aos-delay="200" className="bg-[#06D6A0] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[420px] group hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="p-8 pb-0 text-black">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Smart Grading</h3>
                <p className="text-[18px] text-black/80 font-bold leading-relaxed">
                  Automated grade calculation (A, B, C) based on your college's specific rulesets.
                </p>
              </div>
              <div className="flex-1 w-full flex items-center justify-center relative mt-4">
                <div className="relative w-[160px] h-[140px] transform group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                  <div className="absolute w-[120px] h-[140px] bg-[#FF90E8] rounded-xl border-[4px] border-black -rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
                  <div className="absolute w-[120px] h-[140px] bg-white rounded-xl border-[4px] border-black rotate-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative">
                    <span className="text-[64px] font-black text-[#EF476F] leading-none">A</span>
                    <span className="absolute top-2 right-3 text-[32px] font-black text-[#EF476F]">+</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full mt-2"></div>
                    <div className="w-12 h-2 bg-gray-200 rounded-full mt-2"></div>
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
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Secure Multi-Stage Syncing</h3>
                <p className="text-[18px] text-white/90 font-bold leading-relaxed max-w-[90%]">
                  Link multiple stages safely with real-time offline-first data syncing. No dropouts even during bad network.
                </p>
              </div>
              <div className="w-full md:w-2/5 flex items-center justify-center relative">
                 <div className="flex items-center justify-center gap-3 group-hover:scale-110 transition-transform duration-500 relative w-full h-full min-h-[140px]">
                    {/* Device 1 */}
                    <div className="w-16 h-24 bg-white rounded-xl border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 flex flex-col gap-2 -rotate-12 z-10">
                       <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                       <div className="w-3/4 h-2 bg-gray-200 rounded-full"></div>
                       <div className="mt-auto w-full h-6 bg-[#06D6A0] rounded-sm border-2 border-black"></div>
                    </div>
                    
                    {/* Sync Arrows */}
                    <div className="w-12 h-12 bg-[#FFD166] rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-20 group-hover:rotate-180 transition-transform duration-700">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                    </div>
                    
                    {/* Device 2 */}
                    <div className="w-16 h-24 bg-white rounded-xl border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 flex flex-col gap-2 rotate-12 z-10">
                       <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                       <div className="w-3/4 h-2 bg-gray-200 rounded-full"></div>
                       <div className="mt-auto w-full h-6 bg-[#06D6A0] rounded-sm border-2 border-black"></div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Card 5 */}
            <div data-aos="fade-up" data-aos-delay="100" className="bg-[#118AB2] rounded-[40px] border-[4px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row items-center p-10 group h-auto md:h-[260px] hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
              <div className="w-full md:w-3/5 mb-8 md:mb-0 text-white">
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Participant Tracking</h3>
                <p className="text-[18px] text-white/90 font-bold leading-relaxed max-w-[90%]">
                  View individual performance scores and overall trends at a single glance.
                </p>
              </div>
              <div className="w-full md:w-2/5 flex items-center justify-center relative">
                 <div className="w-56 h-24 bg-white rounded-2xl border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-row items-center gap-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 relative mt-4 md:mt-0">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-[#A388EE] rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden flex-shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    {/* Details */}
                    <div className="flex flex-col gap-1.5 flex-1">
                       <div className="w-full h-2.5 bg-gray-200 rounded-full"></div>
                       <div className="w-1/2 h-2.5 bg-gray-200 rounded-full"></div>
                       {/* Score */}
                       <div className="mt-1 flex items-baseline gap-1">
                          <span className="font-black text-2xl text-[#EF476F] leading-none">98</span>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">pts</span>
                       </div>
                    </div>
                    
                    <div className="absolute -top-4 -right-4 bg-[#FFD166] w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12 group-hover:rotate-[24deg] transition-transform">
                      <span className="text-xl">⭐</span>
                    </div>
                 </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

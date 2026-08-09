import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminFeatureShowcase: React.FC = () => {
  const contentList = [
    {
      id: 'roles',
      label: 'Role-Based Access',
      title: 'Uncompromising Security.',
      sub1Title: 'GRANULAR PERMISSIONS',
      sub1Text: 'Assign strict, scoped access to Green Room Officers, Convenors, and Judges. No one sees more than they need to.',
      sub2Title: 'AUDIT TRAILS',
      sub2Text: 'Every score entry and Green Room check-in is logged with timestamps and user IDs for total accountability.',
      bgColor: 'bg-[#FF90E8]',
      textColor: 'text-black',
      accentColor: 'bg-white',
      tagColor: 'bg-black text-white',
      customUI: (
        <div className="w-full h-full flex items-center justify-center bg-[#fdf2f8] relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
           <div className="w-64 bg-white rounded-2xl border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-3">
                 <div className="w-10 h-10 bg-[#FF90E8] rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-xl">🛡️</span>
                 </div>
                 <div>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mb-2"></div>
                    <div className="w-12 h-2 bg-gray-200 rounded-full"></div>
                 </div>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-2 border-transparent hover:border-black transition-colors cursor-pointer">
                 <div className="w-24 h-2 bg-gray-300 rounded-full"></div>
                 <div className="w-10 h-5 bg-[#06D6A0] rounded-full border-2 border-black relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white border border-black rounded-full"></div>
                 </div>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-2 border-transparent hover:border-black transition-colors cursor-pointer">
                 <div className="w-20 h-2 bg-gray-300 rounded-full"></div>
                 <div className="w-10 h-5 bg-gray-200 rounded-full border-2 border-black relative">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white border border-black rounded-full"></div>
                 </div>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-2 border-transparent hover:border-black transition-colors cursor-pointer">
                 <div className="w-28 h-2 bg-gray-300 rounded-full"></div>
                 <div className="w-10 h-5 bg-[#06D6A0] rounded-full border-2 border-black relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white border border-black rounded-full"></div>
                 </div>
              </div>
           </div>
        </div>
      )
    },
    {
      id: 'portals',
      label: 'Zone/House Management',
      title: 'Team Management.',
      sub1Title: 'DEDICATED LOGINS',
      sub1Text: 'Give zone leaders their own secure portals to manage their team\'s registrations and view real-time performance.',
      sub2Title: 'PAPERLESS REGISTRATION',
      sub2Text: 'Drop the messy Excel sheets. Participants are imported, verified, and assigned chest numbers natively in the system.',
      bgColor: 'bg-[#23B5D3]',
      textColor: 'text-black',
      accentColor: 'bg-white',
      tagColor: 'bg-black text-white',
      customUI: (
        <div className="w-full h-full flex items-center justify-center bg-[#ecfeff] relative overflow-hidden group-hover:scale-105 transition-transform duration-700 p-6">
           <div className="w-full max-w-[280px] bg-white rounded-2xl border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 relative z-10 -rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-24 h-3 bg-gray-200 rounded-full"></div>
                 <div className="w-8 h-8 bg-[#23B5D3] rounded-full border-2 border-black flex items-center justify-center text-white text-xs font-black">Z1</div>
              </div>
              <div className="flex flex-col gap-3">
                 <div className="w-full p-2 border-2 border-black rounded-lg flex items-center gap-2 bg-[#f8fafc]">
                    <div className="w-6 h-6 rounded-full bg-gray-200 border border-black"></div>
                    <div className="flex-1 w-full h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-12 h-4 bg-[#FFD166] rounded border border-black"></div>
                 </div>
                 <div className="w-full p-2 border-2 border-black rounded-lg flex items-center gap-2 bg-[#f8fafc]">
                    <div className="w-6 h-6 rounded-full bg-gray-200 border border-black"></div>
                    <div className="flex-1 w-full h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-12 h-4 bg-[#06D6A0] rounded border border-black"></div>
                 </div>
                 <div className="w-full p-2 border-2 border-black rounded-lg flex items-center gap-2 bg-[#f8fafc]">
                    <div className="w-6 h-6 rounded-full bg-gray-200 border border-black"></div>
                    <div className="flex-1 w-full h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-12 h-4 bg-[#FF90E8] rounded border border-black"></div>
                 </div>
              </div>
           </div>
           <div className="absolute bottom-4 right-6 w-24 h-28 bg-[#FFD166] rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-12 z-0 flex flex-col items-center justify-center opacity-90">
              <div className="text-4xl mb-2">📁</div>
              <div className="w-12 h-2 bg-black/20 rounded-full"></div>
           </div>
        </div>
      )
    },
    {
      id: 'sync',
      label: 'Cloud-Synced Speed',
      title: 'Real-Time Sync.',
      sub1Title: 'INSTANT UPDATES',
      sub1Text: 'The moment a judge submits a score on their tablet, it reflects on the convenor dashboard and public tracker instantly.',
      sub2Title: 'OFFLINE RESILIENCY',
      sub2Text: 'If the network drops, scores are cached locally on the device and automatically synced the millisecond connection is restored.',
      bgColor: 'bg-[#FFD166]',
      textColor: 'text-black',
      accentColor: 'bg-white',
      tagColor: 'bg-black text-black',
      customUI: (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#fffbeb] relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
           {/* Desktop Dashboard */}
           <div className="w-[60%] min-w-[200px] h-32 bg-white rounded-t-xl border-[3px] border-b-0 border-black shadow-[0_-8px_0px_0px_rgba(0,0,0,0.15)] p-4 absolute bottom-0 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 mb-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-black"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black"></div>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full mb-3"></div>
              <div className="flex gap-2 h-12">
                 <div className="w-1/2 h-full bg-gray-100 rounded-md border-2 border-gray-200"></div>
                 <div className="w-1/2 h-full bg-[#06D6A0]/20 rounded-md border-2 border-[#06D6A0] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#06D6A0]/20 animate-pulse"></div>
                    <div className="w-8 h-2.5 bg-[#06D6A0] rounded-full relative z-10"></div>
                 </div>
              </div>
           </div>
           
           {/* Cloud / Sync */}
           <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-10 group-hover:rotate-180 transition-transform duration-1000">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
           </div>

           {/* Mobile/Tablet */}
           <div className="absolute right-6 top-6 w-24 h-36 bg-white rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-12 flex flex-col p-2.5 group-hover:-rotate-12 transition-transform duration-500 z-20">
              <div className="w-full h-16 bg-gray-50 rounded-xl border-2 border-black mb-auto flex items-center justify-center">
                 <span className="text-2xl font-black text-[#FFD166]">98</span>
              </div>
              <div className="w-full h-8 bg-[#06D6A0] rounded-xl border-2 border-black mt-2 flex items-center justify-center">
                 <div className="w-6 h-1.5 bg-white rounded-full opacity-80"></div>
              </div>
           </div>
        </div>
      )
    }
  ];

  return (
    <section id="admin" className="py-24 bg-[#FFFDF8] relative z-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#06D6A0] text-black text-[13px] font-black tracking-widest uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Zap size={16} strokeWidth={3} /> Built For Admins
          </div>
          <h2 className="text-[48px] md:text-[64px] font-black tracking-tight text-black leading-[1.05]">
            Fest operations made <br/>
            <span className="text-[#4f46e5]">incredibly smooth.</span>
          </h2>
        </div>

        {/* Stacked Cards Layout */}
        <div className="flex flex-col gap-12">
          {contentList.map((content, index) => (
            <div 
              key={content.id}
              className={`rounded-[40px] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 ${content.bgColor}`}
              data-aos="fade-up"
            >
              <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-16 items-center`}>
                
                {/* Image/UI Mockup */}
                <div className="w-full lg:w-1/2">
                  <div className="w-full aspect-[4/3] rounded-[24px] bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center group p-0">
                    {content.customUI}
                  </div>
                </div>

                {/* Details */}
                <div className="w-full lg:w-1/2 flex flex-col gap-6">
                  <div>
                    <span className={`inline-block px-4 py-1.5 rounded-full ${content.tagColor} text-[12px] font-black tracking-widest uppercase border-2 border-current mb-4`}>
                      {content.label}
                    </span>
                    <h3 className={`text-[36px] md:text-[48px] font-black ${content.textColor} leading-tight mb-2`}>
                      {content.title}
                    </h3>
                  </div>
                  
                  <div className={`relative ${content.accentColor} border-2 border-black rounded-[24px] p-6 overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                    <h5 className="flex items-center gap-3 text-[15px] font-black text-black mb-2 uppercase tracking-wider">
                      {content.sub1Title}
                    </h5>
                    <p className="text-[16px] text-black/80 font-medium leading-relaxed">
                      {content.sub1Text}
                    </p>
                  </div>
                  
                  <div className={`relative ${content.accentColor} border-2 border-black rounded-[24px] p-6 overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                    <h5 className="flex items-center gap-3 text-[15px] font-black text-black mb-2 uppercase tracking-wider">
                      {content.sub2Title}
                    </h5>
                    <p className="text-[16px] text-black/80 font-medium leading-relaxed">
                      {content.sub2Text}
                    </p>
                  </div>
                  
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Global CTA for Admin */}
        <div className="mt-16 flex justify-center" data-aos="fade-up">
          <Link to="/login" className="flex items-center justify-center gap-3 bg-black hover:bg-black/80 text-white px-10 py-5 rounded-full font-black text-[18px] transition-all border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1">
            Explore Admin Dashboard <ArrowRight size={24} strokeWidth={3} />
          </Link>
        </div>

      </div>
    </section>
  );
};

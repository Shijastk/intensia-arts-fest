import React from 'react';
import { ArrowRight, Fingerprint, TabletSmartphone, Trophy, Users, ShieldAlert } from 'lucide-react';
import dashboardImg from '../../images/dashboard.png';

export const MarketingSplitFeatures: React.FC = () => {
  const features = [
    {
      id: 'admin',
      tag: 'FEST MANAGEMENT',
      title: 'Complete Control.',
      description: 'The ultimate admin dashboard. Manage hundreds of off-stage and on-stage programmes, register student teams across zones, and oversee the entire festival from a single command centre.',
      bullets: [
        'Centralised fest configuration',
        'One-click score data exports'
      ],
      image: '/images/admin.png',
      device: 'desktop',
      bgColor: 'bg-[#FFD166]', // Vibrant Yellow
      textColor: 'text-black',
      tagColor: 'bg-black text-white',
      icon: <ShieldAlert size={20} />,
      topOffset: 'top-[100px]',
      zIndex: 'z-10',
      rotate: '-rotate-1'
    },
    {
      id: 'team_leader',
      tag: 'ZONE/HOUSE MANAGEMENT',
      title: 'Team Leader Portals.',
      description: 'Empower Zone/House Captains with their own dedicated portals to assign participants, manage rosters, and track their team\'s performance securely.',
      bullets: [
        'Secure participant roster management',
        'Direct event assignments by captains'
      ],
      image: '/images/team_leader.png',
      device: 'desktop',
      bgColor: 'bg-[#23B5D3]', // Vibrant Blue
      textColor: 'text-white',
      tagColor: 'bg-white text-black',
      icon: <Users size={20} />,
      topOffset: 'top-[140px]',
      zIndex: 'z-20',
      rotate: 'rotate-1'
    },
    {
      id: 'greenroom',
      tag: 'UNBIASED COMPETITION',
      title: 'The Green Room.',
      description: 'The system verifies participant chest numbers and securely assigns random codes so judges have absolutely zero identity bias during stage events.',
      bullets: [
        'Eliminate judging bias instantly',
        'Seamless backstage verification workflow'
      ],
      image: '/images/greenroom.png',
      device: 'desktop',
      bgColor: 'bg-[#FF90E8]', // Vibrant Pink
      textColor: 'text-black',
      tagColor: 'bg-black text-white',
      icon: <Fingerprint size={20} />,
      topOffset: 'top-[180px]',
      zIndex: 'z-30',
      rotate: '-rotate-1'
    },
    {
      id: 'judges',
      tag: 'PAPERLESS SCORING',
      title: 'Digital Tablets.',
      description: 'Judges score directly on digital tablets using the anonymous Green Room codes, dropping manual paperwork forever with instant, error-free automated grading.',
      bullets: [
        'Automatic grade compilation (A/B/C)',
        '100% paperless score submission'
      ],
      image: '/images/judges.png',
      device: 'tablet',
      bgColor: 'bg-[#06D6A0]', // Vibrant Green
      textColor: 'text-black',
      tagColor: 'bg-black text-white',
      icon: <TabletSmartphone size={20} />,
      topOffset: 'top-[220px]',
      zIndex: 'z-40',
      rotate: 'rotate-1'
    },
    {
      id: 'leaderboard',
      tag: 'LIVE RESULTS',
      title: 'Public Leaderboards.',
      description: 'Watch the action unfold live. As judges submit scores, points are calculated and zone leaderboards are updated instantly for the entire college to see.',
      bullets: [
        'Instant public standings & results',
        'Detailed zone and individual analytics'
      ],
      image: dashboardImg, // Using dashboardImg wrapped in desktop frame as fallback
      device: 'desktop',
      bgColor: 'bg-white', // Clean White
      textColor: 'text-black',
      tagColor: 'bg-black text-white',
      icon: <Trophy size={20} />,
      topOffset: 'top-[260px]',
      zIndex: 'z-50',
      rotate: '-rotate-1'
    }
  ];

  return (
    <section id="features" className="py-24 lg:py-32 bg-[#FFFDF8] relative z-20">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6">
        
        <div data-aos="fade-up" className="mb-20">
          <h2 className="text-[48px] md:text-[64px] font-black text-black leading-[1.05] tracking-tight max-w-[800px]">
            Every Role Covered. <br />
            <span className="text-slate-400">Total Fest Automation.</span>
          </h2>
        </div>

        <div className="relative">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className={`sticky ${feature.topOffset} ${feature.zIndex} w-full flex flex-col lg:flex-row items-center gap-0 lg:gap-8 rounded-[40px] ${feature.bgColor} p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-[4px] border-black mb-12 last:mb-0 transition-transform duration-500 ease-out hover:${feature.rotate}`}
            >
              
              {/* Text Side */}
              <div className={`w-full lg:w-1/2 flex flex-col justify-center ${feature.textColor}`}>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-[3px] border-current shadow-[4px_4px_0px_0px_currentColor] bg-white/20 backdrop-blur-md`}>
                    {feature.icon}
                  </div>
                  <span className={`text-[12px] font-black tracking-widest uppercase px-4 py-2 rounded-full border-[3px] border-current shadow-[4px_4px_0px_0px_currentColor] ${feature.tagColor}`}>
                    {feature.tag}
                  </span>
                </div>
                
                <h3 className="text-[36px] md:text-[48px] font-black tracking-tight mb-4 leading-[1.05]">
                  {feature.title}
                </h3>
                <p className="text-[16px] md:text-[18px] opacity-95 leading-relaxed mb-8 font-bold max-w-[90%] bg-black/5 p-4 rounded-xl border-l-4 border-current">
                  {feature.description}
                </p>
                
                <div className="space-y-4">
                  {feature.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border-2 border-current shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 border-2 border-current shadow-[2px_2px_0px_0px_currentColor]">
                        <ArrowRight size={16} strokeWidth={4} />
                      </div>
                      <span className="text-[16px] font-black">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Side - CSS Device Mockups */}
              <div className="w-full lg:w-1/2 mt-8 lg:mt-0 relative">
                {/* Image Decorator */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white rounded-full border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-12 z-20 hidden lg:flex">
                   <span className="text-4xl font-black text-[#FF3366]">!</span>
                </div>
                
                {feature.device === 'desktop' && (
                  <div className="relative w-full aspect-[16/10] rounded-t-xl rounded-b-md border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-slate-800 overflow-hidden group">
                     <div className="w-full h-7 bg-slate-900 border-b-[3px] border-black flex items-center px-3 gap-1.5 z-10 relative">
                         <div className="w-3 h-3 rounded-full bg-[#FF3366] border-2 border-black"></div>
                         <div className="w-3 h-3 rounded-full bg-[#FFD166] border-2 border-black"></div>
                         <div className="w-3 h-3 rounded-full bg-[#06D6A0] border-2 border-black"></div>
                     </div>
                     <div className="relative w-full h-[calc(100%-1.75rem)] overflow-hidden bg-white">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none"></div>
                        <img src={feature.image} alt={feature.title} className="w-full h-full object-cover object-left-top scale-105 group-hover:scale-100 transition-transform duration-700" />
                     </div>
                  </div>
                )}

                {feature.device === 'tablet' && (
                  <div className="relative mx-auto w-[85%] md:w-[75%] aspect-[3/4] lg:aspect-[4/3] rounded-[2rem] border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-slate-900 p-3 md:p-4 overflow-hidden group">
                     <div className="absolute top-1/2 lg:top-4 left-4 lg:left-1/2 transform lg:-translate-x-1/2 -translate-y-1/2 lg:translate-y-0 w-2 h-2 rounded-full bg-slate-700 border border-black z-20"></div>
                     <div className="relative w-full h-full rounded-[1.25rem] border-[3px] border-black overflow-hidden bg-white">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none"></div>
                        <img src={feature.image} alt={feature.title} className="w-full h-full object-cover object-left-top scale-105 group-hover:scale-100 transition-transform duration-700" />
                     </div>
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

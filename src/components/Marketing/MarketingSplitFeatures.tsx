import React from 'react';
import { ArrowRight, Fingerprint, TabletSmartphone, Trophy } from 'lucide-react';
import dashboardImg from '../../images/dashboard.png';

export const MarketingSplitFeatures: React.FC = () => {
  const features = [
    {
      id: 'greenroom',
      tag: 'IDENTITY PROTECTION',
      title: 'Total Anonymity.',
      description: 'System verifies chest numbers and securely assigns a random code so judges have zero identity bias.',
      bullets: [
        'Eliminate judging bias instantly',
        'Instant desk verification workflow'
      ],
      image: dashboardImg,
      bgColor: 'bg-[#FF90E8]', // Vibrant Pink
      textColor: 'text-black',
      tagColor: 'bg-black text-white',
      icon: <Fingerprint size={20} />,
      topOffset: 'top-[120px]',
      zIndex: 'z-10',
      rotate: '-rotate-1'
    },
    {
      id: 'judges',
      tag: 'SPEED UP SCORING',
      title: 'Digital Tablets.',
      description: 'Judges score directly on iPads, dropping manual paperwork forever with instant automated grading.',
      bullets: [
        'Automatic grade compilation',
        '100% paperless submission'
      ],
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#23B5D3]', // Vibrant Blue
      textColor: 'text-white',
      tagColor: 'bg-white text-black',
      icon: <TabletSmartphone size={20} />,
      topOffset: 'top-[160px]',
      zIndex: 'z-20',
      rotate: 'rotate-1'
    },
    {
      id: 'leaderboard',
      tag: 'REAL-TIME TRACKING',
      title: 'Live Leaderboards.',
      description: 'Watch the action unfold live. As judges submit scores, points are calculated and leaderboards are updated instantly.',
      bullets: [
        'Instant public standings',
        'Detailed zone analytics'
      ],
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#FFD166]', // Vibrant Yellow
      textColor: 'text-black',
      tagColor: 'bg-black text-white',
      icon: <Trophy size={20} />,
      topOffset: 'top-[200px]',
      zIndex: 'z-30',
      rotate: '-rotate-1'
    }
  ];

  return (
    <section id="features" className="pt-24 pb-8 relative z-20 bg-[#FFFDF8]">
      
      {/* Background Pattern to remove empty feel */}
      <div className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Top Header Section with Floating Elements */}
        <div className="text-center mb-20 max-w-4xl mx-auto relative" data-aos="fade-up">
          
          {/* Floating Decorators */}
          <div className="absolute -left-12 -top-12 w-20 h-20 bg-[#FFD166] rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-12 hidden md:flex">
             <span className="text-3xl font-black">★</span>
          </div>
          <div className="absolute -right-8 bottom-0 w-16 h-16 bg-[#06D6A0] rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center -rotate-12 hidden md:flex">
             <ArrowRight size={24} strokeWidth={4} />
          </div>

          <div className="inline-flex items-center gap-2 mb-6">
            <span className="px-5 py-2 rounded-full bg-[#FFD166] text-black text-[13px] font-black tracking-widest uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[3px] border-black">
              Powerful Operations
            </span>
          </div>
          <h2 className="text-[48px] md:text-[64px] font-black tracking-tight text-black leading-[1.05] mb-6 relative z-10">
            Everything you need to <br/><span className="text-[#4f46e5]">run your festival.</span>
          </h2>
          <p className="text-[18px] text-black/80 font-bold leading-relaxed max-w-2xl mx-auto bg-white/50 p-4 rounded-xl border-2 border-black/10 backdrop-blur-sm">
            Say goodbye to chaotic spreadsheets and paper trails. Manage greenrooms, live judging, and real-time scores all from one vibrant platform.
          </p>
        </div>

        {/* Stacking Cards Layout ("Top by Top") */}
        <div className="relative pb-12">
          {features.map((feature, index) => (
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

              {/* Image Side */}
              <div className="w-full lg:w-1/2 mt-8 lg:mt-0 relative">
                {/* Image Decorator */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white rounded-full border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-12 z-10 hidden lg:flex">
                   <span className="text-4xl font-black text-[#FF3366]">!</span>
                </div>
                
                <div className="relative w-full aspect-[16/10] rounded-[24px] overflow-hidden border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white group">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700"
                  />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};


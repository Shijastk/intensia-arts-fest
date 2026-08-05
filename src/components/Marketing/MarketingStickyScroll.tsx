import React from 'react';
import { ShieldCheck, Smartphone, Trophy, Zap, Lock, BarChart3 } from 'lucide-react';

export const MarketingStickyScroll: React.FC = () => {
  const features = [
    {
      id: 'greenroom',
      title: 'Total Anonymity',
      description: 'Candidates are assigned secret codes like #A-104 at the registration desk. Zero identity bias on stage, ensuring 100% fair judging.',
      bullets: [
        { text: 'Eliminate judging bias instantly', icon: <Lock size={16} /> },
        { text: 'Instant desk verification workflow', icon: <ShieldCheck size={16} /> }
      ],
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-[#FF3366] to-[#FF9933]'
    },
    {
      id: 'judges',
      title: 'Digital Tablet Scoring',
      description: 'Judges score candidates directly on iPads with large sliders, dropping manual paperwork forever. Instant automated grading.',
      bullets: [
        { text: 'Automatic grade compilation (A/B/C)', icon: <BarChart3 size={16} /> },
        { text: 'Smart tie-breaker alerts', icon: <Zap size={16} /> }
      ],
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      id: 'tracker',
      title: 'Live Public Tracker',
      description: 'Keep the audience completely engaged. Parents and students can view the live stage progress and zone standings from their phones.',
      bullets: [
        { text: 'Real-time zone points updates', icon: <Trophy size={16} /> },
        { text: 'Live stage status (Live Now/Next)', icon: <Zap size={16} /> }
      ],
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-[#FF9933] to-orange-500'
    }
  ];

  return (
    <section id="features" className="py-24 relative z-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative">
        
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left Side: Sticky Text Area */}
          <div className="w-full lg:w-5/12 lg:sticky lg:top-32 lg:h-[calc(100vh-200px)] flex flex-col justify-center">
            <div data-aos="fade-right">
              <h2 className="text-[40px] md:text-[56px] font-bold tracking-tight text-[#1d1d1f] leading-[1.05] mb-6">
                Take back control of your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Festival Operations.</span>
              </h2>
              <p className="text-[18px] text-[#6e6e73] font-medium leading-relaxed mb-10 max-w-[400px]">
                A unified ecosystem that replaces Excel sheets and paper forms with powerful, real-time cloud workflows.
              </p>
              
              <div className="flex flex-col gap-6">
                {/* Interactive-looking list like the Loom/Strategy reference */}
                {features.map((feature, i) => (
                  <div key={feature.id} className="p-4 rounded-2xl border border-black/5 bg-gray-50/50 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                    <span className="font-semibold text-[#1d1d1f]">{feature.title}</span>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-black/5 group-hover:scale-110 transition-transform">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Scrolling Glowing Cards */}
          <div className="w-full lg:w-7/12 flex flex-col gap-24 pt-10 pb-32">
            {features.map((feature, index) => (
              <div key={feature.id} className="w-full" data-aos="fade-up">
                
                {/* The Glowing Gradient Card container (Seamless.ai style) */}
                <div className={`w-full p-8 md:p-12 rounded-[40px] bg-gradient-to-br ${feature.gradient} relative shadow-2xl`}>
                  {/* Subtle inner blur for glowing effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-50 blur-xl rounded-[40px] -z-10`}></div>
                  
                  <div className="bg-white/95 backdrop-blur-md rounded-[24px] p-8 shadow-xl border border-white/20">
                    <h3 className="text-[28px] font-bold text-[#1d1d1f] mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-[16px] text-[#6e6e73] leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    
                    <div className="space-y-4 mb-8">
                      {feature.bullets.map((bullet, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`text-transparent bg-clip-text bg-gradient-to-br ${feature.gradient}`}>
                            {bullet.icon}
                          </div>
                          <span className="text-[14px] font-semibold text-[#1d1d1f]">{bullet.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Image Mockup container */}
                    <div className="w-full aspect-[4/3] rounded-[16px] overflow-hidden border border-black/5 shadow-inner">
                      <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
      
      {/* Lucide icon import helper */}
      <div className="hidden"><ChevronRight /></div>
    </section>
  );
};

// Extracted ChevronRight since it was missing from the import list
const ChevronRight = ({ size = 24, strokeWidth = 2, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

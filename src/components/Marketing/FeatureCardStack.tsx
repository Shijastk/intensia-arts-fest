import React from 'react';
import { ShieldCheck, Smartphone, Trophy, CheckCircle2, Zap, Lock, BarChart3 } from 'lucide-react';

export const FeatureCardStack: React.FC = () => {
  const features = [
    {
      id: 'greenroom',
      title: 'Identity Protection & Greenroom',
      description: 'Ensure a perfectly fair competition. When candidates arrive, the system verifies their chest number and securely assigns a random, secret code.',
      bullets: [
        { text: 'Eliminate judging bias instantly', icon: <Lock size={16} /> },
        { text: 'Instant desk verification workflow', icon: <ShieldCheck size={16} /> },
        { text: 'Seamless stage queue management', icon: <Zap size={16} /> }
      ],
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      topOffset: 'top-[120px]',
      bgGradient: 'from-[#FF3366]/20 to-[#FF9933]/20',
      accent: 'text-[#FF3366]'
    },
    {
      id: 'judges',
      title: 'Digital Scoring for Judges',
      description: 'Judges score candidates directly on iPads with large sliders, dropping manual paperwork forever. Instant automated grading based on your exact rules.',
      bullets: [
        { text: 'Automatic grade compilation (A/B/C)', icon: <BarChart3 size={16} /> },
        { text: 'Smart tie-breaker alerts', icon: <Zap size={16} /> },
        { text: '100% paperless submission', icon: <ShieldCheck size={16} /> }
      ],
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
      topOffset: 'top-[150px]',
      bgGradient: 'from-blue-500/20 to-purple-500/20',
      accent: 'text-blue-500'
    },
    {
      id: 'leaderboard',
      title: 'Live Public Tracker',
      description: 'Keep the audience completely engaged. Parents and students can view the live stage progress and zone standings right from their phones.',
      bullets: [
        { text: 'Real-time zone points updates', icon: <Trophy size={16} /> },
        { text: 'Live stage status (Live Now/Next Up)', icon: <Zap size={16} /> },
        { text: 'Download official signed PDFs', icon: <Lock size={16} /> }
      ],
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      topOffset: 'top-[180px]',
      bgGradient: 'from-[#FF9933]/20 to-orange-500/20',
      accent: 'text-[#FF9933]'
    }
  ];

  return (
    <section id="features" className="py-24 relative z-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-24" data-aos="fade-up">
          <h2 className="text-[40px] md:text-[56px] font-bold tracking-tight text-[#1d1d1f] mb-6">
            Everything you need. <br/> <span className="text-[#86868b]">Stacked beautifully.</span>
          </h2>
        </div>

        <div className="relative pb-32">
          {features.map((feature, index) => {
            const isReverse = index % 2 !== 0;
            return (
              <div 
                key={feature.id}
                className={`sticky ${feature.topOffset} w-full rounded-[40px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-black/5 overflow-hidden transition-all duration-500 mb-12 flex flex-col md:flex-row ${isReverse ? 'md:flex-row-reverse' : ''}`}
                style={{ zIndex: 10 + index, minHeight: '480px' }}
              >
                
                {/* Text Content Side */}
                <div className="w-full md:w-[45%] p-10 md:p-16 flex flex-col justify-center">
                  <h3 className="text-[36px] md:text-[44px] font-bold tracking-tight text-[#1d1d1f] mb-6 leading-[1.1]">{feature.title}</h3>
                  <p className="text-[18px] text-[#515154] font-medium leading-relaxed mb-10">
                    {feature.description}
                  </p>
                  
                  <div className="space-y-5">
                    {feature.bullets.map((bullet, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center ${feature.accent}`}>
                          {bullet.icon}
                        </div>
                        <span className="text-[16px] font-semibold text-[#1d1d1f]">{bullet.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Image Container Side with Glow */}
                <div className="w-full md:w-[55%] p-6 md:p-8 flex items-center justify-center">
                  {/* Glowing Backdrop Container */}
                  <div className={`w-full h-full min-h-[300px] md:min-h-[400px] rounded-[32px] bg-gradient-to-br ${feature.bgGradient} p-8 flex items-center justify-center relative overflow-hidden group`}>
                    
                    {/* Inner glowing blur */}
                    <div className={`absolute inset-0 opacity-50 blur-3xl bg-gradient-to-tr ${feature.bgGradient}`}></div>

                    {/* Placeholder for the actual UI Image */}
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="relative z-10 w-full max-w-[90%] h-auto rounded-[16px] shadow-2xl border border-white/20 transform group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

import React from 'react';
import { Trophy, BarChart3, Fingerprint } from 'lucide-react';

const featureData = [
  {
    icon: <Trophy size={32} className="text-black" />,
    heading: "Real-Time Leaderboards",
    paragraph: 'Instant score calculation, zone standings, and live Kala & Sarga Prathibha updates as results are declared.',
    cardBg: "bg-[#FDEB71]", // Vibrant Yellow
    chipText: "Live Scores",
    chipBg: "bg-white",
  },
  {
    icon: <BarChart3 size={32} className="text-black" />,
    heading: "Zone & Stage Insights",
    paragraph: 'Comprehensive analytics for zone performances, program schedules, category breakdowns, and contestant tallies.',
    cardBg: "bg-[#ABF0D1]", // Vibrant Mint Green
    chipText: "Analytics",
    chipBg: "bg-white",
  },
  {
    icon: <Fingerprint size={32} className="text-white" />,
    heading: "Digital Judging Operations",
    paragraph: 'Streamlined greenroom entry, secure judge scoring queues, and automated score consolidation without manual paperwork.',
    cardBg: "bg-[#FF7675]", // Vibrant Red/Pink
    textColor: "text-white",
    chipText: "100% Anonymous",
    chipBg: "bg-black text-white",
  }
];

const Features: React.FC = () => {
  return (
    <section id='features' className='py-24 bg-white relative overflow-hidden'>
      <div className='container mx-auto px-4 max-w-[1280px]'>
        
        <div className='max-w-3xl mb-16'>
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#63CDDA] text-black font-black text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Core Features
          </div>
          <h2 className='text-[48px] sm:text-[64px] font-black text-black tracking-tight leading-[1.05]'>
            Intelligent Platform <br/>
            <span className='text-[#4f46e5]'>Features.</span>
          </h2>
          <p className='text-black/70 text-[19px] mt-6 font-medium leading-relaxed max-w-xl'>
            Everything you need to manage your arts fest efficiently, securely,
            and without manual paperwork. Designed for speed and fairness.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {featureData.map((item, i) => (
            <div
              key={i}
              className={`p-8 sm:p-10 flex flex-col justify-between rounded-[32px] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 ${item.cardBg} ${item.textColor || 'text-black'}`}
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <div>
                <div className="flex items-center justify-between mb-12">
                  <div className={`w-16 h-16 rounded-2xl bg-white/20 border-2 ${item.textColor ? 'border-white' : 'border-black'} flex items-center justify-center shadow-[4px_4px_0px_0px_${item.textColor ? 'white' : 'rgba(0,0,0,1)'}]`}>
                    {item.icon}
                  </div>
                  <span className={`text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full border-2 ${item.textColor ? 'border-white' : 'border-black'} ${item.chipBg}`}>
                    {item.chipText}
                  </span>
                </div>
                <h3 className='text-[28px] sm:text-[32px] font-black mb-4 leading-tight'>
                  {item.heading}
                </h3>
                <p className={`text-[17px] font-medium leading-relaxed ${item.textColor ? 'text-white/90' : 'text-black/80'}`}>
                  {item.paragraph}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

export const AdminFeatureShowcase: React.FC = () => {
  const contentList = [
    {
      id: 'roles',
      label: 'Role-Based Access',
      title: 'Uncompromising Security.',
      sub1Title: 'GRANULAR PERMISSIONS',
      sub1Text: 'Assign strict, scoped access to Greenroom officers, Convenors, and Judges. No one sees more than they need to.',
      sub2Title: 'AUDIT TRAILS',
      sub2Text: 'Every score entry and greenroom check-in is logged with timestamps and user IDs for total accountability.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#FF90E8]',
      textColor: 'text-black',
      accentColor: 'bg-white',
      tagColor: 'bg-black text-white'
    },
    {
      id: 'portals',
      label: 'Team Portals',
      title: 'Zone Management.',
      sub1Title: 'DEDICATED LOGINS',
      sub1Text: 'Give zone leaders their own secure portal to manage their team\'s registrations and view real-time performance.',
      sub2Title: 'PAPERLESS REGISTRATION',
      sub2Text: 'Drop the Excel sheets. Participants are imported, verified, and assigned chest numbers natively in the cloud.',
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#23B5D3]',
      textColor: 'text-black',
      accentColor: 'bg-white',
      tagColor: 'bg-black text-white'
    },
    {
      id: 'sync',
      label: 'Cloud-Synced Speed',
      title: 'Real-Time Sync.',
      sub1Title: 'INSTANT UPDATES',
      sub1Text: 'The moment a judge submits a score on their iPad, it reflects on the convenor dashboard and public tracker instantly.',
      sub2Title: 'OFFLINE RESILIENCY',
      sub2Text: 'If the network drops, scores are cached locally on the iPad and automatically synced the millisecond connection is restored.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      bgColor: 'bg-[#FFD166]',
      textColor: 'text-black',
      accentColor: 'bg-white',
      tagColor: 'bg-black text-black'
    }
  ];

  return (
    <section id="admin" className="py-24 bg-[#FFFDF8] relative z-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#06D6A0] text-black text-[13px] font-black tracking-widest uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Zap size={16} strokeWidth={3} /> Admin Control
          </div>
          <h2 className="text-[48px] md:text-[64px] font-black tracking-tight text-black leading-[1.05]">
            Total operations are <br/>
            <span className="text-[#4f46e5]">faster than they should be.</span>
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
                  <div className="w-full aspect-[4/3] rounded-[24px] bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center p-4 group">
                    <img 
                      src={content.image} 
                      alt={content.title} 
                      className="w-full h-full object-cover rounded-[12px] border-2 border-black transition-transform duration-700 group-hover:scale-105"
                    />
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
          <button className="flex items-center justify-center gap-3 bg-black hover:bg-black/80 text-white px-10 py-5 rounded-full font-black text-[18px] transition-all border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1">
            Explore Admin Dashboard <ArrowRight size={24} strokeWidth={3} />
          </button>
        </div>

      </div>
    </section>
  );
};

import React from 'react';
import { Users, Database, Shield } from 'lucide-react';

export const AdminDarkSection: React.FC = () => {
  return (
    <section id="admin" className="py-32 bg-[#1d1d1f] text-white relative z-20">
      <div className="max-w-[1024px] mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-20" data-aos="fade-up">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md">
            <Users size={32} strokeWidth={1.5} className="text-white" />
          </div>
          <h2 className="text-[48px] md:text-[64px] font-bold tracking-tight leading-tight mb-8">
            Total Admin Control.
          </h2>
          <p className="text-[22px] text-[#a1a1a6] font-medium leading-relaxed max-w-3xl mx-auto">
            Our powerful Admin Dashboard is where it all begins. <span className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white px-2 py-1 rounded-md">Import participants and schedule stages</span> effortlessly, without ever touching Excel again.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div data-aos="fade-up" data-aos-delay="100" className="bg-[#2d2d2f] rounded-[32px] p-10 border border-white/5 hover:bg-[#323234] transition-colors">
            <Shield className="text-blue-400 mb-6" size={32} strokeWidth={1.5} />
            <h4 className="text-[24px] font-bold text-white mb-4 tracking-tight">Role-Based Access</h4>
            <p className="text-[17px] text-[#a1a1a6] leading-relaxed font-medium">Assign strict permissions to Greenroom officers, Convenors, and Judges. Uncompromising security for your data.</p>
          </div>
          
          <div data-aos="fade-up" data-aos-delay="200" className="bg-[#2d2d2f] rounded-[32px] p-10 border border-white/5 hover:bg-[#323234] transition-colors">
            <Users className="text-pink-400 mb-6" size={32} strokeWidth={1.5} />
            <h4 className="text-[24px] font-bold text-white mb-4 tracking-tight">Team Portals</h4>
            <p className="text-[17px] text-[#a1a1a6] leading-relaxed font-medium">Dedicated, secure portals for zone leaders to manage their team's registrations natively in the cloud.</p>
          </div>
          
          <div data-aos="fade-up" data-aos-delay="300" className="bg-[#2d2d2f] rounded-[32px] p-10 border border-white/5 hover:bg-[#323234] transition-colors">
            <Database className="text-orange-400 mb-6" size={32} strokeWidth={1.5} />
            <h4 className="text-[24px] font-bold text-white mb-4 tracking-tight">Cloud-Synced Speed</h4>
            <p className="text-[17px] text-[#a1a1a6] leading-relaxed font-medium">Engineered for thousands of concurrent requests. Points and scores sync across all mobile devices instantly.</p>
          </div>
        </div>
        
      </div>
    </section>
  );
};

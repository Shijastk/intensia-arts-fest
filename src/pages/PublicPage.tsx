import React, { useMemo, useState } from "react";
import { Program, ProgramStatus, GalleryImage } from "../types";
import { Link } from "react-router-dom";
import { MasonryGridGallery } from "../components/MasonryGridGallery";

interface PublicPageProps {
  programs: Program[];
}
const formatFestName = (id?: string) => {
  if (!id) return "Arts Fest";
  return id
    .split("-")
    .filter((word) => isNaN(Number(word)))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const PublicPage: React.FC<PublicPageProps & { festId?: string }> = ({
  programs,
  festId,
}) => {
  const displayFestName = formatFestName(festId);
  const firstNamePart = displayFestName.split(" ")[0] || "Arts";
  const restNamePart = displayFestName.split(" ").slice(1).join(" ") || "Fest";

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-slate-900 overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-emerald-100/50 to-teal-50/20 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-amber-100/40 to-orange-50/20 blur-[100px]"></div>
      </div>

      {/* Header/Navbar - Floating Pill Style */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/80 backdrop-blur-2xl shadow-2xl shadow-emerald-900/5 rounded-[2rem] px-6 sm:px-8 py-4 flex items-center justify-between w-full max-w-6xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-900/20 transform rotate-3">
              I
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 uppercase leading-none">
                {firstNamePart}
              </span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                {restNamePart}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 bg-slate-50/50 px-8 py-3 rounded-full">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-emerald-700 transition-colors">Home</button>
            <Link to={`/fests/${festId}/schedule`} className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-emerald-700 transition-colors">Schedule</Link>
            <Link to={`/fests/${festId}/results`} className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-emerald-700 transition-colors">Results</Link>
            <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-emerald-700 transition-colors">About</button>
          </div>

          {/* CTA */}
          <Link
            to={`/fests/${festId}/login`}
            className="px-6 py-3 bg-slate-900 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 hover:-translate-y-1"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div id="home" className="relative pt-40 pb-20 md:pt-56 md:pb-32 z-10">
        <div className="flex flex-col items-center justify-center max-w-5xl mx-auto px-4 text-center">
          
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            A Celebration of Culture
          </div>
          
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
            {firstNamePart} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500">
              {restNamePart}
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed mb-12">
            Experience the pinnacle of artistic expression. A vibrant gathering where profound tradition meets extraordinary talent.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-20">
            <Link to={`/fests/${festId}/results`} className="px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 hover:-translate-y-1">
              Live Results
              <span className="text-xl">🏆</span>
            </Link>
            <Link to={`/fests/${festId}/schedule`} className="px-8 py-5 bg-white text-emerald-900 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:bg-slate-50 shadow-xl shadow-slate-200/50 hover:-translate-y-1">
              Event Schedule
            </Link>
          </div>

          {/* Hero Feature Teaser */}
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-2xl shadow-emerald-900/5 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <span className="text-4xl block mb-4">🎭</span>
              <h3 className="text-xl font-black text-slate-900 mb-2">Stage Arts</h3>
              <p className="text-sm font-medium text-slate-500">Witness mesmerizing performances across classical and contemporary forms.</p>
            </div>
            
            <div className="flex-1 bg-emerald-900 p-8 rounded-[2rem] shadow-2xl shadow-emerald-900/20 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400 rounded-full blur-[50px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <span className="text-4xl block mb-4">✍️</span>
              <h3 className="text-xl font-black text-white mb-2">Literary Events</h3>
              <p className="text-sm font-medium text-emerald-100/70">Engage with profound thoughts through debates, poetry, and storytelling.</p>
            </div>
            
            <div className="flex-1 bg-amber-50 p-8 rounded-[2rem] shadow-2xl shadow-amber-900/5 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <span className="text-4xl block mb-4">🎨</span>
              <h3 className="text-xl font-black text-amber-950 mb-2">Creative Arts</h3>
              <p className="text-sm font-medium text-amber-800/70">A showcase of visual brilliance spanning multiple mediums and expressions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling Ticker - Fat & Bold */}
      <div className="bg-emerald-900 py-6 relative z-10 transform -rotate-1 scale-105 shadow-2xl overflow-hidden">
        <div className="flex gap-16 animate-marquee whitespace-nowrap text-emerald-100 text-lg font-black uppercase tracking-widest">
          <span>✨ Live Results</span>
          <span className="text-amber-400">✨ {displayFestName}</span>
          <span>✨ Annual Edition</span>
          <span className="text-amber-400">✨ The Art Form of Creativity</span>
          <span>✨ Live Results</span>
          <span className="text-amber-400">✨ {displayFestName}</span>
          <span>✨ Annual Edition</span>
          <span className="text-amber-400">✨ The Art Form of Creativity</span>
        </div>
      </div>

      {/* About Section - Blocky & Vibrant */}
      <div id="about" className="py-24 md:py-32 relative z-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            <div className="lg:w-1/2 relative w-full">
              <div className="aspect-square sm:aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-300 relative group">
                <img src="/stage-abstract.png" alt="Festival" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/60 to-transparent"></div>
                <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12">
                  <div className="bg-amber-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl inline-block mb-4 shadow-lg">About The Event</div>
                  <h3 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">Soulful<br/>Symphony</h3>
                </div>
              </div>
              <div className="absolute -z-10 top-10 -right-10 w-full h-full bg-gradient-to-br from-amber-200 to-orange-200 rounded-[3rem] blur-2xl opacity-60"></div>
            </div>
            
            <div className="lg:w-1/2 flex flex-col gap-8">
              <h2 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                {firstNamePart}<br />
                <span className="text-emerald-700">{restNamePart}</span>
              </h2>
              
              <p className="text-xl text-slate-600 font-medium leading-relaxed">
                Immerse yourself in the rhythmic vibes of our annual arts festival. Join us at {displayFestName} for days of unlimited creativity, passion, and artistic brilliance.
              </p>

              {/* Float Card */}
              <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-emerald-900/10 flex gap-6 items-start transform hover:-translate-y-2 transition-transform">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl flex-shrink-0">🎭</div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">A Gathering of Excellence</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    A vibrant assembly of talents spanning multiple stages, showcasing breathtaking performances and exquisite craftsmanship.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Highlights Section - Bento Grid Style */}
      <div className="py-24 bg-white relative z-10 rounded-t-[3rem] sm:rounded-t-[5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter">Festival Extravaganza</h2>
            <p className="text-lg font-bold text-amber-600 uppercase tracking-widest mt-4">Event Highlights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50 rounded-[2rem] p-10 hover:bg-emerald-100 transition-colors">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-8">🏆</div>
              <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight mb-4">Live Competition</h3>
              <p className="text-emerald-800/80 font-medium leading-relaxed">Experience high-stakes competition as students battle for prestigious titles in an atmosphere of excellence.</p>
            </div>
            
            <div className="bg-amber-50 rounded-[2rem] p-10 hover:bg-amber-100 transition-colors">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-8">🎤</div>
              <h3 className="text-2xl font-black text-amber-950 uppercase tracking-tight mb-4">Various Forms</h3>
              <p className="text-amber-800/80 font-medium leading-relaxed">From classical recitation to modern artistic expressions, witness a harmonious blend of traditions.</p>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-10 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-8">📅</div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Live Schedule</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Stay seamlessly updated with our live event tracking and instant result publishing system.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <div className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
              <div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Festival Moments</h2>
                <p className="text-lg font-bold text-amber-600 uppercase tracking-widest">Event Gallery</p>
              </div>
              {galleryImages.length >= 3 && (
                <Link
                  to={`/fests/${festId}/gallery`}
                  className="px-6 py-3 bg-slate-900 hover:bg-emerald-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10"
                >
                  View Collection
                </Link>
              )}
            </div>
            <MasonryGridGallery images={galleryImages} limit={3} />
          </div>
        </div>
      )}

      {/* Footer - Massive & Bold */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 mt-12 rounded-t-[3rem] sm:rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl flex items-center justify-center text-3xl mb-12 transform -rotate-12 shadow-2xl shadow-emerald-500/20">✨</div>
          <h2 className="text-6xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
            {firstNamePart}
          </h2>
          <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mb-16">
            The ultimate celebration of profound creativity and cultural heritage.
          </p>
          <p className="text-xs font-black text-slate-600 uppercase tracking-widest">&copy; 2026 {displayFestName}. All rights reserved.</p>
          <div className="mt-8 flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Powered by</span>
            <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">Artflow</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">by Festloom</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

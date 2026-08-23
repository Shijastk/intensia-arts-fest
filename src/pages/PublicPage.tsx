import React, { useMemo, useState, useEffect } from "react";
import { Program, ProgramStatus, GalleryImage } from "../types";
import { Link } from "react-router-dom";
import { MasonryGridGallery } from "../components/MasonryGridGallery";
import stageAbstractImg from "../images/stage-abstract.png";
import { useSettings } from "../hooks/useSettings";
import { getBackgroundSettings } from "../services/backgroundService";

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
  const { settings } = useSettings(festId || null);

  const rawFestName = settings?.festName || formatFestName(festId);
  const nameParts = rawFestName.split(" ");
  const firstNamePart = nameParts[0] || "Arts";
  const restNamePart = nameParts.slice(1).join(" ") || "Fest";
  
  const displayFestName = rawFestName;
  const displaySlogan = settings?.festSlogan || "A Celebration of Culture";

  const themeConfig: Record<string, any> = {
    emerald: {
      bgGradient: "from-emerald-100/50 to-teal-50/20",
      bgGradient2: "from-amber-100/40 to-orange-50/20",
      logoBg: "from-emerald-600 to-teal-800 shadow-emerald-900/20",
      logoTextMain: "text-emerald-950",
      logoTextSub: "text-amber-600",
      linkHover: "hover:text-emerald-700",
      btnPrimary: "bg-slate-900 hover:bg-emerald-900 shadow-slate-900/10",
      pillBg: "bg-emerald-50 text-emerald-700",
      pillDot: "bg-emerald-500",
      heroGradient: "from-emerald-600 via-teal-600 to-amber-500",
      btnGradient: "from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-900/20",
      btnSecondary: "text-emerald-900 hover:bg-slate-50",
      tickerBg: "bg-emerald-900",
      tickerTextMain: "text-emerald-100",
      tickerTextSub: "text-amber-400",
      feature1IconBg: "bg-amber-400",
      feature2Bg: "bg-emerald-900",
      feature2IconBg: "bg-teal-400",
      feature2TextMain: "text-white",
      feature2TextSub: "text-emerald-100/70",
      feature3Bg: "bg-amber-50",
      feature3IconBg: "bg-orange-400",
      feature3TextMain: "text-amber-950",
      feature3TextSub: "text-amber-800/70",
      aboutTitleColor: "text-emerald-700",
      footerLogoBg: "from-emerald-500 to-teal-700 shadow-emerald-500/20",
    },
    purple: {
      bgGradient: "from-purple-100/50 to-pink-50/20",
      bgGradient2: "from-fuchsia-100/40 to-rose-50/20",
      logoBg: "from-purple-600 to-pink-800 shadow-purple-900/20",
      logoTextMain: "text-purple-950",
      logoTextSub: "text-fuchsia-600",
      linkHover: "hover:text-purple-700",
      btnPrimary: "bg-slate-900 hover:bg-purple-900 shadow-slate-900/10",
      pillBg: "bg-purple-50 text-purple-700",
      pillDot: "bg-purple-500",
      heroGradient: "from-purple-600 via-fuchsia-600 to-pink-500",
      btnGradient: "from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 shadow-purple-900/20",
      btnSecondary: "text-purple-900 hover:bg-slate-50",
      tickerBg: "bg-purple-900",
      tickerTextMain: "text-purple-100",
      tickerTextSub: "text-fuchsia-400",
      feature1IconBg: "bg-fuchsia-400",
      feature2Bg: "bg-purple-900",
      feature2IconBg: "bg-pink-400",
      feature2TextMain: "text-white",
      feature2TextSub: "text-purple-100/70",
      feature3Bg: "bg-fuchsia-50",
      feature3IconBg: "bg-pink-400",
      feature3TextMain: "text-fuchsia-950",
      feature3TextSub: "text-fuchsia-800/70",
      aboutTitleColor: "text-purple-700",
      footerLogoBg: "from-purple-500 to-pink-700 shadow-purple-500/20",
    },
    blue: {
      bgGradient: "from-blue-100/50 to-cyan-50/20",
      bgGradient2: "from-sky-100/40 to-indigo-50/20",
      logoBg: "from-blue-600 to-cyan-800 shadow-blue-900/20",
      logoTextMain: "text-blue-950",
      logoTextSub: "text-sky-600",
      linkHover: "hover:text-blue-700",
      btnPrimary: "bg-slate-900 hover:bg-blue-900 shadow-slate-900/10",
      pillBg: "bg-blue-50 text-blue-700",
      pillDot: "bg-blue-500",
      heroGradient: "from-blue-600 via-cyan-600 to-emerald-400",
      btnGradient: "from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 shadow-blue-900/20",
      btnSecondary: "text-blue-900 hover:bg-slate-50",
      tickerBg: "bg-blue-900",
      tickerTextMain: "text-blue-100",
      tickerTextSub: "text-sky-400",
      feature1IconBg: "bg-sky-400",
      feature2Bg: "bg-blue-900",
      feature2IconBg: "bg-cyan-400",
      feature2TextMain: "text-white",
      feature2TextSub: "text-blue-100/70",
      feature3Bg: "bg-sky-50",
      feature3IconBg: "bg-indigo-400",
      feature3TextMain: "text-sky-950",
      feature3TextSub: "text-sky-800/70",
      aboutTitleColor: "text-blue-700",
      footerLogoBg: "from-blue-500 to-cyan-700 shadow-blue-500/20",
    },
    crimson: {
      bgGradient: "from-rose-100/50 to-red-50/20",
      bgGradient2: "from-orange-100/40 to-amber-50/20",
      logoBg: "from-rose-600 to-red-800 shadow-rose-900/20",
      logoTextMain: "text-rose-950",
      logoTextSub: "text-orange-600",
      linkHover: "hover:text-rose-700",
      btnPrimary: "bg-slate-900 hover:bg-rose-900 shadow-slate-900/10",
      pillBg: "bg-rose-50 text-rose-700",
      pillDot: "bg-rose-500",
      heroGradient: "from-rose-600 via-red-600 to-orange-500",
      btnGradient: "from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 shadow-rose-900/20",
      btnSecondary: "text-rose-900 hover:bg-slate-50",
      tickerBg: "bg-rose-900",
      tickerTextMain: "text-rose-100",
      tickerTextSub: "text-orange-400",
      feature1IconBg: "bg-orange-400",
      feature2Bg: "bg-rose-900",
      feature2IconBg: "bg-red-400",
      feature2TextMain: "text-white",
      feature2TextSub: "text-rose-100/70",
      feature3Bg: "bg-orange-50",
      feature3IconBg: "bg-amber-400",
      feature3TextMain: "text-orange-950",
      feature3TextSub: "text-orange-800/70",
      aboutTitleColor: "text-rose-700",
      footerLogoBg: "from-rose-500 to-red-700 shadow-rose-500/20",
    }
  };

  const t = themeConfig[settings?.theme || 'emerald'] || themeConfig['emerald'];
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [posterBgs, setPosterBgs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!festId) return;
    getBackgroundSettings(festId).then(bgs => {
      if (bgs?.posterBgs) setPosterBgs(bgs.posterBgs);
    });
  }, [festId]);

  const downloadPoster = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${displayFestName.replace(/\s+/g, '_')}_Poster_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-slate-900 overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br ${t.bgGradient} blur-[100px]`}></div>
        <div className={`absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl ${t.bgGradient2} blur-[100px]`}></div>
      </div>

      {/* Header/Navbar - Floating Pill Style */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/80 backdrop-blur-2xl shadow-2xl shadow-slate-900/5 rounded-[2rem] px-6 sm:px-8 py-4 flex items-center justify-between w-full max-w-6xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${t.logoBg} flex items-center justify-center text-white font-black text-xl shadow-lg transform rotate-3`}>
              I
            </div>
            <div className="flex flex-col">
              <span className={`text-xl sm:text-2xl font-black tracking-tight ${t.logoTextMain} uppercase leading-none`}>
                {firstNamePart}
              </span>
              <span className={`text-[10px] font-bold ${t.logoTextSub} uppercase tracking-widest mt-1`}>
                {restNamePart}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 bg-slate-50/50 px-8 py-3 rounded-full">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`text-sm font-bold uppercase tracking-wide text-slate-500 ${t.linkHover} transition-colors`}>Home</button>
            <Link to={`/fests/${festId}/schedule`} className={`text-sm font-bold uppercase tracking-wide text-slate-500 ${t.linkHover} transition-colors`}>Schedule</Link>
            <Link to={`/fests/${festId}/results`} className={`text-sm font-bold uppercase tracking-wide text-slate-500 ${t.linkHover} transition-colors`}>Results</Link>
            <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className={`text-sm font-bold uppercase tracking-wide text-slate-500 ${t.linkHover} transition-colors`}>About</button>
          </div>

          {/* CTA */}
          <Link
            to={`/fests/${festId}/login`}
            className={`px-6 py-3 ${t.btnPrimary} text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1`}
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div id="home" className="relative pt-40 pb-20 md:pt-56 md:pb-32 z-10">
        <div className="flex flex-col items-center justify-center max-w-5xl mx-auto px-4 text-center">
          
          <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full ${t.pillBg} text-xs font-black uppercase tracking-widest shadow-sm mb-8`}>
            <span className={`w-2 h-2 rounded-full ${t.pillDot} animate-pulse`}></span>
            {displaySlogan}
          </div>
          
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
            {firstNamePart} <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${t.heroGradient}`}>
              {restNamePart}
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed mb-12">
            Experience the pinnacle of artistic expression. A vibrant gathering where profound tradition meets extraordinary talent.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-20">
            <Link to={`/fests/${festId}/results`} className={`px-8 py-5 bg-gradient-to-r ${t.btnGradient} text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 hover:-translate-y-1`}>
              Live Results
              <span className="text-xl">🏆</span>
            </Link>
            <Link to={`/fests/${festId}/schedule`} className={`px-8 py-5 bg-white ${t.btnSecondary} rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 hover:-translate-y-1`}>
              Event Schedule
            </Link>
          </div>

          {/* Hero Feature Teaser */}
          <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-900/5 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 ${t.feature1IconBg} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              <span className="text-4xl block mb-4">🎭</span>
              <h3 className="text-xl font-black text-slate-900 mb-2">Stage Arts</h3>
              <p className="text-sm font-medium text-slate-500">Witness mesmerizing performances across classical and contemporary forms.</p>
            </div>
            
            <div className={`flex-1 ${t.feature2Bg} p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${t.feature2IconBg} rounded-full blur-[50px] opacity-30 group-hover:opacity-50 transition-opacity`}></div>
              <span className="text-4xl block mb-4">✍️</span>
              <h3 className={`text-xl font-black ${t.feature2TextMain} mb-2`}>Literary Events</h3>
              <p className={`text-sm font-medium ${t.feature2TextSub}`}>Engage with profound thoughts through debates, poetry, and storytelling.</p>
            </div>
            
            <div className={`flex-1 ${t.feature3Bg} p-8 rounded-[2rem] shadow-2xl shadow-slate-900/5 hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${t.feature3IconBg} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              <span className="text-4xl block mb-4">🎨</span>
              <h3 className={`text-xl font-black ${t.feature3TextMain} mb-2`}>Creative Arts</h3>
              <p className={`text-sm font-medium ${t.feature3TextSub}`}>A showcase of visual brilliance spanning multiple mediums and expressions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling Ticker - Fat & Bold */}
      <div className={`${t.tickerBg} py-6 relative z-10 transform -rotate-1 scale-105 shadow-2xl overflow-hidden`}>
        <div className={`flex gap-16 animate-marquee whitespace-nowrap ${t.tickerTextMain} text-lg font-black uppercase tracking-widest`}>
          <span>✨ Live Results</span>
          <span className={`${t.tickerTextSub}`}>✨ {displayFestName}</span>
          <span>✨ Annual Edition</span>
          <span className={`${t.tickerTextSub}`}>✨ {displaySlogan}</span>
          <span>✨ Live Results</span>
          <span className={`${t.tickerTextSub}`}>✨ {displayFestName}</span>
          <span>✨ Annual Edition</span>
          <span className={`${t.tickerTextSub}`}>✨ {displaySlogan}</span>
        </div>
      </div>

      {/* About Section - Blocky & Vibrant */}
      <div id="about" className="py-24 md:py-32 relative z-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            <div className="lg:w-1/2 relative w-full">
              <div className="aspect-square sm:aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-300 relative group">
                <img src={stageAbstractImg} alt="Festival" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                <div className={`absolute inset-0 bg-gradient-to-tr ${t.tickerBg} opacity-60 to-transparent`}></div>
                <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12">
                  <div className={`${t.feature3IconBg} text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl inline-block mb-4 shadow-lg`}>About The Event</div>
                  <h3 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">Soulful<br/>Symphony</h3>
                </div>
              </div>
              <div className={`absolute -z-10 top-10 -right-10 w-full h-full bg-gradient-to-br ${t.bgGradient2} rounded-[3rem] blur-2xl opacity-60`}></div>
            </div>
            
            <div className="lg:w-1/2 flex flex-col gap-8">
              <h2 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                {firstNamePart}<br />
                <span className={`${t.aboutTitleColor}`}>{restNamePart}</span>
              </h2>
              
              <p className="text-xl text-slate-600 font-medium leading-relaxed">
                Immerse yourself in the rhythmic vibes of our annual arts festival. Join us at {displayFestName} for days of unlimited creativity, passion, and artistic brilliance.
              </p>

              {/* Float Card */}
              <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-slate-900/10 flex gap-6 items-start transform hover:-translate-y-2 transition-transform">
                <div className={`w-16 h-16 rounded-2xl ${t.feature3Bg} flex items-center justify-center text-3xl flex-shrink-0`}>🎭</div>
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
            <p className={`text-lg font-bold ${t.logoTextSub} uppercase tracking-widest mt-4`}>Event Highlights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`bg-slate-50 rounded-[2rem] p-10 hover:${t.feature3Bg} transition-colors`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-8">🏆</div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Live Competition</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Experience high-stakes competition as students battle for prestigious titles in an atmosphere of excellence.</p>
            </div>
            
            <div className={`${t.feature3Bg} rounded-[2rem] p-10 opacity-90 transition-colors`}>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-8">🎤</div>
              <h3 className={`text-2xl font-black ${t.feature3TextMain} uppercase tracking-tight mb-4`}>Various Forms</h3>
              <p className={`${t.feature3TextSub} font-medium leading-relaxed`}>From classical recitation to modern artistic expressions, witness a harmonious blend of traditions.</p>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-10 hover:bg-slate-100 transition-colors">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-8">📅</div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Live Schedule</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Stay seamlessly updated with our live event tracking and instant result publishing system.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Posters Section - shown only when poster backgrounds exist */}
      {Object.keys(posterBgs).length > 0 && (
        <div className="py-24 bg-white relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div>
                <h2 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter">Event Posters</h2>
                <p className={`text-lg font-bold ${t.logoTextSub} uppercase tracking-widest mt-4`}>Official Fest Materials</p>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click to Download</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.entries(posterBgs).map(([id, url], index) => (
                <div
                  key={id}
                  onClick={() => downloadPoster(url as string, index)}
                  className="group relative rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-white cursor-pointer hover:-translate-y-2 transition-all duration-500 aspect-[3/4]"
                >
                  <img
                    src={url as string}
                    alt={`${displayFestName} Poster ${index + 1}`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${t.btnGradient} rounded-2xl flex items-center justify-center mb-3 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-black uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      Download Poster
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <div className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
              <div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Festival Moments</h2>
                <p className={`text-lg font-bold ${t.logoTextSub} uppercase tracking-widest`}>Event Gallery</p>
              </div>
              {galleryImages.length >= 3 && (
                <Link
                  to={`/fests/${festId}/gallery`}
                  className={`px-6 py-3 ${t.btnPrimary} text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1`}
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
          <div className={`w-20 h-20 bg-gradient-to-br ${t.footerLogoBg} rounded-3xl flex items-center justify-center text-3xl mb-12 transform -rotate-12 shadow-2xl`}>✨</div>
          <h2 className="text-6xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
            {firstNamePart}
          </h2>
          <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mb-16">
            {displaySlogan}
          </p>
          <p className="text-xs font-black text-slate-600 uppercase tracking-widest">&copy; {new Date().getFullYear()} {displayFestName}. All rights reserved.</p>
          <div className="mt-8 flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Powered by</span>
            <span className={`text-sm font-black ${t.tickerTextSub} uppercase tracking-widest`}>Artflow</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">by Festloom</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

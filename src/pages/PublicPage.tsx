import React, { useMemo, useState, useEffect } from 'react';
import { Program, ProgramStatus, GalleryImage } from '../types';
import { Link } from 'react-router-dom';
import { subscribeToGalleryImages } from '../services/firestore.service';

interface PublicPageProps {
    programs: Program[];
}

export const PublicPage: React.FC<PublicPageProps> = ({ programs }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeTab, setActiveTab] = useState<'HOME' | 'RESULTS'>('HOME');
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

    // Subscribe to gallery images
    useEffect(() => {
        const unsubscribe = subscribeToGalleryImages((images) => {
            setGalleryImages(images.slice(0, 3)); // Only show latest 3 images
        });
        return () => unsubscribe();
    }, []);

    const completedPrograms = useMemo(() => {
        return programs
            .filter(
                p =>
                    p.status === ProgramStatus.COMPLETED &&
                    p.isResultPublished
            )
            // Latest programs first
            .sort((a, b) =>
                (b.startTime || '').localeCompare(a.startTime || '')
            )
            .slice(0, 3)
            // 🔥 RANK SORTING LOGIC
            .map(program => ({
                ...program,
                teams: [...program.teams]
                    // 1️⃣ Sort teams by rank
                    .sort((a, b) => a.rank - b.rank)
                    .map(team => ({
                        ...team,
                        // 2️⃣ Sort participants by rank
                        participants: [...(team.participants || [])].sort(
                            (a, b) => a.rank - b.rank
                        )
                    }))
            }));
    }, [programs]);


    console.log(completedPrograms, "cmhjglwejg")

    const upcomingPrograms = useMemo(() =>
        programs.filter(p => p.status !== ProgramStatus.COMPLETED && p.status !== ProgramStatus.CANCELLED).sort((a, b) =>
            (a.startTime || '').localeCompare(b.startTime || '')
        ).slice(0, 3),
        [programs]);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
            {/* Header/Navbar */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo Area */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                                {/* Abstract Logo Shape */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-teal-600 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white font-black text-xs sm:text-lg shadow-lg shadow-teal-200">
                                    I
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Intensia</span>
                                <span className="text-[8px] sm:text-[10px] font-bold text-teal-600 uppercase tracking-widest">Arts Fest</span>
                            </div>
                        </div>

                        {/* Nav Links - Hidden Mobile */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#home" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors">Home</a>
                            <a href="#about" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors">About</a>
                            <a href="#results" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors">Results</a>
                        </div>

                        {/* CTA */}
                        <div className="flex-shrink-0">
                            <Link
                                to="/login"
                                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-slate-200"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div id="home" className="pt-28 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Hero Text */}
                    <div className="order-2 lg:order-1 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 text-center lg:text-left flex flex-col items-center lg:items-start">
                        <div className="space-y-4">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                Dec 26 - 27, 2025 • Kalpetta
                            </span>
                            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                                The Art<br />
                                Form of <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-400">Creativity</span>
                            </h1>
                            <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                                Experience the pinnacle of artistic expression at the Darul Falah Campus Fest. Where talent meets tradition in a celebration of culture.
                            </p>
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 md:gap-12 pt-4 border-t border-slate-100 w-full">
                            <div>
                                <p className="text-3xl font-black text-slate-900">100+</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Participants</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">5</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stages</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">3</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full justify-center lg:justify-start">
                            <a href="#results" className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-teal-200 flex items-center justify-center gap-2">
                                View Results
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </a>
                            <a href="#about" className="px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-full text-sm font-bold uppercase tracking-widest transition-all hover:bg-slate-50 text-center">
                                Learn More
                            </a>
                        </div>
                    </div>

                    {/* Hero Images - Collage Style */}
                    <div className="order-1 lg:order-2 relative h-[500px] hidden md:block animate-in fade-in zoom-in duration-1000">
                        {/* Main Oval Image */}
                        <div className="absolute top-0 right-0 w-4/5 h-full bg-slate-100 rounded-[100px] overflow-hidden shadow-2xl rotate-3 border-4 border-white">
                            <img
                                src="/hero-art.png"
                                alt="Arts Composition"
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/40 to-transparent"></div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute bottom-20 left-10 bg-white p-6 rounded-3xl shadow-xl animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🎨</div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase">Islamic Arts</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Showcase</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrolling Ticker */}
            <div className="bg-slate-900 py-4 overflow-hidden -skew-y-1 relative z-10">
                <div className="flex gap-16 animate-marquee whitespace-nowrap text-slate-400 text-sm font-black uppercase tracking-[0.2em] opacity-80">
                    <span>★ Live Results</span>
                    <span>★ Darul Falah Campus</span>
                    <span>★ Intensia 2025</span>
                    <span>★ The Art Form of Creativity</span>
                    <span>★ Live Results</span>
                    <span>★ Darul Falah Campus</span>
                    <span>★ Intensia 2025</span>
                    <span>★ The Art Form of Creativity</span>
                </div>
            </div>

            {/* About Section */}
            <div id="about" className="py-12 md:py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="md:w-1/2 relative">
                            <div className="aspect-[4/5] bg-slate-200 rounded-[3rem] overflow-hidden shadow-2xl relative">
                                <img src="/stage-abstract.png" alt="Festival Stage" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-10 left-10 text-white">
                                    <p className="text-xs font-bold uppercase tracking-widest mb-2 text-orange-400">About the Event</p>
                                    <h3 className="text-4xl font-black uppercase tracking-tight">Soulful<br />Symphony</h3>
                                </div>
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
                        </div>
                        <div className="md:w-1/2 space-y-8">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">Darul Falah<br />Campus Fest</h2>
                                <div className="w-20 h-2 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"></div>
                            </div>
                            <p className="text-slate-600 text-lg leading-relaxed font-medium">
                                Experience no limits where melodies transcend boundaries. Immerse yourself in the rhythmic vibes of our annual arts festival. Join us at the Darul Falah Campus for two days of unlimited creativity and competition.
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="text-teal-600 mb-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Dec 26-27</h4>
                                    <p className="text-xs font-medium text-slate-400">9:00 AM - 9:00 PM</p>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="text-orange-500 mb-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Kalpetta</h4>
                                    <p className="text-xs font-medium text-slate-400">Darul Falah Campus</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Highlights Section */}
            <div className="py-12 md:py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-12">
                        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">— Highlights</p>
                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Festival Extravaganza</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="p-8 rounded-[2rem] bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <span className="text-2xl">🏆</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase mb-3">Live Competition</h3>
                            <p className="text-sm text-slate-500 font-medium">Experience high-stakes competition as students battle for the prestigious titles.</p>
                        </div>
                        {/* Card 2 */}
                        <div className="p-8 rounded-[2rem] bg-teal-50 hover:bg-teal-100 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-600 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <span className="text-2xl">🎤</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase mb-3">Various Forms</h3>
                            <p className="text-sm text-slate-500 font-medium">From classical recitation to modern artistic expressions, witness it all.</p>
                        </div>
                        {/* Card 3 */}
                        <div className="p-8 rounded-[2rem] bg-orange-50 hover:bg-orange-100 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <span className="text-2xl">📅</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase mb-3">Real-time Schedule</h3>
                            <p className="text-sm text-slate-500 font-medium">Stay updated with our live event tracking and result publishing system.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Section - Only visible if at least 1 image exists */}
            {galleryImages.length > 0 && (
                <div className="py-12 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
                            <div>
                                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">— Event Gallery</p>
                                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Festival Moments</h2>
                                <p className="text-sm text-slate-500 mt-2">Capturing the vibrant moments from our event</p>
                            </div>
                            {/* View All button - Only visible if 3 or more images */}
                            {galleryImages.length >= 3 && (
                                <Link
                                    to="/gallery"
                                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-200 flex items-center gap-2"
                                >
                                    View All Photos
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                            )}
                        </div>

                        {/* Gallery Grid - Latest 3 images */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {galleryImages.map((image, index) => (
                                <div
                                    key={image.id}
                                    className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300"
                                >
                                    <img
                                        src={image.imageUrl}
                                        alt={`Gallery ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f1f5f9" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="18" dy="50%25" dx="50%25" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                                            <p className="text-white text-xs font-bold uppercase tracking-wide">
                                                Intensia 2025
                                            </p>
                                            {/* Download Button */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(image.imageUrl);
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.download = `intensia-2025-gallery-${image.id}.jpg`;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (error) {
                                                        console.error('Download failed:', error);
                                                    }
                                                }}
                                                className="px-3 py-2 bg-white/90 hover:bg-white text-teal-600 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-lg hover:shadow-xl"
                                                title="Download Image"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                <span className="hidden sm:inline">Download</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Results & Events Section */}
            <div id="results" className="py-12 md:py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
                        <div>
                            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">— Latest Results</p>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Recent Winners</h2>
                            <p className="text-sm text-slate-500 mt-2">Showing latest 3 published results</p>
                        </div>
                        <Link
                            to="/results"
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-200 flex items-center gap-2"
                        >
                            View All Results
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                    </div>

                    {/* Results Grid - Latest 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedPrograms.length > 0 ? completedPrograms.map(prog => (
                            <div key={prog.id} className="group bg-white rounded-[2rem] p-2 hover:shadow-xl transition-all border border-slate-100 h-full flex flex-col">
                                {/* Card Header (Venue/Date) */}
                                <div className="h-40 bg-slate-100 rounded-[1.5rem] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 group-hover:scale-105 transition-transform duration-500"></div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-900">
                                            {prog.category}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{prog.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{prog.venue} • {prog.startTime}</p>
                                    </div>
                                </div>

                                {/* Winners List - Sorted by Points */}
                                <div className="p-4 space-y-3 flex-1">
                                    {prog.teams
                                        .filter(t => t.points && t.points > 0)
                                        .sort((a, b) => (b.points || 0) - (a.points || 0))
                                        .slice(0, 3) // Top 3
                                        .map((team, index) => (
                                            <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                    index === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-900 uppercase line-clamp-1">{team.participants[0]?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{team.teamName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-emerald-600">{team.points}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Points</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center py-20 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                                <p className="text-slate-400 font-bold uppercase text-sm">No results published yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 md:py-20 rounded-t-[2rem] md:rounded-t-[3rem] mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl animate-pulse">
                        ✨
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Intensia Arts Fest 2025</h2>
                    <p className="text-slate-400 text-sm font-medium max-w-lg mx-auto mb-8">
                        The ultimate celebration of creativity and talent under the guidance of Darul Falah Islamic College.
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">&copy; 2025 INTENSIA. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

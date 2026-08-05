import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { getGallery } from '../services/gas.service';
import { GalleryImage } from '../types';
import { MasonryGridGallery } from '../components/MasonryGridGallery';

export const GalleryPage: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     let mounted = true;
    //     getGallery().then((res) => {
    //         if (mounted && res.success && res.data) {
    //             setImages(res.data as any[]);
    //         }
    //         if (mounted) setLoading(false);
    //     });
    //     return () => { mounted = false; };
    // }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-bold">Loading gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Header/Navbar */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo Area */}
                        <Link to="/" className="flex items-center gap-2 sm:gap-3">
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-tr from-teal-600 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white font-black text-xs sm:text-lg shadow-lg shadow-teal-200">
                                    I
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Intensia</span>
                                <span className="text-[8px] sm:text-[10px] font-bold text-teal-600 uppercase tracking-widest">Arts Fest</span>
                            </div>
                        </Link>

                        {/* Back Button */}
                        <Link
                            to="/"
                            className="px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-slate-200 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 text-center">
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">— Event Gallery</p>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tight mb-4">
                        Festival Moments
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Capturing the vibrant moments and memories from Intensia Arts Fest 2025
                    </p>
                </div>
                <MasonryGridGallery images={images} />
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 md:py-20 rounded-t-[2rem] md:rounded-t-[3rem] mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl animate-pulse">
                        ✨
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Intensia Arts Fest 2025</h2>
                    <p className="text-slate-400 text-sm font-medium max-w-lg mx-auto mb-8">
                        The ultimate celebration of creativity and talent at Intensia Arts Fest.
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">&copy; 2025 INTENSIA. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};


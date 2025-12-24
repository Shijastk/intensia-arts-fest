import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToGalleryImages } from '../services/firestore.service';
import { GalleryImage } from '../types';

export const GalleryPage: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToGalleryImages((galleryImages) => {
            setImages(galleryImages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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

                {/* Gallery Grid */}
                {images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 animate-in fade-in zoom-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <img
                                    src={image.imageUrl}
                                    alt={`Gallery image ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f1f5f9" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="18" dy="50%25" dx="50%25" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <p className="text-white text-sm font-bold">
                                            {image.createdAt?.toDate ?
                                                new Date(image.createdAt.toDate()).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : 'Recent'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">No Images Yet</h3>
                        <p className="text-slate-500 font-medium">Gallery images will appear here once they are uploaded</p>
                    </div>
                )}
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

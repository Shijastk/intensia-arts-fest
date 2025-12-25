import React, { useState } from 'react';
import { addGalleryImage, subscribeToGalleryImages, deleteGalleryImage } from '../services/firestore.service';

export const GalleryUpload: React.FC = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageUrl.trim()) {
            setMessage({ type: 'error', text: 'Please enter an image URL' });
            return;
        }

        // Basic URL validation
        try {
            new URL(imageUrl);
        } catch {
            setMessage({ type: 'error', text: 'Please enter a valid URL' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            // console.log('🔵 Attempting to add gallery image:', imageUrl);
            const result = await addGalleryImage(imageUrl, 'Green Room');
            // console.log('📊 Result from addGalleryImage:', result);

            if (result) {
                // console.log('✅ Image added successfully with ID:', result);
                setMessage({ type: 'success', text: 'Image added to gallery successfully!' });
                setImageUrl('');
            } else {
                // console.error('❌ addGalleryImage returned null - Check Firebase rules and permissions');
                setMessage({
                    type: 'error',
                    text: 'Failed to add image. Please check Firebase permissions or see console for details.'
                });
            }
        } catch (error) {
            // console.error('❌ Error adding gallery image:', error);
            setMessage({
                type: 'error',
                text: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsUploading(false);
        }
    };

    // State for gallery images
    const [images, setImages] = useState<any[]>([]);

    // Subscribe to gallery images
    React.useEffect(() => {
        const unsubscribe = subscribeToGalleryImages((newImages: any[]) => {
            setImages(newImages);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            await deleteGalleryImage(id);
            // State update handled by subscription
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1 flex items-center gap-2">
                    <span>📸</span> Event Gallery Upload
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                    Upload event photos by pasting the image link from your cloud storage
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div>
                    <label htmlFor="imageUrl" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                        Image URL
                    </label>
                    <input
                        type="text"
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://your-cloud-storage.com/image.jpg"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm font-medium"
                        disabled={isUploading}
                    />
                </div>

                {message && (
                    <div className={`px-4 py-3 rounded-xl text-sm font-bold ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-full px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg ${isUploading
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200'
                        }`}
                >
                    {isUploading ? 'Adding to Gallery...' : 'Add to Gallery'}
                </button>
            </form>

            <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-4">
                    Uploaded Images ({images.length})
                </h4>

                {images.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">No images uploaded yet.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img) => (
                            <div key={img.id} className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={img.imageUrl}
                                    alt="Gallery"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image'; }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDelete(img.id)}
                                        className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-lg"
                                        title="Delete Image"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                    <p className="text-[10px] text-white/80 truncate">
                                        {new Date(img.createdAt?.seconds * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-600 mb-2">💡 Instructions:</p>
                <ul className="text-xs text-slate-500 space-y-1 font-medium">
                    <li>• Upload your image to your cloud storage (Google Drive, Dropbox, etc.)</li>
                    <li>• Get the direct image link from your cloud storage</li>
                    <li>• Paste the link above and click "Add to Gallery"</li>
                    <li>• The image will appear on the public landing page</li>
                </ul>
            </div>
        </div>
    );
};

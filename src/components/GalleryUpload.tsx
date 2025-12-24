import React, { useState } from 'react';
import { addGalleryImage } from '../services/firestore.service';

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
            console.log('🔵 Attempting to add gallery image:', imageUrl);
            const result = await addGalleryImage(imageUrl, 'Green Room');
            console.log('📊 Result from addGalleryImage:', result);

            if (result) {
                console.log('✅ Image added successfully with ID:', result);
                setMessage({ type: 'success', text: 'Image added to gallery successfully!' });
                setImageUrl('');
            } else {
                console.error('❌ addGalleryImage returned null - Check Firebase rules and permissions');
                setMessage({
                    type: 'error',
                    text: 'Failed to add image. Please check Firebase permissions or see console for details.'
                });
            }
        } catch (error) {
            console.error('❌ Error adding gallery image:', error);
            setMessage({
                type: 'error',
                text: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">
                    📸 Event Gallery Upload
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                    Upload event photos by pasting the image link from your cloud storage
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
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

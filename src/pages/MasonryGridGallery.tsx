interface GalleryImage {
  id?: string;
  imageUrl: string;
  uploadedBy?: string;
}

interface MasonryGridGalleryProps {
  images: GalleryImage[];
  limit?: number; // 👈 NEW (optional)
}

export function MasonryGridGallery({
  images,
  limit,
}: MasonryGridGalleryProps) {
  console.log(images);

  // 👇 Apply limit ONLY if provided
  const displayImages = limit ? images.slice(0, limit) : images;

  return (
    <>
      {displayImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {displayImages.map((image, index) => (
            <div key={image.id || index} className="grid gap-4">
              <div className="relative group">
                <img
                  className="h-auto max-w-full rounded-lg object-cover object-center"
                  src={image.imageUrl}
                  alt={image.uploadedBy || "Gallery Image"}
                  loading="lazy"
                />

                {/* OPTIONAL: invisible download (no design change) */}
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(image.imageUrl);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);

                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `gallery-image-${index + 1}.jpg`;
                      a.click();

                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error("Download failed", err);
                    }
                  }}
                  title="Download image"
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
            No Images Yet
          </h3>
          <p className="text-slate-500 font-medium">
            Gallery images will appear here once they are uploaded
          </p>
        </div>
      )}
    </>
  );
}

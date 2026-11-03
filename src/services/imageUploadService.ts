const MAX_BYTES = 15 * 1024 * 1024;
// Images are stored in the database as data URLs (the free plan has no server to keep an
// image-host key secret). Kept under ~3 MB so pages that show them still load quickly.
const MAX_DATA_URL_CHARS = 3_000_000;
const MAX_SIDE = 3000;

const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error || new Error('Could not read the file'));
  reader.readAsDataURL(file);
});

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('This file could not be read as an image.'));
  img.src = src;
});

/**
 * Turns an uploaded background into a data URL to save with the fest. Small images are kept
 * as they are; larger ones are scaled down and re-encoded until they fit.
 */
export const uploadImage = async (file: File): Promise<string> => {
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 15 MB).');
  }
  const original = await readAsDataUrl(file);
  if (original.length <= MAX_DATA_URL_CHARS && /^data:image\/(png|jpe?g|webp);/i.test(original)) {
    return original;
  }

  const img = await loadImage(original);
  const keepTransparency = /^data:image\/(png|webp);/i.test(original);
  let scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const encoded = keepTransparency
      ? canvas.toDataURL('image/webp', 0.9)
      : canvas.toDataURL('image/jpeg', attempt < 2 ? 0.92 : 0.85);
    if (encoded.length <= MAX_DATA_URL_CHARS) return encoded;
    scale *= 0.8;
  }
  throw new Error('This image is too detailed to store. Please use a smaller image (under 3 MB).');
};

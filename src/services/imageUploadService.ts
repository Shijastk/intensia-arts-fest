import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const MAX_BYTES = 7 * 1024 * 1024;

const readAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).replace(/^data:[^;]+;base64,/, ''));
  reader.onerror = () => reject(reader.error || new Error('Could not read the file'));
  reader.readAsDataURL(file);
});

/**
 * Uploads through the uploadImage Cloud Function so the ImgBB API key stays on the
 * server. Only the fest admin may upload.
 */
export const uploadImageToImgBB = async (file: File, festId: string): Promise<string> => {
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 7 MB).');
  }

  try {
    const imageBase64 = await readAsBase64(file);
    const upload = httpsCallable<{ festId: string; imageBase64: string; fileName: string }, { url: string }>(functions, 'uploadImage');
    const { data } = await upload({ festId, imageBase64, fileName: file.name });
    return data.url; // Return the direct image URL
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
};

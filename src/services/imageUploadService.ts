export const uploadImageToImgBB = async (file: File): Promise<string> => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_IMGBB_API_KEY is not defined in environment variables');
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', apiKey);

  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ImgBB upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data.url; // Return the direct image URL
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
};

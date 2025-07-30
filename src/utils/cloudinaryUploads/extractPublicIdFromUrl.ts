// Extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    console.log('Extracting public ID from URL:', url);
    
    // Example URL: https://res.cloudinary.com/daoktsoq3/video/upload/v1753904373/hip-physio/exercises/videos/xr7w5oczm3nd7cnq0gjx.mp4
    
    // Split by '/' and find the upload part
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      console.log('Could not find upload in URL');
      return null;
    }
    
    // Get everything after 'upload' and before the file extension
    const pathAfterUpload = urlParts.slice(uploadIndex + 1);
    const fullPath = pathAfterUpload.join('/');
    
    // Remove file extension
    const pathWithoutExtension = fullPath.replace(/\.[^/.]+$/, '');
    
    // Remove version number if present (starts with 'v' followed by numbers)
    const publicId = pathWithoutExtension.replace(/^v\d+\//, '');
    
    console.log('Extracted public ID:', publicId);
    return publicId;
    
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Test function to verify public ID extraction
export const testPublicIdExtraction = () => {
  const testUrls = [
    'https://res.cloudinary.com/daoktsoq3/video/upload/v1753904373/hip-physio/exercises/videos/xr7w5oczm3nd7cnq0gjx.mp4',
    'https://res.cloudinary.com/daoktsoq3/image/upload/v1753904385/hip-physio/exercises/thumbnails/ybh4n6ujsfwhwiorgjgl.jpg'
  ];
  
  testUrls.forEach(url => {
    const publicId = extractPublicIdFromUrl(url);
    console.log(`URL: ${url}`);
    console.log(`Extracted Public ID: ${publicId}`);
    console.log('---');
  });
};
/**
 * Triggers a browser download for an image URL.
 * @param {string} url - The URL of the image.
 * @param {string} filename - The desired filename for the download.
 */
export const downloadImage = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'downloaded-image.png';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Error downloading image:", error);
    alert("Failed to download image. Please try opening it in a new tab instead.");
  }
};

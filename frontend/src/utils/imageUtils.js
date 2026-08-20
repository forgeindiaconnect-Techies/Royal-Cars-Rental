/**
 * Utility functions for image handling, formatting, and fallbacks.
 */

export const DEFAULT_VEHICLE_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600';
export const DEFAULT_DRIVER_IMAGE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
export const DEFAULT_LICENSE_FRONT = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80';
export const DEFAULT_LICENSE_BACK = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80';
export const DEFAULT_COMPANY_LOGO = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&auto=format&fit=crop&q=80';
export const DEFAULT_LOCATION_IMAGE = 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80';

export const REAL_HUMAN_FACE_PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
];

/**
 * Returns a valid image URL or fallback URL if empty or broken
 */
export function getValidImageUrl(url, type = 'vehicle') {
  if (!url || typeof url !== 'string' || !url.trim() || url === 'undefined' || url === 'null' || url.length < 5) {
    return type === 'driver'
      ? DEFAULT_DRIVER_IMAGE
      : type === 'license'
      ? DEFAULT_LICENSE_FRONT
      : type === 'company' || type === 'logo'
      ? DEFAULT_COMPANY_LOGO
      : type === 'location'
      ? DEFAULT_LOCATION_IMAGE
      : DEFAULT_VEHICLE_IMAGE;
  }
  let cleanUrl = url.trim();

  // If broken bus image was stored, replace with default scenic location image
  if (type === 'location' && cleanUrl.includes('photo-1570125909232-eb263c188f7e')) {
    return DEFAULT_LOCATION_IMAGE;
  }

  // Automatically extract target direct image URL from Google Images imgres / imgurl links
  if (cleanUrl.includes('google.com/imgres') || cleanUrl.includes('imgurl=')) {
    try {
      const match = cleanUrl.match(/imgurl=([^&]+)/);
      if (match && match[1]) {
        cleanUrl = decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }

  if (cleanUrl.startsWith('data:image/') || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  if (cleanUrl.startsWith('/uploads/')) {
    return `http://localhost:5000${cleanUrl}`;
  }
  return cleanUrl;
}

/**
 * Converts a file input object into a Base64 Data URL string for reliable local display
 */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Image onError handler to set default fallback image when image loading fails
 */
export function handleImageError(e, type = 'vehicle') {
  e.target.onerror = null; // Prevent infinite loop
  e.target.src = type === 'driver'
    ? DEFAULT_DRIVER_IMAGE
    : type === 'license'
    ? DEFAULT_LICENSE_FRONT
    : type === 'company' || type === 'logo'
    ? DEFAULT_COMPANY_LOGO
    : type === 'location'
    ? DEFAULT_LOCATION_IMAGE
    : DEFAULT_VEHICLE_IMAGE;
}

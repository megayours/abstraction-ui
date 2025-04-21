/**
 * URL detection and metadata utilities
 */

// Regex for URL detection including ipfs links
const URL_REGEX = /^(https?:\/\/|ipfs:\/\/|ipns:\/\/)[^\s/$.?#].[^\s]*$/i;

// Regex to detect image URLs by extension
const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|tiff)$/i;

/**
 * Check if a string is a URL (including ipfs)
 */
export const isUrl = (str: string): boolean => {
  return URL_REGEX.test(str.trim());
};

/**
 * Check if a URL is likely an image based on extension
 */
export const isLikelyImage = (url: string): boolean => {
  return IMAGE_EXTENSION_REGEX.test(url);
};

/**
 * Utility types for URL metadata
 */
export type UrlMetadata = {
  url: string;
  contentType: string | null;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isPdf: boolean;
  isText: boolean;
  isHtml: boolean;
  isJson: boolean;
  error?: string;
};

/**
 * Convert IPFS URL to HTTP gateway URL if needed
 */
export const normalizeIpfsUrl = (url: string): string => {
  if (url.startsWith('ipfs://')) {
    // Use public IPFS gateway
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  if (url.startsWith('ipns://')) {
    return url.replace('ipns://', 'https://ipfs.io/ipns/');
  }
  return url;
};

/**
 * Fetch metadata about a URL without downloading the full resource
 */
export const fetchUrlMetadata = async (url: string): Promise<UrlMetadata> => {
  const normalizedUrl = normalizeIpfsUrl(url);
  
  // First, check if URL likely points to an image by extension
  const extensionMatch = isLikelyImage(normalizedUrl);
  
  // Create base metadata object
  const baseMetadata: UrlMetadata = {
    url: normalizedUrl,
    contentType: null,
    isImage: extensionMatch, // Trust extension initially
    isVideo: false,
    isAudio: false,
    isPdf: false,
    isText: false,
    isHtml: false,
    isJson: false,
  };
  
  try {
    // First try HEAD request to get content type without fetching entire resource
    try {
      const headResponse = await fetch(normalizedUrl, { 
        method: 'HEAD',
        mode: 'cors',
      });
      
      if (headResponse.ok) {
        const contentType = headResponse.headers.get('content-type');
        if (contentType) {
          return {
            ...baseMetadata,
            contentType,
            isImage: contentType.startsWith('image/') || baseMetadata.isImage,
            isVideo: contentType.startsWith('video/'),
            isAudio: contentType.startsWith('audio/'),
            isPdf: contentType === 'application/pdf',
            isText: contentType.startsWith('text/plain'),
            isHtml: contentType.startsWith('text/html'),
            isJson: contentType === 'application/json',
          };
        }
      }
    } catch (headError) {
      // HEAD request failed, we'll fall back to a small GET request
      console.warn('HEAD request failed, falling back to GET', headError);
    }
    
    // If the HEAD request failed or didn't return a content type,
    // make a GET request with a range header to fetch just the first few bytes
    const getResponse = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-1024', // Only request the first 1KB to detect type
      },
      mode: 'cors',
    });
    
    if (!getResponse.ok && !getResponse.headers.get('content-type')) {
      return {
        ...baseMetadata,
        error: `Failed to fetch URL: ${getResponse.status} ${getResponse.statusText}`
      };
    }
    
    const contentType = getResponse.headers.get('content-type');
    
    return {
      ...baseMetadata,
      contentType,
      isImage: contentType?.startsWith('image/') || baseMetadata.isImage,
      isVideo: contentType?.startsWith('video/') ?? false,
      isAudio: contentType?.startsWith('audio/') ?? false,
      isPdf: contentType === 'application/pdf',
      isText: contentType?.startsWith('text/plain') ?? false,
      isHtml: contentType?.startsWith('text/html') ?? false,
      isJson: contentType === 'application/json',
    };
  } catch (error) {
    // Even if requests fail, we can still make a reasonable guess based on extension
    if (extensionMatch) {
      return {
        ...baseMetadata,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    return {
      ...baseMetadata,
      isImage: false, // Clear the extension-based guess if we get an error
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 
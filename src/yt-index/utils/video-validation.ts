// Video validation utilities
const VIDEO_ID_REGEX =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:\?|$|&)/;

export type VideoValidationResult = {
  isValid: boolean;
  videoId: string | null;
  error?: string;
};

/**
 * Validates if a URL is a valid YouTube video URL and extracts the video ID
 */
export function validateYouTubeVideo(url: string): VideoValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      videoId: null,
      error: 'URL is required and must be a string',
    };
  }

  // Check if it's a valid URL format
  try {
    new URL(url);
  } catch {
    return {
      isValid: false,
      videoId: null,
      error: 'Invalid URL format',
    };
  }

  // Extract video ID using regex
  const match = url.match(VIDEO_ID_REGEX);
  if (!match || !match[1]) {
    return {
      isValid: false,
      videoId: null,
      error: 'Not a valid YouTube video URL',
    };
  }

  const videoId = match[1];
  
  // Validate video ID format (should be 11 characters)
  if (videoId.length !== 11) {
    return {
      isValid: false,
      videoId: null,
      error: 'Invalid video ID format',
    };
  }

  return {
    isValid: true,
    videoId,
  };
}

/**
 * Checks if a video ID exists by attempting to fetch metadata
 */
export async function checkVideoExists(videoId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    return response.ok;
  } catch {
    return false;
  }
}

export interface YouTubeValidationResult {
  isValid: boolean;
  videoId: string | null;
  errorMessage?: string;
}

/**
 * Extracts YouTube Video ID from various YouTube URL formats.
 * Supports standard watch, short URLs (youtu.be), embed URLs, and shorts.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pattern matches:
  // - youtube.com/watch?v=VIDEO_ID
  // - youtu.be/VIDEO_ID
  // - youtube.com/embed/VIDEO_ID
  // - youtube.com/shorts/VIDEO_ID
  // - youtube.com/v/VIDEO_ID
  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  return match ? match[1] : null;
}

/**
 * Validates whether an input string is a valid, supported YouTube video URL.
 */
export function validateYouTubeUrl(url: string): YouTubeValidationResult {
  const trimmed = url.trim();

  if (!trimmed) {
    return {
      isValid: false,
      videoId: null,
      errorMessage: 'Please enter a YouTube video URL.',
    };
  }

  // Check if it looks like a URL
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const hostname = parsed.hostname.toLowerCase();
    
    if (
      !hostname.includes('youtube.com') &&
      !hostname.includes('youtu.be')
    ) {
      return {
        isValid: false,
        videoId: null,
        errorMessage: 'Only YouTube video links are supported (e.g. youtube.com or youtu.be).',
      };
    }
  } catch {
    return {
      isValid: false,
      videoId: null,
      errorMessage: 'Invalid URL format. Please paste a valid web link.',
    };
  }

  const videoId = extractYouTubeId(trimmed);

  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      errorMessage: 'Could not detect a valid 11-character YouTube video ID in this link.',
    };
  }

  return {
    isValid: true,
    videoId,
  };
}

/**
 * Returns thumbnail URLs for a YouTube video.
 */
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}


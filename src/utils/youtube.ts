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

export interface YouTubeMetadata {
  title: string;
  author: string;
  cleanTitle: string;
  cleanArtist: string;
}

/**
 * Strips common YouTube video noise such as "(Official Video)", "[Remastered]", etc.
 * and attempts to isolate the artist and song title.
 */
export function cleanTrackTitle(rawTitle: string, authorName?: string): { artist: string; title: string } {
  // Strip common YouTube tag fluff: (Official Music Video), [Official Audio], (4K 60FPS), etc.
  const clean = rawTitle
    .replace(/\s*[[([][^\])]*(?:official|video|audio|remaster|hd|4k|lyric|visualizer|clip|explicit)[^\])]*[)\]]/gi, '')
    .trim();

  // If there's a delimiter like "Artist - Title" or "Artist : Title"
  const delimiterMatch = clean.match(/^(.+?)\s*[-–—:|]\s*(.+)$/);
  if (delimiterMatch) {
    return {
      artist: delimiterMatch[1].trim(),
      title: delimiterMatch[2].trim(),
    };
  }

  return {
    artist: authorName?.replace(/\s*-\s*Topic$/i, '').trim() || '',
    title: clean,
  };
}

/**
 * Uses public CORS-enabled oEmbed to fetch video title and channel/artist without an API key.
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  try {
    const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (resp.ok) {
      const data = await resp.json();
      const rawTitle = data.title || `YouTube Video (${videoId})`;
      const author = data.author_name || '';
      const { artist, title } = cleanTrackTitle(rawTitle, author);
      return {
        title: rawTitle,
        author,
        cleanArtist: artist,
        cleanTitle: title,
      };
    }
  } catch (err) {
    console.warn('YouTube oEmbed metadata fetch failed:', err);
  }

  return {
    title: `YouTube Video (${videoId})`,
    author: '',
    cleanArtist: '',
    cleanTitle: `YouTube Video (${videoId})`,
  };
}

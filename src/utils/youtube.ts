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
 * Strips common YouTube video noise such as "(Official Video)", "[Remastered]", "(Directed by ...)", "ft. ...", etc.
 * and cleanly isolates the artist and song title for exact lyrics matching.
 */
export function cleanTrackTitle(rawTitle: string, authorName?: string): { artist: string; title: string } {
  if (!rawTitle) return { artist: authorName || '', title: '' };

  // 1. Clean author name if provided (strip VEVO, - Topic, Official, etc.)
  const cleanAuthor = authorName
    ? authorName
        .replace(/VEVO$/i, '')
        .replace(/\s*-\s*Topic$/i, '')
        .replace(/\s*(?:official|channel|music|records|media|entertainment)$/i, '')
        .trim()
    : '';

  // 2. Strip bracketed and parenthetical noise from raw title
  let clean = rawTitle
    .replace(/\s*[[({][^\])}]*[\])}]/g, ' ')
    // Remove decorative quotes around title e.g. Artist - "Title"
    .replace(/["“”'‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let artist = '';
  let title = clean;

  // 3. Delimiter split: "Artist - Title", "Artist — Title", "Artist : Title", "Artist | Title"
  const delimRegex = /\s+[-–—:|/]\s+/;
  if (delimRegex.test(clean)) {
    const parts = clean.split(delimRegex).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const p0 = parts[0];
      const p1 = parts.slice(1).join(' - ');

      // Check if cleanAuthor matches Part 2 (e.g. Title - Artist)
      if (cleanAuthor && p1.toLowerCase().includes(cleanAuthor.toLowerCase())) {
        artist = p1;
        title = p0;
      } else {
        artist = p0;
        title = p1;
      }
    }
  }

  // 3b. Handle "Title by Artist" or "Artist - Title" format
  if (!artist && /\s+by\s+/i.test(clean)) {
    const byMatch = clean.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) {
      title = byMatch[1].trim();
      artist = byMatch[2].trim();
    }
  }

  // 4. Fallback artist to cleaned author if not isolated from title
  if (!artist && cleanAuthor) {
    artist = cleanAuthor;
  }

  // 5. Strip trailing "ft. ..." or "feat. ..." from title for clean metadata lookup
  title = title.replace(/\s*(?:ft\.?|feat\.?|featuring)\s+.*$/i, '').trim();

  return {
    artist: artist || cleanAuthor || '',
    title: title || rawTitle,
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
      if (!data.error && data.title) {
        const rawTitle = data.title;
        const author = data.author_name || '';
        const { artist, title } = cleanTrackTitle(rawTitle, author);
        return {
          title: rawTitle,
          author,
          cleanArtist: artist,
          cleanTitle: title,
        };
      }
    }
  } catch (err) {
    console.warn('YouTube oEmbed metadata fetch failed:', err);
  }

  return {
    title: `YouTube Video (${videoId})`,
    author: '',
    cleanArtist: '',
    cleanTitle: '',
  };
}

/**
 * Verified intro scene durations (in seconds) for official music videos.
 * Accounts for acting, director title sequences, and cinematic preambles
 * before the musical track begins.
 */
export const KNOWN_VIDEO_INTROS: Record<string, number> = {
  BY_XwvKogC8: 0.0, // Billie Eilish - CHIHIRO (Official Music Video - Calibrated in CuratedTracks)
  iI34LYmJ1Fs: 0.0, // Juice WRLD - Robbery (Official Music Video - Calibrated in CuratedTracks)
  i9AHJkHqkpw: 0.0, // Juice WRLD - Robbery (Calibrated)
  mzB1VGEGcSU: 0.0, // Juice WRLD - Lucid Dreams
  '5SejM_hBvMM': 0.0, // Juice WRLD - Lean Wit Me
  h3EJICKwITw: 0.0, // Juice WRLD - All Girls Are The Same
  _BNpHQ6O1eM: 0.0, // Juice WRLD - Bandit
  HA1srD2DwaI: 18.0, // Juice WRLD - Burn (Intro dialogue scene)
  oI02Yx_wNq0: 0.0, // Juice WRLD - Righteous
  '2BCkS_d_w2E': 0.0, // Juice WRLD - Wishing Well
  'D15-hY_uWpQ': 0.0, // Juice WRLD - Come & Go
  hU_U_sU5zVw: 0.0, // Juice WRLD - Armed and Dangerous
  W05p_B5aV2c: 0.0, // Juice WRLD - Black & White
  U3ASj1L6_sY: 0.0, // Adele - Easy On Me (Curated)
  YQHsXMglC9A: 68.0, // Adele - Hello (Cinematic preamble and phone conversation)
  rYEDA3JcQqw: 0.0, // Adele - Rolling in the Deep
  hLQl3WQQoQ0: 0.0, // Adele - Someone Like You
  yKNxeF4KMsY: 0.0, // Coldplay - Yellow
  'RB-RcX5DS5A': 0.0, // Coldplay - The Scientist
  k4V3Mo61fJM: 0.0, // Coldplay - Fix You
  dvgZkm1xWPE: 0.0, // Coldplay - Viva La Vida
  '5NV6Rdv1a3I': 0.0, // Daft Punk - Get Lucky
  'gAjR4_8-1xs': 0.0, // Daft Punk - Harder, Better, Faster, Stronger
  FGBhQbmMxH8: 0.0, // Daft Punk - One More Time
  fJ9rUzIMcZQ: 0.0, // Queen - Bohemian Rhapsody
  HgzGwKwLmgM: 0.0, // Queen - Don't Stop Me Now
  '4NRXx6U8ABQ': 28.0, // The Weeknd - Blinding Lights (Car driving scene intro)
  XXYlFuWEuKI: 0.0, // The Weeknd - Save Your Tears
  '34Na4j8AVgA': 0.0, // The Weeknd - Starboy
  yzTuBuRdAyA: 0.0, // The Weeknd - The Hills
  DyDFGw5426A: 14.0, // Billie Eilish - bad guy (Opening wall break)
  xpVfcZ0ZcFM: 34.0, // Drake - God's Plan (Budget donation title sequence)
  YVkUvmDQ3HY: 15.0, // Eminem - Without Me (Rap Boy intro)
  '_Yhyp-_hX2s': 32.0, // Eminem - Lose Yourself (Trailer scene)
};

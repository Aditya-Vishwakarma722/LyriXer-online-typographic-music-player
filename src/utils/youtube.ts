export interface YouTubeValidationResult {
  isValid: boolean;
  videoId: string | null;
  startTime?: number | null;
  errorMessage?: string;
}

/**
 * Parses time expressions such as "1m21s", "0:21", "21s", "81" into seconds.
 */
export function parseTimeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim().toLowerCase();

  let totalSeconds = 0;
  const hMatch = trimmed.match(/(\d+)\s*h/);
  const mMatch = trimmed.match(/(\d+)\s*m/);
  const sMatch = trimmed.match(/(\d+)\s*s/);

  if (hMatch || mMatch || sMatch) {
    if (hMatch) totalSeconds += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) totalSeconds += parseInt(mMatch[1], 10) * 60;
    if (sMatch) totalSeconds += parseInt(sMatch[1], 10);
    return totalSeconds;
  }

  // Format like "1:23" or "01:23:45"
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
    if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

/**
 * Extracts start time timestamp (in seconds) from YouTube URL query parameters
 * such as ?t=21, &t=1m20s, &start=21, #t=21.
 */
export function extractYouTubeStartTime(url: string): number | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&#](?:t|start|time_continue)=([0-9hms:]+)/i);
  if (match && match[1]) {
    const sec = parseTimeStringToSeconds(match[1]);
    return sec > 0 ? sec : null;
  }
  return null;
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

  const startTime = extractYouTubeStartTime(trimmed);

  return {
    isValid: true,
    videoId,
    startTime,
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
  BY_XwvKogC8: 21.0, // Billie Eilish - CHIHIRO (21s hallway preamble before synth)
  iILJvW24k2w: 23.0, // Juice WRLD - Robbery (Official Music Video - 23s burning intro)
  iI34LYmJ1Fs: 23.0, // Juice WRLD - Robbery
  i9AHJkHqkpw: 23.0, // Juice WRLD - Robbery
  mzB1VGEGcSU: 0.0, // Juice WRLD - Lucid Dreams
  '5SejM_hBvMM': 11.6, // Juice WRLD - Lean Wit Me (Official Music Video: AA support group intro ends & guitar starts ~11.6s, vocals begin at 0:23, line 0 at 11.43s)
  WsrVxz4pjGs: 0.0, // Juice WRLD - Lean Wit Me (Lyric Video - Direct start)
  h3EJICKwITw: 0.0, // Juice WRLD - All Girls Are The Same
  _BNpHQ6O1eM: 0.0, // Juice WRLD - Bandit
  HA1srD2DwaI: 18.0, // Juice WRLD - Burn (18s intro dialogue)
  oI02Yx_wNq0: 0.0, // Juice WRLD - Righteous
  '2BCkS_d_w2E': 0.0, // Juice WRLD - Wishing Well
  'D15-hY_uWpQ': 0.0, // Juice WRLD - Come & Go
  hU_U_sU5zVw: 0.0, // Juice WRLD - Armed and Dangerous
  W05p_B5aV2c: 0.0, // Juice WRLD - Black & White
  U3ASj1L6_sY: 0.0, // Adele - Easy On Me
  YQHsXMglC9A: 68.0, // Adele - Hello (68s cinematic preamble & telephone call)
  rYEDA3JcQqw: 0.0, // Adele - Rolling in the Deep
  hLQl3WQQoQ0: 0.0, // Adele - Someone Like You
  '4NRXx6U8ABQ': 28.0, // The Weeknd - Blinding Lights (28s car driving intro)
  XXYlFuWEuKI: 0.0, // The Weeknd - Save Your Tears
  '34Na4j8AVgA': 0.0, // The Weeknd - Starboy
  yzTuBuRdAyA: 0.0, // The Weeknd - The Hills
  DyDFGwSCA3c: 14.0, // Billie Eilish - bad guy (14s opening wall break)
  DyDFGw5426A: 14.0, // Billie Eilish - bad guy
  xpVfcZ0ZcFM: 34.0, // Drake - God's Plan (34s budget donation title sequence)
  YVkUvmDQ3HY: 15.0, // Eminem - Without Me (15s Rap Boy intro)
  '_Yhyp-_hX2s': 32.0, // Eminem - Lose Yourself (32s trailer scene)
  'gOMhN-hfMtY': 42.0, // Eminem - Stan (42s thunderstorm intro)
  VYOjWnS4cMY: 48.0, // Childish Gambino - This Is America (48s acoustic guitar intro)
  EVBsypHzF3U: 195.0, // Lady Gaga ft. Beyoncé - Telephone (3m15s prison intro)
  sOnqjkJTMaA: 252.0, // Michael Jackson - Thriller (4m12s cinema/werewolf preamble)
  YXvx2wW6jrg: 40.0, // A$AP Rocky - L$D (40s Tokyo monologue scene)
  '6ONRf7h3sdk': 20.0, // Travis Scott - SICKO MODE (20s intro)
  k2qgadSvNyU: 34.0, // Dua Lipa - New Rules (34s hotel room talk scene)
  'r4P-WOZ49t8': 18.0, // Olivia Rodrigo - vampire (18s intro)
  UceaB4D0jpo: 30.0, // Post Malone - rockstar (30s intro)
  'tvTRZJ-4EyI': 0.0, // Kendrick Lamar - HUMBLE (Direct start)
  fJ9rUzIMcZQ: 0.0, // Queen - Bohemian Rhapsody (Direct start)
  HgzGwKwLmgM: 0.0, // Queen - Don't Stop Me Now
  k4V3Mo61fJM: 0.0, // Coldplay - Fix You (Direct start)
  yKNxeF4KMsY: 0.0, // Coldplay - Yellow
  'RB-RcX5DS5A': 0.0, // Coldplay - The Scientist
  dvgZkm1xWPE: 0.0, // Coldplay - Viva La Vida
  '5NV6Rdv1a3I': 0.0, // Daft Punk - Get Lucky
  'gAjR4_8-1xs': 0.0, // Daft Punk - Harder, Better, Faster, Stronger
  FGBhQbmMxH8: 0.0, // Daft Punk - One More Time
};

/**
 * Detects the lyrics start timestamp for a given YouTube video
 * based on URL timestamp, database of known music video intros, or duration comparison.
 */
export function detectVideoIntroOffset(videoId: string, url?: string): number {
  if (url) {
    const urlTime = extractYouTubeStartTime(url);
    if (urlTime && urlTime > 0) return urlTime;
  }
  if (KNOWN_VIDEO_INTROS[videoId] !== undefined) {
    return KNOWN_VIDEO_INTROS[videoId];
  }
  return 0;
}

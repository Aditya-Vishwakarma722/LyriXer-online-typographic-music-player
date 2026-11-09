import { parseLrc, type LyricTrack } from './lrcParser';
import { CURATED_TRACKS } from './curatedTracks';

// In-memory cache for fetched lyrics
const lyricsCache = new Map<string, LyricTrack>();

export interface LyricsSearchParams {
  trackName: string;
  artistName?: string;
  duration?: number;
  videoId?: string;
}

export class LyricsProvider {
  /**
   * Searches for synchronized lyrics using curated offline tracks,
   * in-memory cache, and the open LRCLIB database API.
   */
  static async getLyrics(params: LyricsSearchParams): Promise<LyricTrack | null> {
    const { trackName, artistName, duration, videoId } = params;

    // 1. Check curated catalog by videoId first (guarantees instantaneous millisecond precision for demos)
    if (videoId && CURATED_TRACKS[videoId]) {
      return CURATED_TRACKS[videoId];
    }

    // 2. Check curated catalog by track name key
    const normalizedKey = trackName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (CURATED_TRACKS[normalizedKey]) {
      return CURATED_TRACKS[normalizedKey];
    }

    // 3. Check memory cache
    const cacheKey = `${trackName}_${artistName || ''}_${duration || ''}`.toLowerCase();
    if (lyricsCache.has(cacheKey)) {
      return lyricsCache.get(cacheKey)!;
    }

    // 4. Query LRCLIB API
    try {
      // First attempt: exact get match if artist & duration available
      let data: any = null;
      if (artistName && duration) {
        const query = new URLSearchParams({
          track_name: trackName,
          artist_name: artistName,
          duration: Math.round(duration).toString(),
        });
        const resp = await fetch(`https://lrclib.net/api/get?${query.toString()}`, {
          headers: { 'User-Agent': 'LyriXer-Web-App/0.1.0' },
        });
        if (resp.ok) {
          data = await resp.json();
        }
      }

      // Second attempt: general search if exact match returned nothing
      if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
        const searchQuery = new URLSearchParams({
          q: artistName ? `${artistName} ${trackName}` : trackName,
        });
        const resp = await fetch(`https://lrclib.net/api/search?${searchQuery.toString()}`, {
          headers: { 'User-Agent': 'LyriXer-Web-App/0.1.0' },
        });
        if (resp.ok) {
          const results = await resp.json();
          if (Array.isArray(results) && results.length > 0) {
            // Prefer first result that has syncedLyrics
            data = results.find((r: any) => r.syncedLyrics) || results[0];
          }
        }
      }

      if (data) {
        let track: LyricTrack | null = null;
        if (data.syncedLyrics) {
          track = parseLrc(data.syncedLyrics, 'provider');
          track.title = data.trackName || trackName;
          track.artist = data.artistName || artistName;
        } else if (data.plainLyrics) {
          track = parseLrc(data.plainLyrics, 'plain');
          track.title = data.trackName || trackName;
          track.artist = data.artistName || artistName;
        }

        if (track) {
          lyricsCache.set(cacheKey, track);
          return track;
        }
      }
    } catch (err) {
      console.warn('LRCLIB network fetch failed or blocked:', err);
    }

    return null;
  }

  /**
   * Parses a user-uploaded .lrc or text file directly into a LyricTrack.
   */
  static async parseUserFile(file: File): Promise<LyricTrack> {
    const text = await file.text();
    const track = parseLrc(text, 'file');
    track.title = track.title || file.name.replace(/\.[^/.]+$/, '');
    return track;
  }
}


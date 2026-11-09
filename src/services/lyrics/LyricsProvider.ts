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

export interface LrclibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string;
  plainLyrics?: string;
}

export class LyricsProvider {
  /**
   * Searches for synchronized lyrics directly from LRCLIB (https://lrclib.net).
   * Checks curated fallback tracks, in-memory cache, and the live open LRCLIB database API.
   */
  static async getLyrics(params: LyricsSearchParams): Promise<LyricTrack | null> {
    const { trackName, artistName, duration, videoId } = params;

    // 1. Check curated catalog by videoId first (instant precision for demo tracks)
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

    // 4. Query live LRCLIB API (https://lrclib.net)
    try {
      let data: LrclibSearchResult | null = null;

      // First attempt: exact get match if artist & duration available
      if (artistName && duration) {
        try {
          const query = new URLSearchParams({
            track_name: trackName,
            artist_name: artistName,
            duration: Math.round(duration).toString(),
          });
          const resp = await fetch(`https://lrclib.net/api/get?${query.toString()}`, {
            headers: { 'User-Agent': 'LyriXer/1.0.0 (https://github.com/LyriXer)' },
          });
          if (resp.ok) {
            data = await resp.json();
          }
        } catch {
          // ignore and fallback to search
        }
      }

      // Second attempt: general search with both artist and track name
      if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
        const queryTerm = artistName ? `${artistName} ${trackName}` : trackName;
        const results = await this.searchLrclib(queryTerm);
        if (results.length > 0) {
          // Prefer first result that has syncedLyrics
          data = results.find((r) => Boolean(r.syncedLyrics)) || results[0];
        }
      }

      // Third attempt: fallback search using track name alone
      if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
        const results = await this.searchLrclib(trackName);
        if (results.length > 0) {
          data = results.find((r) => Boolean(r.syncedLyrics)) || results[0];
        }
      }

      if (data) {
        const track = this.convertLrclibItemToTrack(data, trackName, artistName);
        if (track) {
          lyricsCache.set(cacheKey, track);
          return track;
        }
      }
    } catch (err) {
      console.warn('LRCLIB network fetch failed:', err);
    }

    return null;
  }

  /**
   * Direct search on LRCLIB API (https://lrclib.net/api/search?q=...)
   */
  static async searchLrclib(query: string): Promise<LrclibSearchResult[]> {
    if (!query.trim()) return [];
    try {
      const resp = await fetch(
        `https://lrclib.net/api/search?${new URLSearchParams({ q: query.trim() }).toString()}`,
        {
          headers: { 'User-Agent': 'LyriXer/1.0.0 (https://github.com/LyriXer)' },
        }
      );
      if (resp.ok) {
        const json = await resp.json();
        return Array.isArray(json) ? json : [];
      }
    } catch (err) {
      console.warn('LRCLIB search request failed:', err);
    }
    return [];
  }

  /**
   * Converts an LRCLIB API item into our parsed LyricTrack.
   */
  static convertLrclibItemToTrack(
    item: LrclibSearchResult,
    fallbackTitle?: string,
    fallbackArtist?: string
  ): LyricTrack | null {
    let track: LyricTrack | null = null;

    if (item.syncedLyrics) {
      track = parseLrc(item.syncedLyrics, 'provider');
      track.title = item.trackName || fallbackTitle || 'Untitled';
      track.artist = item.artistName || fallbackArtist;
    } else if (item.plainLyrics) {
      track = parseLrc(item.plainLyrics, 'plain');
      track.title = item.trackName || fallbackTitle || 'Untitled';
      track.artist = item.artistName || fallbackArtist;
    }

    return track;
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


import { parseLrc, type LyricTrack } from './lrcParser';
import { CURATED_TRACKS } from './curatedTracks';
import { cleanTrackTitle } from '../../utils/youtube';

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

/**
 * Calculates a match score (0 to 100+) evaluating how closely an LRCLIB candidate
 * matches the currently playing song's title, artist, and duration.
 *
 * CRITICAL RULE: The candidate MUST match the requested song title. If the title
 * doesn't match, it is an entirely different song and is rejected (-999).
 */
function scoreCandidate(
  candidate: LrclibSearchResult,
  targetTitle: string,
  targetArtist?: string,
  targetDuration?: number
): number {
  const candTitle = (candidate.trackName || '').toLowerCase().trim();
  const candArtist = (candidate.artistName || '').toLowerCase().trim();
  const tTitle = targetTitle.toLowerCase().trim();
  const tArtist = (targetArtist || '').toLowerCase().trim();

  // Strip non-alphanumeric for resilient token matching
  const normCandTitle = candTitle.replace(/[^a-z0-9]/g, '');
  const normTargetTitle = tTitle.replace(/[^a-z0-9]/g, '');

  // 1. Mandatory Title Match Check
  const exactTitleMatch = candTitle === tTitle || normCandTitle === normTargetTitle;
  const partialTitleMatch =
    candTitle.includes(tTitle) ||
    tTitle.includes(candTitle) ||
    normCandTitle.includes(normTargetTitle) ||
    normTargetTitle.includes(normCandTitle);

  if (!exactTitleMatch && !partialTitleMatch) {
    // If title has no match, reject immediately so unrelated songs are NEVER returned
    return -999;
  }

  let score = 0;

  if (exactTitleMatch) {
    score += 60;
  } else if (candTitle.startsWith(tTitle) || tTitle.startsWith(candTitle)) {
    score += 45;
  } else {
    score += 30;
  }

  // 2. Artist Match (Max 35 pts)
  if (tArtist) {
    const normCandArtist = candArtist.replace(/[^a-z0-9]/g, '');
    const normTargetArtist = tArtist.replace(/[^a-z0-9]/g, '');

    if (candArtist === tArtist || normCandArtist === normTargetArtist) {
      score += 35;
    } else if (candArtist.includes(tArtist) || tArtist.includes(candArtist)) {
      score += 25;
    } else {
      // Check word tokens (e.g. "juice" in "juice wrld") to tolerate typos/re-orderings
      const targetTokens = tArtist.split(/\s+/).filter((w) => w.length > 2);
      const matchesToken = targetTokens.some((w) => candArtist.includes(w));
      if (matchesToken) {
        score += 20;
      }
    }
  }

  // 3. Synced Lyrics Preference (Max 30 pts)
  if (candidate.syncedLyrics && candidate.syncedLyrics.trim().length > 20) {
    score += 30;
  }

  // 4. Duration Match (Max 20 pts / Penalty for gross mismatch)
  if (targetDuration && targetDuration > 10 && candidate.duration && candidate.duration > 10) {
    const diff = Math.abs(candidate.duration - targetDuration);
    if (diff <= 5) {
      score += 20;
    } else if (diff <= 15) {
      score += 10;
    } else if (diff > 45) {
      score -= 25; // Significant duration mismatch penalty
    }
  }

  return score;
}

export class LyricsProvider {
  /**
   * Searches for synchronized lyrics directly from LRCLIB (https://lrclib.net).
   * Intelligently cleans artist/title, scores candidates against playback metadata,
   * and prioritizes accurate timestamped lyrics.
   */
  static async getLyrics(params: LyricsSearchParams): Promise<LyricTrack | null> {
    const { trackName, artistName, duration, videoId } = params;

    // 1. Check curated catalog by verified videoId first (guarantees instantaneous precision for demo tracks)
    if (videoId && CURATED_TRACKS[videoId]) {
      return CURATED_TRACKS[videoId];
    }

    // 2. Clean track and artist tokens with robust delimiter separation
    const cleaned = cleanTrackTitle(trackName, artistName);
    const cleanTitle = cleaned.title.trim();
    const cleanArtist = (cleaned.artist || artistName || '').trim();

    // If title is an unresolved placeholder or empty, wait until real metadata is retrieved
    if (!cleanTitle || cleanTitle.startsWith('YouTube Video (')) {
      return null;
    }

    // 2b. Direct check for curated tracks by title/artist to guarantee video-calibrated lyrics
    const lowerTitle = cleanTitle.toLowerCase();
    const lowerArtist = cleanArtist.toLowerCase();
    if (lowerTitle === 'robbery' && (lowerArtist.includes('juice') || lowerArtist === '' || !artistName)) {
      return CURATED_TRACKS['iI34LYmJ1Fs'] || CURATED_TRACKS['robbery'];
    }
    if ((lowerTitle.includes('lean with me') || lowerTitle.includes('lean wit me')) && (lowerArtist.includes('juice') || lowerArtist === '' || !artistName)) {
      return CURATED_TRACKS['5SejM_hBvMM'] || CURATED_TRACKS['leanwitme'];
    }
    if (lowerTitle === 'chihiro' && (lowerArtist.includes('billie') || lowerArtist === '' || !artistName)) {
      return CURATED_TRACKS['BY_XwvKogC8'] || CURATED_TRACKS['chihiro'];
    }
    if (lowerTitle === 'yellow' && (lowerArtist.includes('coldplay') || lowerArtist === '' || !artistName)) {
      return CURATED_TRACKS['yKNxeF4KMsY'] || CURATED_TRACKS['yellow'];
    }
    if (lowerTitle.includes('get lucky') && (lowerArtist.includes('daft') || lowerArtist === '' || !artistName)) {
      return CURATED_TRACKS['5NV6Rdv1a3I'] || CURATED_TRACKS['getlucky'];
    }
    if (lowerTitle.includes('easy on me') && (lowerArtist.includes('adele') || lowerArtist === '' || !artistName)) {
      return CURATED_TRACKS['U3ASj1L6_sY'] || CURATED_TRACKS['easyonme'];
    }
    if (lowerTitle.includes('bohemian rhapsody')) {
      return CURATED_TRACKS['fJ9rUzIMcZQ'] || CURATED_TRACKS['bohemianrhapsody'];
    }

    // 3. Check memory cache
    const cacheKey = `${cleanTitle}_${cleanArtist}_${duration ? Math.round(duration) : ''}`.toLowerCase();
    if (lyricsCache.has(cacheKey)) {
      return lyricsCache.get(cacheKey)!;
    }

    // 4. Query live LRCLIB API (https://lrclib.net)
    try {
      let data: LrclibSearchResult | null = null;
      let allCandidates: LrclibSearchResult[] = [];

      // Query A: Structured search using track_name and artist_name
      if (cleanTitle) {
        const queryParams = new URLSearchParams();
        queryParams.set('track_name', cleanTitle);
        if (cleanArtist) {
          queryParams.set('artist_name', cleanArtist);
        }
        try {
          const resp = await fetch(`https://lrclib.net/api/search?${queryParams.toString()}`, {
            headers: { 'User-Agent': 'LyriXer/1.0.0 (https://github.com/LyriXer)' },
          });
          if (resp.ok) {
            const results = await resp.json();
            if (Array.isArray(results)) {
              allCandidates.push(...results);
            }
          }
        } catch {
          // ignore
        }
      }

      // Query B: Fallback to structured search by track_name only (if artist was empty or had a typo)
      if (allCandidates.length === 0 && cleanTitle && cleanArtist) {
        try {
          const qp = new URLSearchParams({ track_name: cleanTitle });
          const resp = await fetch(`https://lrclib.net/api/search?${qp.toString()}`, {
            headers: { 'User-Agent': 'LyriXer/1.0.0 (https://github.com/LyriXer)' },
          });
          if (resp.ok) {
            const results = await resp.json();
            if (Array.isArray(results)) {
              allCandidates.push(...results);
            }
          }
        } catch {
          // ignore
        }
      }

      // Query C: Combined keyword search fallback if structured results are empty
      if (allCandidates.length === 0 && cleanTitle) {
        const qTerm = cleanArtist ? `${cleanArtist} ${cleanTitle}` : cleanTitle;
        const qResults = await this.searchLrclib(qTerm);
        allCandidates.push(...qResults);
      }

      // 5. Score all candidate tracks and select the highest scoring match
      if (allCandidates.length > 0) {
        // De-duplicate candidates by id
        const uniqueMap = new Map<number, LrclibSearchResult>();
        for (const item of allCandidates) {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        }

        const scored = Array.from(uniqueMap.values()).map((cand) => ({
          candidate: cand,
          score: scoreCandidate(cand, cleanTitle, cleanArtist, duration),
        }));

        scored.sort((a, b) => b.score - a.score);

        // Pick top scored candidate if it meets quality threshold and is not disqualified
        if (scored[0] && scored[0].score >= 35) {
          data = scored[0].candidate;
        }
      }

      if (data) {
        const track = this.convertLrclibItemToTrack(data, cleanTitle, cleanArtist);
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
      track.duration = item.duration;
    } else if (item.plainLyrics) {
      track = parseLrc(item.plainLyrics, 'plain');
      track.title = item.trackName || fallbackTitle || 'Untitled';
      track.artist = item.artistName || fallbackArtist;
      track.duration = item.duration;
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

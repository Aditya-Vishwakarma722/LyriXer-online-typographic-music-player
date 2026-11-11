import type { LrclibSearchResult } from './LyricsProvider';
import { formatDuration } from '../../utils/formatters';

export interface ScoredLrclibResult {
  item: LrclibSearchResult;
  score: number;
  introOffset: number;
  formattedOffset: string;
  hasIntroDelay: boolean;
  matchReason: string;
  isBestMatch: boolean;
}

export interface TimelineMatchSummary {
  bestMatch: ScoredLrclibResult | null;
  scoredResults: ScoredLrclibResult[];
  videoDuration: number;
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSimilarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const setA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const setB = new Set(normB.split(' ').filter((w) => w.length > 2));
  if (setA.size === 0 || setB.size === 0) return 0;

  let common = 0;
  for (const word of setA) {
    if (setB.has(word)) common++;
  }
  return common / Math.max(setA.size, setB.size);
}

/**
 * Matches LRCLIB search results against the video's total duration
 * to identify and rank the best suitable option for music videos with intros.
 */
export class TimelineMatcher {
  public static matchResults(
    results: LrclibSearchResult[],
    videoDuration: number,
    trackTitle = '',
    trackArtist = ''
  ): TimelineMatchSummary {
    if (!results || results.length === 0) {
      return {
        bestMatch: null,
        scoredResults: [],
        videoDuration,
      };
    }

    const scored: ScoredLrclibResult[] = results.map((item) => {
      let score = 0;
      let introOffset = 0;
      const reasons: string[] = [];

      // 1. Synced lyrics bonus (essential for typography sync)
      if (item.syncedLyrics && item.syncedLyrics.trim().length > 0) {
        score += 45;
      } else {
        score += 5;
      }

      // 2. Video Duration vs Song Duration Timeline Math
      // e.g. Video is 4:16 (256s), Song is 2:39 (159s) -> Intro is 97s (+1:37)
      if (videoDuration > 0 && item.duration && item.duration > 0) {
        const diff = Number((videoDuration - item.duration).toFixed(1));

        // Direct start (song begins with the video within 3s tolerance)
        if (Math.abs(diff) <= 3) {
          score += 40;
          introOffset = 0;
          reasons.push(
            `Direct timeline match (Video ${formatDuration(videoDuration)} ≈ Audio ${formatDuration(item.duration)})`
          );
        } else if (diff > 3 && diff < videoDuration - 10) {
          // Intro scene present (e.g. 4:16 video vs 2:39 audio -> 97s intro)
          score += 35;
          introOffset = diff;
          reasons.push(
            `Intro preamble detected: +${formatDuration(diff)} (${diff}s delay in ${formatDuration(videoDuration)} video)`
          );
        } else if (diff < -5) {
          // Song duration exceeds video duration significantly
          score -= 15;
          reasons.push(
            `Song duration (${formatDuration(item.duration)}) exceeds video (${formatDuration(videoDuration)})`
          );
        }
      }

      // 3. Track Name and Artist String Similarity
      const titleSim = tokenSimilarity(item.trackName, trackTitle);
      const artistSim = tokenSimilarity(item.artistName, trackArtist);
      if (titleSim > 0.5) score += 15;
      if (artistSim > 0.5) score += 10;

      const hasIntroDelay = introOffset > 1.0;
      const formattedOffset = formatDuration(introOffset);

      const matchReason =
        reasons.length > 0
          ? reasons.join(' · ')
          : item.syncedLyrics
          ? 'Synchronized LRCLIB lyrics'
          : 'Plain text lyrics';

      return {
        item,
        score,
        introOffset,
        formattedOffset,
        hasIntroDelay,
        matchReason,
        isBestMatch: false,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Designate the best match if score meets threshold
    let bestMatch: ScoredLrclibResult | null = null;
    if (scored.length > 0 && scored[0].score >= 35) {
      scored[0].isBestMatch = true;
      bestMatch = scored[0];
    }

    return {
      bestMatch,
      scoredResults: scored,
      videoDuration,
    };
  }
}

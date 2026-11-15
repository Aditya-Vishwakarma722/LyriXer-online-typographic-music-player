import type { LyricLine } from './lrcParser';

/**
 * Determines whether a lyric line contains actual sung vocal content.
 * Rejects musical notes/symbols (♪, ♫, ♩, ♬), punctuation-only lines,
 * and instrumental direction tags ([Instrumental], (Music), [Solo], etc.).
 */
export function isVocalText(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Match lines containing only musical symbols, punctuation, dashes, or whitespace
  if (/^[\p{P}\p{S}\s♪♫♩♬\-_–—~.*•]+$/u.test(trimmed)) return false;
  // Match bracketed/parenthesized instrumental cues
  if (/^(\[|\()(?:instrumental|music|solo|guitar solo|beat|intro|outro|bridge|interlude|break)(\]|\))$/i.test(trimmed)) return false;
  return true;
}

export interface TimedWord {
  word: string;
  start: number; // 0.0 to 1.0 fraction of line progress
  end: number;   // 0.0 to 1.0 fraction of line progress
}

// In-memory cache to prevent re-splitting and re-weighting lyric lines 28 times per second
const timedWordsCache = new Map<string, TimedWord[]>();

/**
 * Splits a lyric line into individual words and computes proportionate
 * progress intervals [start, end] within [0, 1] based on word character weight.
 * This powers Spotify-style word-by-word active vocal illumination.
 */
export function getTimedWords(text: string): TimedWord[] {
  if (!text) return [];
  const cached = timedWordsCache.get(text);
  if (cached) return cached;

  const rawWords = (text || '').trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  // Apportion time based on word length (longer words take longer to sing)
  const weights = rawWords.map((w) => Math.max(1.8, w.length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let current = 0;
  const result = rawWords.map((word, i) => {
    const fraction = weights[i] / totalWeight;
    const start = current;
    const end = Math.min(1, current + fraction);
    current = end;
    return { word, start, end };
  });

  if (timedWordsCache.size > 600) {
    const firstKey = timedWordsCache.keys().next().value;
    if (firstKey) timedWordsCache.delete(firstKey);
  }
  timedWordsCache.set(text, result);
  return result;
}

/**
 * Calculates the natural singing duration for a lyric line based on word count
 * and the gap until the next line starts.
 * This guarantees the Spotify-style progressive text wipe moves at an organic vocal pace.
 */
export function calculateLineDuration(
  line: LyricLine,
  nextLine?: LyricLine | null
): number {
  const words = (line.text || '').trim().split(/\s+/).filter(Boolean).length;
  // Natural singing duration: ~0.42s per word + 1.2s base
  const naturalDuration = Math.max(1.8, Math.min(8.0, 1.2 + words * 0.42));

  if (nextLine && nextLine.timestamp > line.timestamp) {
    const gap = nextLine.timestamp - line.timestamp;
    // Allow singing to cover up to 88% of the gap (leaving natural breath pause),
    // or clamp to naturalDuration if gap is a long instrumental section
    const maxActiveSpan = Math.max(0.8, gap * 0.88);
    return Math.min(gap, Math.min(naturalDuration, maxActiveSpan));
  }

  return naturalDuration;
}

export const getLineVocalDuration = calculateLineDuration;



import { useMemo } from 'react';
import type { LyricTrack, LyricLine } from '../services/lyrics/lrcParser';
import { calculateLineDuration } from '../services/lyrics/vocalFilter';

export interface LyricsSyncState {
  activeIndex: number;
  activeLine: LyricLine | null;
  previousLine: LyricLine | null;
  nextLine: LyricLine | null;
  progress: number; // 0 to 1 progress within the current line (Spotify-style loading fill)
  isIntro: boolean;
  isSongEnded: boolean;
}

export function computeLyricsSync(
  lyrics: LyricTrack | null,
  currentTime: number,
  offsetSeconds = 0
): LyricsSyncState {
  if (!lyrics || !lyrics.lines || lyrics.lines.length === 0) {
    return {
      activeIndex: -1,
      activeLine: null,
      previousLine: null,
      nextLine: null,
      progress: 0,
      isIntro: false,
      isSongEnded: false,
    };
  }

  const lines = lyrics.lines;

  // When offsetSeconds is positive, lyrics are delayed to account for music video intro scenes
  if (offsetSeconds > 0 && currentTime < offsetSeconds - 0.05) {
    return {
      activeIndex: -1,
      activeLine: null,
      previousLine: null,
      nextLine: lines[0],
      progress: 0,
      isIntro: true,
      isSongEnded: false,
    };
  }

  const effectiveTime = currentTime - offsetSeconds;

  // Before the song begins or before the first lyric line begins (with 50ms tolerance for floating-point precision)
  if (effectiveTime < 0 || effectiveTime < lines[0].timestamp - 0.05) {
    return {
      activeIndex: -1,
      activeLine: null,
      previousLine: null,
      nextLine: lines[0],
      progress: 0,
      isIntro: true,
      isSongEnded: false,
    };
  }

  // Binary search for the active lyric line (with 80ms tolerance for smooth frame snapping)
  let low = 0;
  let high = lines.length - 1;
  let matchedIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lines[mid].timestamp <= effectiveTime + 0.08) {
      matchedIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const activeIndex = matchedIndex;
  const activeLine = activeIndex >= 0 ? lines[activeIndex] : null;
  const previousLine = activeIndex > 0 ? lines[activeIndex - 1] : null;
  const nextLine = activeIndex < lines.length - 1 ? lines[activeIndex + 1] : null;

  // Check if all vocal lines in the song have finished singing (plus a 1.8s buffer)
  const lastLine = lines[lines.length - 1];
  const lastDuration = calculateLineDuration(lastLine);
  const isSongEnded = effectiveTime > lastLine.timestamp + lastDuration + 1.8;

  let progress = 0;
  if (activeLine) {
    const duration = calculateLineDuration(activeLine, nextLine);
    progress = Math.min(1, Math.max(0, (effectiveTime - activeLine.timestamp) / duration));
  }

  return {
    activeIndex,
    activeLine,
    previousLine,
    nextLine,
    progress,
    isIntro: false,
    isSongEnded,
  };
}

export function useLyricsSync(
  lyrics: LyricTrack | null,
  currentTime: number,
  offsetSeconds = 0
): LyricsSyncState {
  return useMemo(
    () => computeLyricsSync(lyrics, currentTime, offsetSeconds),
    [lyrics, currentTime, offsetSeconds]
  );
}


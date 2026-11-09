import { useMemo } from 'react';
import type { LyricTrack, LyricLine } from '../services/lyrics/lrcParser';

export interface LyricsSyncState {
  activeIndex: number;
  activeLine: LyricLine | null;
  previousLine: LyricLine | null;
  nextLine: LyricLine | null;
  progress: number; // 0 to 1 progress within the current line
  isIntro: boolean;
}

export function useLyricsSync(
  lyrics: LyricTrack | null,
  currentTime: number,
  offsetSeconds = 0
): LyricsSyncState {
  return useMemo(() => {
    if (!lyrics || !lyrics.lines || lyrics.lines.length === 0) {
      return {
        activeIndex: -1,
        activeLine: null,
        previousLine: null,
        nextLine: null,
        progress: 0,
        isIntro: false,
      };
    }

    // When offsetSeconds is positive, lyrics are delayed to account for music video intro scenes
    const effectiveTime = Math.max(0, currentTime - offsetSeconds);
    const lines = lyrics.lines;

    // Before the first lyric line begins
    if (effectiveTime < lines[0].timestamp) {
      return {
        activeIndex: -1,
        activeLine: null,
        previousLine: null,
        nextLine: lines[0],
        progress: 0,
        isIntro: true,
      };
    }

    // Binary search for the active lyric line
    let low = 0;
    let high = lines.length - 1;
    let matchedIndex = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].timestamp <= effectiveTime) {
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

    let progress = 0;
    if (activeLine) {
      const end = activeLine.endTime ?? activeLine.timestamp + 4;
      const duration = Math.max(0.5, end - activeLine.timestamp);
      progress = Math.min(1, Math.max(0, (effectiveTime - activeLine.timestamp) / duration));
    }

    return {
      activeIndex,
      activeLine,
      previousLine,
      nextLine,
      progress,
      isIntro: false,
    };
  }, [lyrics, currentTime, offsetSeconds]);
}


export interface LyricLine {
  id: string;
  timestamp: number; // in seconds
  text: string;
  endTime?: number;
}

export interface LyricTrack {
  title?: string;
  artist?: string;
  album?: string;
  offset?: number; // in seconds
  synced: boolean;
  lines: LyricLine[];
  source: 'provider' | 'file' | 'curated' | 'plain';
}

/**
 * Parses timestamp string [mm:ss.xx] or [mm:ss.xxx] into seconds.
 */
export function parseLrcTimestamp(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  let milliseconds = 0;

  if (match[3]) {
    const msStr = match[3];
    if (msStr.length === 1) milliseconds = parseInt(msStr, 10) * 100;
    else if (msStr.length === 2) milliseconds = parseInt(msStr, 10) * 10;
    else milliseconds = parseInt(msStr.slice(0, 3), 10);
  }

  return minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Parses a complete LRC string into a structured LyricTrack.
 */
export function parseLrc(content: string, source: LyricTrack['source'] = 'file'): LyricTrack {
  const lines = content.split(/\r?\n/);
  const parsedLines: LyricLine[] = [];
  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;
  let offsetMs = 0;

  const tagRegex = /^\[([a-zA-Z]+):(.*)\]$/;
  const timeRegex = /\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check for metadata tags e.g. [ti:Song], [ar:Artist], [offset:+100]
    const tagMatch = rawLine.match(tagRegex);
    if (tagMatch) {
      const key = tagMatch[1].toLowerCase();
      const value = tagMatch[2].trim();
      if (key === 'ti') title = value;
      else if (key === 'ar') artist = value;
      else if (key === 'al') album = value;
      else if (key === 'offset') {
        const parsedOffset = parseInt(value, 10);
        if (!isNaN(parsedOffset)) offsetMs = parsedOffset;
      }
      continue;
    }

    // Check for timed lyric lines
    const timestamps: number[] = [];
    let match: RegExpExecArray | null;

    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(rawLine)) !== null) {
      const timeInSec = parseLrcTimestamp(match[1]);
      if (timeInSec !== null) {
        timestamps.push(timeInSec);
      }
    }

    if (timestamps.length > 0) {
      const text = rawLine.replace(timeRegex, '').trim();
      for (const time of timestamps) {
        parsedLines.push({
          id: `line-${parsedLines.length}-${time}`,
          timestamp: time + offsetMs / 1000,
          text,
        });
      }
    }
  }

  // Sort lines by ascending timestamp
  parsedLines.sort((a, b) => a.timestamp - b.timestamp);

  // Compute endTime for each line (start of subsequent line)
  for (let i = 0; i < parsedLines.length; i++) {
    if (i < parsedLines.length - 1) {
      parsedLines[i].endTime = parsedLines[i + 1].timestamp;
    }
  }

  const isSynced = parsedLines.length > 0;

  // Fallback: If no timestamps found, parse as plain lyrics
  if (!isSynced) {
    const plainLines: LyricLine[] = lines
      .filter((l) => l.trim().length > 0)
      .map((l, index) => ({
        id: `plain-${index}`,
        timestamp: index * 4, // dummy staggered timing for plain view
        text: l.trim(),
      }));

    return {
      title,
      artist,
      album,
      synced: false,
      lines: plainLines,
      source: 'plain',
    };
  }

  return {
    title,
    artist,
    album,
    offset: offsetMs / 1000,
    synced: true,
    lines: parsedLines,
    source,
  };
}

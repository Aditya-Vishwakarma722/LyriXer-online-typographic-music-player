import { strict as assert } from 'node:assert';
import { TimelineMatcher } from '../services/lyrics/timelineMatcher';
import type { LrclibSearchResult } from '../services/lyrics/LyricsProvider';
import type { LyricTrack } from '../services/lyrics/lrcParser';

console.log('====================================================');
console.log('    LYRIXER: TIMELINE MATCHER & INTRO SYNC TESTS    ');
console.log('====================================================');

// Sample search results matching the user's screenshot for "Juice WRLD Misfit"
const mockMisfitResults: LrclibSearchResult[] = [
  {
    id: 35658750,
    trackName: 'Juice WRLD - Misfit (Official Audio)',
    artistName: 'Juice WRLD',
    albumName: 'Juice WRLD - Misfit (Official Audio)',
    duration: 159, // 2:39
    plainLyrics: 'Ay, ay\nOh, oh-oh\nYeah, yeah, yeah, whoa',
    syncedLyrics:
      '[00:01.07] Ay, ay\n[00:06.38] Oh, oh-oh\n[00:10.77] Yeah, yeah, yeah, whoa\n[00:12.12] Ay, one main girl, fuck a mistress, oh',
  },
  {
    id: 35658751,
    trackName: 'Juice WRLD - Misfit (Official Audio)',
    artistName: 'Juice WRLD',
    albumName: 'Juice WRLD',
    duration: 159, // 2:39
    plainLyrics: 'Ay, ay\nOh, oh-oh',
    syncedLyrics: '[00:01.07] Ay, ay\n[00:06.38] Oh, oh-oh',
  },
  {
    id: 35658752,
    trackName: 'Juice WRLD - Misfit (Official Audio)',
    artistName: 'Juice WRLD',
    albumName: 'Juice WRLD Songs',
    duration: 160, // 2:40
    plainLyrics: 'Ay, ay\nOh, oh-oh',
    syncedLyrics: '[00:01.07] Ay, ay\n[00:06.38] Oh, oh-oh',
  },
  {
    id: 35658753,
    trackName: 'Juice WRLD - Misfit (Official Audio)',
    artistName: 'Juice WRLD',
    albumName: 'Juice WRLD Videos',
    duration: 160, // 2:40
    plainLyrics: 'Ay, ay\nOh, oh-oh',
    syncedLyrics: '[00:01.07] Ay, ay\n[00:06.38] Oh, oh-oh',
  },
];

// Video is 4:16 = 256 seconds
const videoDuration4m16s = 256;

// -----------------------------------------------------------------
// Test 1: Timeline Matching - Best Suitable Option Selection
// -----------------------------------------------------------------
console.log('\n[TEST 1] Timeline Matcher: Best Suitable Option for Juice WRLD - Misfit');

const summary = TimelineMatcher.matchResults(
  mockMisfitResults,
  videoDuration4m16s,
  'Juice WRLD - Misfit (Official Music Video)',
  'Juice WRLD'
);

assert(summary.bestMatch !== null, 'Best suitable option must be identified');
assert(summary.bestMatch.item.duration === 159, 'Best match has song duration 159s (2:39)');
assert(summary.bestMatch.introOffset === 97.0, 'Intro offset is accurately computed as 97.0s (256s - 159s)');
assert(summary.bestMatch.hasIntroDelay === true, 'hasIntroDelay is flagged as true');
assert(summary.bestMatch.formattedOffset === '1:37', 'formattedOffset displays as "1:37"');
assert(summary.bestMatch.isBestMatch === true, 'isBestMatch flag is set on the featured result');

console.log('  ✓ Identified Best Match: %s', summary.bestMatch.item.trackName);
console.log('  ✓ Song Duration: 2:39 (159s) vs Video: 4:16 (256s)');
console.log('  ✓ Calculated Intro Delay: +%s (%ss)', summary.bestMatch.formattedOffset, summary.bestMatch.introOffset);
console.log('  ✓ Match Reason: %s', summary.bestMatch.matchReason);

// -----------------------------------------------------------------
// Test 2: Playback Sync Behavior with Intro Delay
// -----------------------------------------------------------------
console.log('\n[TEST 2] Playback Timeline: Clean Intro vs Song Start');

const mockTrack: LyricTrack = {
  title: 'Misfit',
  artist: 'Juice WRLD',
  synced: true,
  source: 'provider',
  lines: [
    { id: '1', timestamp: 1.07, text: 'Ay, ay' },
    { id: '2', timestamp: 6.38, text: 'Oh, oh-oh' },
    { id: '3', timestamp: 10.77, text: 'Yeah, yeah, yeah, whoa' },
    { id: '4', timestamp: 12.12, text: 'Ay, one main girl, fuck a mistress, oh' },
  ],
};

const introOffset = 97.0; // 1:37

// Simulate hook synchronization logic
function simulateSync(currentTime: number, offset: number) {
  const lines = mockTrack.lines;
  if (offset > 0 && currentTime < offset) {
    return { activeIndex: -1, activeLine: null, isIntro: true };
  }
  const effectiveTime = currentTime - offset;
  if (effectiveTime < lines[0].timestamp) {
    return { activeIndex: -1, activeLine: null, isIntro: true };
  }
  let matchedIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].timestamp <= effectiveTime) {
      matchedIndex = i;
    }
  }
  return {
    activeIndex: matchedIndex,
    activeLine: matchedIndex >= 0 ? lines[matchedIndex] : null,
    isIntro: false,
  };
}

const syncAt10s = simulateSync(10.0, introOffset);
assert(syncAt10s.activeIndex === -1, 'At 10s: activeIndex is -1 (clean video intro)');
assert(syncAt10s.activeLine === null, 'At 10s: activeLine is null (NO lyrics shown)');
assert(syncAt10s.isIntro === true, 'At 10s: isIntro is true');
console.log('  ✓ At video time 10.0s (during intro): activeIndex = -1 (NO lyrics appearing)');

const syncAt90s = simulateSync(90.0, introOffset);
assert(syncAt90s.activeIndex === -1, 'At 90s: activeIndex is -1 (still in intro)');
assert(syncAt90s.activeLine === null, 'At 90s: activeLine is null');
console.log('  ✓ At video time 90.0s (still intro): activeIndex = -1 (clean video)');

// Case B: At video time 98.2s (after song begins at 97s + 1.07s = 98.07s)
const syncAt98s = simulateSync(98.2, introOffset);
assert(syncAt98s.activeIndex === 0, 'At 98.2s: Line 0 is active');
assert(syncAt98s.activeLine?.text === 'Ay, ay', 'At 98.2s: Line 0 text matches "Ay, ay"');
console.log('  ✓ At video time 98.2s (song begins): Line 0 ("%s") starts appearing!', syncAt98s.activeLine?.text);

// Case C: At video time 104.0s (97s + 6.38s = 103.38s)
const syncAt104s = simulateSync(104.0, introOffset);
assert(syncAt104s.activeIndex === 1, 'At 104s: Line 1 is active');
assert(syncAt104s.activeLine?.text === 'Oh, oh-oh', 'At 104s: Line 1 text matches "Oh, oh-oh"');
console.log('  ✓ At video time 104.0s: Line 1 ("%s") is active!', syncAt104s.activeLine?.text);

console.log('\n====================================================');
console.log('RESULT: All Timeline Matcher tests passed successfully!');
console.log('====================================================\n');

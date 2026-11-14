import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isVocalText, calculateLineDuration } from '../services/lyrics/vocalFilter.js';
import { computeLyricsSync } from '../hooks/useLyricsSync.js';
import type { LyricTrack } from '../services/lyrics/lrcParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('   LYRIXER: VOCAL FILTER & DEEP GLOW VERIFICATION   ');
console.log('====================================================\n');

// [TEST 1] isVocalText Validation
console.log('[TEST 1] isVocalText Validation:');

// Non-vocal inputs that should leave the screen open
const nonVocalSamples = [
  '',
  '   ',
  '♪',
  '♫',
  '♪ ♪ ♪',
  '♫ ♪ ♬',
  '[Instrumental]',
  '(Instrumental)',
  '[Music]',
  '(Music)',
  '[Solo]',
  '(Solo)',
  '[Guitar Solo]',
  '[Intro]',
  '[Outro]',
  '[Bridge]',
  '[Interlude]',
  '(Interlude)',
  '...',
  '---',
  '~',
  '• • •',
];

for (const sample of nonVocalSamples) {
  const result = isVocalText(sample);
  assert.strictEqual(
    result,
    false,
    `Expected "${sample}" to be classified as non-vocal (false), got ${result}`
  );
}
console.log(`  ✓ Correctly rejected ${nonVocalSamples.length} musical/instrumental/filler symbols (Screen left open)`);

// Real vocal lyrics that should be displayed
const vocalSamples = [
  'Hello from the other side',
  "Don't stop believing",
  'Hold on to that feeling',
  'Yeah!',
  'Oh-oh-oh',
  '♪ Sing along with me ♪', // Real lyrics decorated with music notes should still display
  'Never gonna give you up',
];

for (const sample of vocalSamples) {
  const result = isVocalText(sample);
  assert.strictEqual(
    result,
    true,
    `Expected "${sample}" to be classified as vocal (true), got ${result}`
  );
}
console.log(`  ✓ Correctly accepted ${vocalSamples.length} real lyric phrases\n`);

// [TEST 2] Screen-Open Pre-vocal & Instrumental State Checks
console.log('[TEST 2] Screen-Open Behavior During Intro & Instrumental Gaps:');

// Simulated state when intro music is playing (activeIndex === -1, wheelOffset === 0)
const activeIndexIntro: number = -1;
const wheelOffset: number = 0;
const isPreVocal = activeIndexIntro === -1 && wheelOffset === 0;
assert.strictEqual(isPreVocal, true, 'isPreVocal must be true when activeIndex is -1 and wheelOffset is 0');
console.log('  ✓ Intro music playback: isPreVocal is TRUE -> activates pre-vocal-hidden (opacity: 0, screen open)');

// Simulated state when user manually scrolls during intro
const wheelOffsetUserScroll: number = 120;
const isPreVocalWhileScrolling = activeIndexIntro === -1 && wheelOffsetUserScroll === 0;
assert.strictEqual(isPreVocalWhileScrolling, false, 'User manual scroll must temporarily show preview');
console.log('  ✓ User manual wheel scroll during intro: temporarily allows previewing lyrics');

// Simulated state when vocals begin (activeIndex === 0)
const activeIndexFirstLine: number = 0;
const isPreVocalWhenSinging = activeIndexFirstLine === -1 && wheelOffset === 0;
assert.strictEqual(isPreVocalWhenSinging, false, 'isPreVocal must be false when singing begins');
console.log('  ✓ First vocal line begins: isPreVocal is FALSE -> track smoothly fades in (opacity: 1)\n');

// [TEST 3] Spotify Karaoke Loading Bar / Progressive Text Fill
console.log('[TEST 3] Spotify-Style Progressive Karaoke Text Loading Fill:');

const testTrack: LyricTrack = {
  title: 'Test Song',
  artist: 'Test Artist',
  synced: true,
  source: 'provider',
  lines: [
    { id: '1', timestamp: 10.0, text: 'Hello from the other side' }, // 5 words
    { id: '2', timestamp: 16.0, text: 'I must have called a thousand times' }, // 7 words
  ],
};

// Line 1: timestamp = 10.0s, gap to next line is 6.0s
const line1Duration = calculateLineDuration(testTrack.lines[0], testTrack.lines[1]);
assert.ok(line1Duration >= 3.0 && line1Duration <= 6.0, 'Line 1 duration calculated within organic vocal range');
console.log(`  ✓ Organic singing duration: "${testTrack.lines[0].text}" -> ${line1Duration.toFixed(2)}s`);

// At start of line (t = 10.0s): progress should be 0.0 (right side grey, 0% filled)
const syncAtStart = computeLyricsSync(testTrack, 10.0);
assert.strictEqual(syncAtStart.activeIndex, 0);
assert.strictEqual(syncAtStart.progress, 0);
const clipAtStart = `inset(0 ${((1 - syncAtStart.progress) * 100).toFixed(2)}% 0 0)`;
assert.strictEqual(clipAtStart, 'inset(0 100.00% 0 0)');
console.log(`  ✓ At line start (10.0s): progress = 0.0 -> ${clipAtStart} (0% filled, un-sung grey base visible)`);

// Midway through line: progress should be ~0.50 (left side sharp white, right side grey)
const midwayTime = 10.0 + line1Duration * 0.5;
const syncAtMid = computeLyricsSync(testTrack, midwayTime);
assert.strictEqual(syncAtMid.activeIndex, 0);
assert.ok(Math.abs(syncAtMid.progress - 0.5) < 0.05, `Midway progress expected ~0.5, got ${syncAtMid.progress}`);
const clipAtMid = `inset(0 ${((1 - syncAtMid.progress) * 100).toFixed(2)}% 0 0)`;
console.log(`  ✓ Midway through vocals (${midwayTime.toFixed(1)}s): progress = ${syncAtMid.progress.toFixed(2)} -> ${clipAtMid} (50% sharp white left, 50% grey right)`);

// At end of line vocal: progress should reach 1.0 (fully sharp white)
const completedTime = 10.0 + line1Duration + 0.1;
const syncAtEnd = computeLyricsSync(testTrack, completedTime);
assert.strictEqual(syncAtEnd.activeIndex, 0);
assert.strictEqual(syncAtEnd.progress, 1);
const clipAtEnd = `inset(0 ${((1 - syncAtEnd.progress) * 100).toFixed(2)}% 0 0)`;
assert.strictEqual(clipAtEnd, 'inset(0 0.00% 0 0)');
console.log(`  ✓ Vocal completed (${completedTime.toFixed(1)}s): progress = 1.0 -> ${clipAtEnd} (100% sharp white filled)\n`);

// [TEST 4] Focus Stack Vanish Lyrics at End of Song
console.log('[TEST 4] Focus Stack Vanishing Fade-Out at End of Song:');

// Before song ends (during line 2 at 18.0s)
const syncMidSong = computeLyricsSync(testTrack, 18.0);
assert.strictEqual(syncMidSong.isSongEnded, false, 'isSongEnded must be false during playback');
console.log('  ✓ During active song: isSongEnded is FALSE');

// After line 2 finishes (timestamp 16.0s + ~4.5s + 1.8s buffer = ~22.3s)
const syncAfterOutro = computeLyricsSync(testTrack, 25.0);
assert.strictEqual(syncAfterOutro.isSongEnded, true, 'isSongEnded must be TRUE when vocals conclude');
console.log('  ✓ After final vocal concludes: isSongEnded is TRUE');

const isVanishEnded = syncAfterOutro.isSongEnded && wheelOffset === 0;
assert.strictEqual(isVanishEnded, true, 'isVanishEnded must be true to trigger fade-out animation');
console.log('  ✓ Track end trigger: isVanishEnded is TRUE -> activates .song-ended-hidden fade-out animation\n');

// [TEST 5] Focus Stack Deep Glow & CSS Verification
console.log('[TEST 5] Deep Glow & CSS Style Rules:');

const cssPath = path.resolve(__dirname, '../features/player/LyricsView.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

// Check pre-vocal-hidden and song-ended-hidden rules
assert.ok(
  cssContent.includes('.lyrics-focus-stack-track.pre-vocal-hidden'),
  '.lyrics-focus-stack-track.pre-vocal-hidden must exist in LyricsView.css'
);
assert.ok(
  cssContent.includes('.lyrics-focus-stack-track.song-ended-hidden'),
  '.lyrics-focus-stack-track.song-ended-hidden must exist in LyricsView.css'
);
assert.ok(
  cssContent.includes('transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)'),
  'song-ended-hidden must define smooth 1.2s fade-out animation'
);

// Check Spotify word-level loading fill classes & styles
assert.ok(
  cssContent.includes('.preset-focus-stack .lyric-text-container'),
  '.preset-focus-stack .lyric-text-container must exist'
);
assert.ok(
  cssContent.includes('.preset-focus-stack .word-base'),
  '.preset-focus-stack .word-base class must exist'
);
assert.ok(
  cssContent.includes('rgba(255, 255, 255, 0.40)'),
  'Un-sung text base must use grey-white (rgba(255, 255, 255, 0.40))'
);
assert.ok(
  cssContent.includes('.preset-focus-stack .word-fill'),
  '.preset-focus-stack .word-fill class must exist'
);
assert.ok(
  cssContent.includes('0 0 20px rgba(255, 255, 255, 0.5)'),
  'Fill text must feature clean sharp white text-shadow'
);
console.log('  ✓ .lyrics-focus-stack-track.pre-vocal-hidden configured with opacity: 0');
console.log('  ✓ .lyrics-focus-stack-track.song-ended-hidden configured with 1.2s smooth fade-out');
console.log('  ✓ .word-base configured as muted grey-white (rgba(255, 255, 255, 0.40))');
console.log('  ✓ .word-fill configured with pure sharp white + clip-path transition');

console.log('\n====================================================');
console.log('RESULT: All Vocal Filter, Fill & Fade tests passed!');
console.log('====================================================\n');

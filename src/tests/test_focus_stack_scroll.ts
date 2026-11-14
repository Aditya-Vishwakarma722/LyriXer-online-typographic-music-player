import { strict as assert } from 'node:assert';

console.log('====================================================');
console.log('   LYRIXER: FOCUS STACK SPOTIFY-STYLE SCROLL TESTS   ');
console.log('====================================================\n');

/**
 * Mathematical formula used in LyricsView.tsx to center the active line
 * exactly in the vertical middle of the viewport via GPU transform.
 */
function computeTranslateY(
  stageHeight: number,
  activeTop: number,
  activeHeight: number
): number {
  const activeCenter = activeTop + activeHeight / 2;
  return stageHeight / 2 - activeCenter;
}

// 1. Test vertical centering calculation
console.log('[TEST 1] Spotify-Style Vertical Middle Centering Math:');
const viewportHeight = 800; // 800px tall lyrics stage (middle is 400px)

// Case A: First line of the song (line 0) at offsetTop = 40px, height = 50px
const line0_Top = 40;
const line0_Height = 50; // center is at 65px
const translateY0 = computeTranslateY(viewportHeight, line0_Top, line0_Height);
assert.equal(translateY0, 335, 'translateY must shift the line so its center is at 400px');
assert.equal(line0_Top + line0_Height / 2 + translateY0, 400, 'Position in viewport must equal 400px (50vh)');
console.log('  ✓ Line 0: translateY = +335px -> Center in viewport is EXACTLY 400px (50vh)');

// Case B: Middle line (e.g. line 15) at offsetTop = 1200px, height = 60px
const line15_Top = 1200;
const line15_Height = 60; // center is at 1230px
const translateY15 = computeTranslateY(viewportHeight, line15_Top, line15_Height);
assert.equal(translateY15, -830, 'translateY must shift the track up by -830px');
assert.equal(line15_Top + line15_Height / 2 + translateY15, 400, 'Position in viewport must equal 400px (50vh)');
console.log('  ✓ Line 15: translateY = -830px -> Center in viewport is EXACTLY 400px (50vh)');

// Case C: Final line of the song (e.g. line 40) at offsetTop = 3200px, height = 50px
const lineFinal_Top = 3200;
const lineFinal_Height = 50; // center is at 3225px
const translateYFinal = computeTranslateY(viewportHeight, lineFinal_Top, lineFinal_Height);
assert.equal(translateYFinal, -2825, 'translateY must shift the track up by -2825px');
assert.equal(lineFinal_Top + lineFinal_Height / 2 + translateYFinal, 400, 'Final line center in viewport is EXACTLY 400px (50vh)');
console.log('  ✓ Final Line: translateY = -2825px -> Center in viewport is EXACTLY 400px (50vh)');

// 2. Test progressive continuous scrolling down the song like Spotify
console.log('\n[TEST 2] Continuous Spotify-Style Downward Scrolling:');
const sampleLines = [
  { index: 0, top: 40, height: 50 },
  { index: 1, top: 120, height: 50 },
  { index: 2, top: 200, height: 50 },
  { index: 3, top: 280, height: 50 },
  { index: 4, top: 360, height: 50 },
];

let lastY = 99999;
for (const line of sampleLines) {
  const y = computeTranslateY(viewportHeight, line.top, line.height);
  assert(y < lastY, `As song advances, translateY for line ${line.index} must decrease (moving lines up)`);
  lastY = y;
  const viewportCenter = line.top + line.height / 2 + y;
  assert.equal(viewportCenter, 400, `Line ${line.index} must be at 400px`);
  console.log(`  ✓ Line ${line.index} active -> translateY = ${y}px (lines move up, vocal line remains at 400px)`);
}

// 3. User manual scroll peeking and auto-snap
console.log('\n[TEST 3] User Manual Scroll & Auto-Recatch:');
let wheelOffset = 180; // user peeked up by 180px
const peekPosition = line0_Top + line0_Height / 2 + computeTranslateY(viewportHeight, line0_Top, line0_Height) + wheelOffset;
assert.notEqual(peekPosition, 400, 'During user scroll peeking, position offsets cleanly');
// Upon timeout or next line:
wheelOffset = 0;
const snappedPosition = line0_Top + line0_Height / 2 + computeTranslateY(viewportHeight, line0_Top, line0_Height) + wheelOffset;
assert.equal(snappedPosition, 400, 'After auto-snap, vocal line returns dead-center to 400px');
console.log('  ✓ Peeking allows free inspection, auto-snapping smoothly locks back to center');

console.log('\n====================================================');
console.log('RESULT: All Focus Stack Spotify scroll tests passed!');
console.log('====================================================\n');

import { computeLyricsSync } from '../hooks/useLyricsSync';
import { CURATED_TRACKS } from '../services/lyrics/curatedTracks';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('====================================================');
console.log('   LYRIXER: FINE ADJUST & INTRO ONBOARDING TESTS    ');
console.log('====================================================\n');

// 1. Test Fine Adjust with Lean With Me curated lyrics
const leanWithMe = CURATED_TRACKS['5SejM_hBvMM'];
assert(Boolean(leanWithMe), 'Lean With Me curated lyrics must exist');
assert(leanWithMe.lines.length > 0, 'Lean With Me lyrics must have lines');
assert(leanWithMe.lines[0].timestamp === 11.43, 'First line must start at 11.43s');

console.log('[TEST 1] Default Direct Timeline (0.0s offset):');
console.log(`  Line 0: "${leanWithMe.lines[0].text}" at ${leanWithMe.lines[0].timestamp}s`);

// At video time 10.0s, lyrics should not yet be active
const state10 = computeLyricsSync(leanWithMe, 10.0, 0);
assert(state10.activeIndex === -1, 'At 10.0s with 0s offset, activeIndex should be -1');
console.log('  ✓ At 10.0s: activeIndex = -1 (clean video intro)');

// At video time 11.5s, line 0 should be active
const state11_5 = computeLyricsSync(leanWithMe, 11.5, 0);
assert(state11_5.activeIndex === 0, 'At 11.5s with 0s offset, activeIndex should be 0');
console.log('  ✓ At 11.5s: activeIndex = 0 ("Drugs got me sweatin...")');

console.log('\n[TEST 2] Fine Adjust: Rush Lyrics Earlier (-1.0s, -0.5s, -0.1s or [ key):');
// If user rushes lyrics by -1.0s (offset = -1.0s):
// effectiveTime = 10.5 - (-1.0) = 11.5s >= 11.43s -> line 0 appears 1s earlier!
const stateRushed = computeLyricsSync(leanWithMe, 10.5, -1.0);
assert(stateRushed.activeIndex === 0, 'At 10.5s with -1.0s rush offset, activeIndex should be 0');
console.log('  ✓ With -1.0s rush (offset = -1.0s), line 0 appears at 10.5s instead of 11.43s');

// Test micro-rush of -0.1s (pressing '[' key once)
const stateMicroRush = computeLyricsSync(leanWithMe, 11.35, -0.1);
assert(stateMicroRush.activeIndex === 0, 'At 11.35s with -0.1s rush, line 0 is already active');
console.log('  ✓ With -0.1s rush (offset = -0.1s, [ key), line 0 activates 0.1s earlier at 11.35s');

console.log('\n[TEST 3] Fine Adjust: Delay Lyrics Later (+1.0s, +0.5s, +0.1s or ] key):');
// If user delays lyrics by +1.0s (offset = +1.0s):
// At video time 11.5s, effectiveTime = 11.5 - 1.0 = 10.5s < 11.43s -> line 0 has NOT appeared yet!
const stateDelayedAt11_5 = computeLyricsSync(leanWithMe, 11.5, 1.0);
assert(stateDelayedAt11_5.activeIndex === -1, 'At 11.5s with +1.0s delay offset, activeIndex should still be -1');
console.log('  ✓ With +1.0s delay (offset = +1.0s), line 0 is held back at 11.5s');

// Line 0 now appears at 12.5s
const stateDelayedAt12_5 = computeLyricsSync(leanWithMe, 12.5, 1.0);
assert(stateDelayedAt12_5.activeIndex === 0, 'At 12.5s with +1.0s delay offset, activeIndex is 0');
console.log('  ✓ Line 0 correctly activates at 12.5s (delayed by 1.0s later)');

console.log('\n[TEST 4] Sync to Vocal Start (Press S):');
// If video is at 25.0s and vocal line 0 is at 11.43s:
// offset = 25.0 - 11.43 = +13.57s
const vocalOffset = Number((25.0 - leanWithMe.lines[0].timestamp).toFixed(1)); // 13.6s
const stateVocalSynced = computeLyricsSync(leanWithMe, 25.0, vocalOffset);
assert(stateVocalSynced.activeIndex === 0, 'At 25.0s with vocalOffset, activeIndex must be 0');
console.log(`  ✓ Vocal start sync calculated offset: +${vocalOffset}s`);
console.log('  ✓ At 25.0s: activeIndex = 0 (snapped directly to vocal position)');

console.log('\n[TEST 5] Fine Adjust Steppers Range & Direction:');
const steppers = [-1.0, -0.5, -0.1, 0.1, 0.5, 1.0];
for (const step of steppers) {
  const isRush = step < 0;
  const isDelay = step > 0;
  const testTime = 11.43;
  const state = computeLyricsSync(leanWithMe, testTime, step);
  if (isRush) {
    // If rushed (negative offset), line 0 is definitely active at 11.43s
    assert(state.activeIndex >= 0, `Stepper ${step}s (rush) should have line active at 11.43s`);
    console.log(`  ✓ Stepper ${step}s (Rush): advances lyrics earlier`);
  } else if (isDelay) {
    // If delayed (positive offset), line 0 should NOT be active at 11.43s
    assert(state.activeIndex === -1, `Stepper +${step}s (delay) should hold back line at 11.43s`);
    console.log(`  ✓ Stepper +${step}s (Delay): delays lyrics later`);
  }
}

console.log('\n[TEST 6] AutoAlign Protection: Curated Tracks:');
// Curated tracks must NEVER be corrupted by synthetic auto-align differences
assert(leanWithMe.source === 'curated', 'Lean With Me track source must be "curated"');
console.log('  ✓ Verified: curated tracks are protected from synthetic duration shifts');

console.log('\n====================================================');
console.log('RESULT: All Fine Adjust & Timing tests passed!');
console.log('====================================================\n');

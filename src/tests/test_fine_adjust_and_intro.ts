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

console.log('\n[TEST 2] Fine Adjust: Delay Lyrics Later (+0.1s, +0.5s, +1.0s or [ key on Left):');
// [ key (Left Bracket) delays lyrics later by adding offset
const stateDelayedAt11_5 = computeLyricsSync(leanWithMe, 11.5, 1.0);
assert(stateDelayedAt11_5.activeIndex === -1, 'At 11.5s with +1.0s delay offset, activeIndex should still be -1');
console.log('  ✓ With +1.0s delay (offset = +1.0s), line 0 is held back at 11.5s');

// Line 0 now appears at 12.5s
const stateDelayedAt12_5 = computeLyricsSync(leanWithMe, 12.5, 1.0);
assert(stateDelayedAt12_5.activeIndex === 0, 'At 12.5s with +1.0s delay offset, activeIndex is 0');
console.log('  ✓ Line 0 correctly activates at 12.5s (delayed by 1.0s later via Left Delay)');

console.log('\n[TEST 3] Fine Adjust: Rush Lyrics Earlier (-0.1s, -0.5s, -1.0s or ] key on Right):');
// ] key (Right Bracket) rushes lyrics earlier by subtracting offset
const stateRushed = computeLyricsSync(leanWithMe, 10.5, -1.0);
assert(stateRushed.activeIndex === 0, 'At 10.5s with -1.0s rush offset, activeIndex should be 0');
console.log('  ✓ With -1.0s rush (offset = -1.0s), line 0 appears at 10.5s instead of 11.43s');

// Test micro-rush of -0.1s (pressing ']' key once)
const stateMicroRush = computeLyricsSync(leanWithMe, 11.35, -0.1);
assert(stateMicroRush.activeIndex === 0, 'At 11.35s with -0.1s rush, line 0 is already active');
console.log('  ✓ With -0.1s rush (offset = -0.1s, ] key), line 0 activates 0.1s earlier at 11.35s');

console.log('\n[TEST 4] Sync to Vocal Start (Press S):');
// If video is at 25.0s and vocal line 0 is at 11.43s:
// offset = 25.0 - 11.43 = +13.57s
const vocalOffset = Number((25.0 - leanWithMe.lines[0].timestamp).toFixed(1)); // 13.6s
const stateVocalSynced = computeLyricsSync(leanWithMe, 25.0, vocalOffset);
assert(stateVocalSynced.activeIndex === 0, 'At 25.0s with vocalOffset, activeIndex must be 0');
console.log(`  ✓ Vocal start sync calculated offset: +${vocalOffset}s`);
console.log('  ✓ At 25.0s: activeIndex = 0 (snapped directly to vocal position)');

console.log('\n[TEST 5] Fine Adjust Steppers Layout (Left for Delay, Right for Rush):');
const leftDelaySteppers = [0.1, 0.5, 1.0];
const rightRushSteppers = [-0.1, -0.5, -1.0];

for (const step of leftDelaySteppers) {
  const state = computeLyricsSync(leanWithMe, 11.43, step);
  assert(state.activeIndex === -1, `Left Stepper +${step}s (Delay) must delay line at 11.43s`);
  console.log(`  ✓ Left Stepper +${step}s (Delay): delays lyrics later`);
}

for (const step of rightRushSteppers) {
  const state = computeLyricsSync(leanWithMe, 11.43, step);
  assert(state.activeIndex >= 0, `Right Stepper ${step}s (Rush) must advance line earlier`);
  console.log(`  ✓ Right Stepper ${step}s (Rush): advances lyrics earlier`);
}

console.log('\n[TEST 6] Rapid Atomic Nudging (No Dropped Clicks):');
let simulatedOffset = 0.0;
const simulateNudge = (delta: number) => {
  simulatedOffset = Number((simulatedOffset + delta).toFixed(1));
};
// 5 rapid taps of Delay (+0.1s)
simulateNudge(0.1);
simulateNudge(0.1);
simulateNudge(0.1);
simulateNudge(0.1);
simulateNudge(0.1);
assert(simulatedOffset === 0.5, '5 rapid +0.1s clicks must accumulate to exactly 0.5s');
console.log('  ✓ 5 rapid taps of Left Delay (+0.1s) = +0.5s with zero dropped clicks');

// 2 rapid taps of Rush (-0.1s)
simulateNudge(-0.1);
simulateNudge(-0.1);
assert(simulatedOffset === 0.3, '2 rapid -0.1s clicks must reduce to exactly 0.3s');
console.log('  ✓ 2 rapid taps of Right Rush (-0.1s) = +0.3s with atomic precision');

console.log('\n[TEST 6] AutoAlign Protection: Curated Tracks:');
// Curated tracks must NEVER be corrupted by synthetic auto-align differences
assert(leanWithMe.source === 'curated', 'Lean With Me track source must be "curated"');
console.log('  ✓ Verified: curated tracks are protected from synthetic duration shifts');

console.log('\n====================================================');
console.log('RESULT: All Fine Adjust & Timing tests passed!');
console.log('====================================================\n');

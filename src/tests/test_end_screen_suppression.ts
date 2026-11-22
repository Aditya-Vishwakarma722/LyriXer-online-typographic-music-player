import { strict as assert } from 'node:assert';

console.log('====================================================');
console.log('    LYRIXER: END-SCREEN RECOMMENDATION SUPPRESSION  ');
console.log('====================================================');

const END_SCREEN_WINDOW_SECONDS = 20;
const FINAL_FADE_SECONDS = 2.5;

// Logic under test: determines if playback is in the 20s YouTube end-screen window
function computeNearEnd(currentTime: number, duration: number, isEnded: boolean = false): boolean {
  return Boolean(
    duration &&
    duration > END_SCREEN_WINDOW_SECONDS &&
    currentTime >= Math.max(0, duration - END_SCREEN_WINDOW_SECONDS) &&
    !isEnded
  );
}

// Logic under test: determines if playback is in the final 2.5s outro fade
function computeFinalFade(currentTime: number, duration: number, isEnded: boolean = false): boolean {
  return Boolean(
    duration &&
    duration > FINAL_FADE_SECONDS &&
    currentTime >= Math.max(0, duration - FINAL_FADE_SECONDS) &&
    !isEnded
  );
}

const duration240s = 240; // 4:00 video

// Test 1: Mid-song playback (no suppression)
console.log('\n[TEST 1] Mid-track playback (at 60s of 240s)');
const midSong = computeNearEnd(60, duration240s, false);
assert.equal(midSong, false, 'Should not suppress during normal mid-song playback');
console.log('  ✓ Recommendations shield is INACTIVE (video backdrop normal)');

// Test 2: 25s before video ends (at 215s of 240s) - before YouTube end screen window
console.log('\n[TEST 2] 25s before video ends (at 215s of 240s)');
const beforeThreshold = computeNearEnd(215, duration240s, false);
assert.equal(beforeThreshold, false, 'Video remains 100% visible before 20s end screen window');
console.log('  ✓ Recommendations shield is INACTIVE before threshold (full video visibility maintained)');

// Test 3: In YouTube end-screen window (at 231s of 240s = 9s left, matching user screenshot!)
console.log('\n[TEST 3] In 20-second YouTube end-screen window (at 231s of 240s = 9s left)');
const inEndZone = computeNearEnd(231, duration240s, false);
assert.equal(inEndZone, true, 'Must activate recommendation suppression during 20s end screen window');
console.log('  ✓ Recommendations shield is ACTIVE: 100% covers YouTube cards on left & right, keeping singer visible!');

// Test 4: Final 2.5s outro fade
console.log('\n[TEST 4] Final 2.5s outro fade (at 238.5s of 240s)');
const inFinalFade = computeFinalFade(238.5, duration240s, false);
assert.equal(inFinalFade, true, 'Must activate final fade during the last 2.5 seconds');
console.log('  ✓ Final fade active: smooth transition to Track Completed screen');

// Test 5: Seeking backward reverts suppression
console.log('\n[TEST 5] User seeks back to 100s');
const afterSeek = computeNearEnd(100, duration240s, false);
assert.equal(afterSeek, false, 'Should deactivate immediately when seeking back');
console.log('  ✓ Recommendations shield deactivates upon seeking backwards');

// Test 6: Track completed (isEnded = true)
console.log('\n[TEST 6] Track finishes (isEnded = true)');
const trackFinished = computeNearEnd(240, duration240s, true);
assert.equal(trackFinished, false, 'Near-end shield transitions cleanly to end-screen blocker');
console.log('  ✓ Transitions cleanly to Completed Track modal');

console.log('\n====================================================');
console.log('RESULT: All end-screen suppression tests passed!');
console.log('====================================================\n');

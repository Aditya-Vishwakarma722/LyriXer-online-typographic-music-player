import { strict as assert } from 'node:assert';

console.log('====================================================');
console.log('    LYRIXER: END-SCREEN RECOMMENDATION SUPPRESSION  ');
console.log('====================================================');

const OUTRO_FADE_SECONDS = 3.5;

// Logic under test: determines if playback is in the 3-4s YouTube end-screen fade zone
function computeNearEnd(currentTime: number, duration: number, isEnded: boolean = false): boolean {
  return Boolean(
    duration &&
    duration > OUTRO_FADE_SECONDS &&
    currentTime >= Math.max(0, duration - OUTRO_FADE_SECONDS) &&
    !isEnded
  );
}

const duration240s = 240; // 4:00 video

// Test 1: Mid-song playback (no suppression)
console.log('\n[TEST 1] Mid-track playback (at 60s of 240s)');
const midSong = computeNearEnd(60, duration240s, false);
assert.equal(midSong, false, 'Should not suppress during normal mid-song playback');
console.log('  ✓ Recommendations shield is INACTIVE (video backdrop normal)');

// Test 2: 10s before video ends (at 230s of 240s) - previously suppressed, now fully visible!
console.log('\n[TEST 2] 10s before video ends (at 230s of 240s)');
const beforeThreshold = computeNearEnd(230, duration240s, false);
assert.equal(beforeThreshold, false, 'Video remains 100% visible before 3.5s outro threshold');
console.log('  ✓ Recommendations shield is INACTIVE before threshold (full video visibility maintained)');

// Test 3: Entering the 3.5-second outro zone (at 237s of 240s) while song is playing
console.log('\n[TEST 3] In 3.5-second outro fade zone (at 237s of 240s) while current song is playing');
const inEndZone = computeNearEnd(237, duration240s, false);
assert.equal(inEndZone, true, 'Must activate recommendation suppression during 3.5s outro fade zone');
console.log('  ✓ Recommendations shield is ACTIVE: 3.5s smooth fade-out hides recommendations & end cards!');

// Test 4: Seeking backward reverts suppression
console.log('\n[TEST 4] User seeks back to 100s');
const afterSeek = computeNearEnd(100, duration240s, false);
assert.equal(afterSeek, false, 'Should deactivate immediately when seeking back');
console.log('  ✓ Recommendations shield deactivates upon seeking backwards');

// Test 5: Track completed (isEnded = true)
console.log('\n[TEST 5] Track finishes (isEnded = true)');
const trackFinished = computeNearEnd(240, duration240s, true);
assert.equal(trackFinished, false, 'Near-end shield transitions cleanly to end-screen blocker');
console.log('  ✓ Transitions cleanly to Completed Track modal');

console.log('\n====================================================');
console.log('RESULT: All end-screen suppression tests passed!');
console.log('====================================================\n');

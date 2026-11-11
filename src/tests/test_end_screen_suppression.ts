import { strict as assert } from 'node:assert';

console.log('====================================================');
console.log('    LYRIXER: END-SCREEN RECOMMENDATION SUPPRESSION  ');
console.log('====================================================');

// Logic under test: determines if playback is in the YouTube end-screen card zone
function computeNearEnd(currentTime: number, duration: number, isEnded: boolean = false): boolean {
  return Boolean(
    duration &&
    duration >= 20 &&
    currentTime >= Math.max(0, duration - 20) &&
    !isEnded
  );
}

const duration240s = 240; // 4:00 video

// Test 1: Mid-song playback (no suppression)
console.log('\n[TEST 1] Mid-track playback (at 60s of 240s)');
const midSong = computeNearEnd(60, duration240s, false);
assert.equal(midSong, false, 'Should not suppress during normal mid-song playback');
console.log('  ✓ Recommendations shield is INACTIVE (video backdrop normal)');

// Test 2: Just before the 20-second end threshold (at 219s of 240s)
console.log('\n[TEST 2] 21s before video ends (at 219s of 240s)');
const beforeThreshold = computeNearEnd(219, duration240s, false);
assert.equal(beforeThreshold, false, 'Should not suppress before 20s threshold');
console.log('  ✓ Recommendations shield is INACTIVE before threshold');

// Test 3: Entering the 20-second end zone (at 220s of 240s) while song is playing
console.log('\n[TEST 3] In 20-second outro/end zone (at 225s of 240s) while current song is playing');
const inEndZone = computeNearEnd(225, duration240s, false);
assert.equal(inEndZone, true, 'Must activate recommendation suppression during end zone');
console.log('  ✓ Recommendations shield is ACTIVE: YouTube recommended videos & end cards hidden!');

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

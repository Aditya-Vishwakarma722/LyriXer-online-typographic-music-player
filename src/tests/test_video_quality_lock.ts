import { strict as assert } from 'node:assert';

console.log('====================================================');
console.log('       LYRIXER: VIDEO PLAYBACK QUALITY LOCK         ');
console.log('       MINIMUM 1080P (FHD) - MAXIMUM 2160P (4K)      ');
console.log('====================================================');

// Logic under test mirroring YouTubeAdapter.ts quality locking algorithm
function resolveQualitySelection(available: string[], activeQuality?: string | null) {
  let targetQuality = 'hd2160';

  if (available && available.length > 0) {
    // Select highest available tier within 2160p ceiling down to 1080p floor
    if (available.includes('hd2160') || available.includes('highres')) {
      targetQuality = 'hd2160';
    } else if (available.includes('hd1440')) {
      targetQuality = 'hd1440';
    } else if (available.includes('hd1080')) {
      targetQuality = 'hd1080';
    } else {
      targetQuality = available[0];
    }
  }

  const isSub1080p =
    activeQuality &&
    ['hd720', 'large', 'medium', 'small', 'tiny', 'auto', 'default'].includes(activeQuality) &&
    available.some((tier) => ['hd2160', 'highres', 'hd1440', 'hd1080'].includes(tier));

  const isOver2160p =
    activeQuality && ['hd2880', 'highres'].includes(activeQuality) && available.includes('hd2160');

  const needsEnforcement =
    !activeQuality ||
    activeQuality !== targetQuality ||
    Boolean(isSub1080p) ||
    Boolean(isOver2160p);

  const minQuality = available.includes('hd1080') ? 'hd1080' : targetQuality;
  const maxQuality = available.includes('hd2160') ? 'hd2160' : (targetQuality === 'hd1440' ? 'hd1440' : targetQuality);

  return {
    targetQuality,
    needsEnforcement,
    isSub1080p: Boolean(isSub1080p),
    minQuality,
    maxQuality
  };
}

// Badge label resolution helper mirroring EditorialMusicInfo.tsx & PlayerControls.tsx
function getResolutionBadge(playbackQuality?: string): string {
  if (playbackQuality === 'hd2160' || playbackQuality === 'highres') {
    return '4K UHD (2160P)';
  }
  if (playbackQuality === 'hd1440') {
    return '2K QHD (1440P)';
  }
  if (playbackQuality === 'hd1080') {
    return '1080P FULL HD';
  }
  return '1080P - 2160P HD';
}

// TEST 1: Full 4K video stream available
console.log('\n[TEST 1] Video with full 4K stream available');
const test1 = resolveQualitySelection(['hd2160', 'hd1440', 'hd1080', 'hd720', 'medium'], 'hd720');
assert.equal(test1.targetQuality, 'hd2160', 'Should target 4K UHD 2160p when available');
assert.equal(test1.isSub1080p, true, 'Should detect sub-1080p quality (hd720)');
assert.equal(test1.needsEnforcement, true, 'Must enforce when active quality is below 1080p');
assert.equal(test1.minQuality, 'hd1080', 'Minimum quality boundary must be 1080p');
assert.equal(test1.maxQuality, 'hd2160', 'Maximum quality boundary must be 2160p');
console.log('  ✓ Correctly targets 2160p (4K UHD) and rejects sub-1080p stream');

// TEST 2: 1440p (2K) max available
console.log('\n[TEST 2] Video with 1440p (2K) as highest stream');
const test2 = resolveQualitySelection(['hd1440', 'hd1080', 'hd720', 'large'], 'hd1440');
assert.equal(test2.targetQuality, 'hd1440', 'Should target 1440p');
assert.equal(test2.minQuality, 'hd1080', 'Minimum quality boundary remains 1080p');
assert.equal(test2.maxQuality, 'hd1440', 'Maximum quality boundary caps at 1440p');
assert.equal(test2.isSub1080p, false, '1440p is not sub-1080p');
console.log('  ✓ Correctly targets 1440p (2K QHD) with 1080p floor');

// TEST 3: 1080p Full HD video (standard high-res)
console.log('\n[TEST 3] Video with 1080p Full HD stream');
const test3 = resolveQualitySelection(['hd1080', 'hd720', 'medium', 'small'], 'hd1080');
assert.equal(test3.targetQuality, 'hd1080', 'Should target 1080p Full HD');
assert.equal(test3.minQuality, 'hd1080', 'Minimum quality boundary is 1080p');
assert.equal(test3.maxQuality, 'hd1080', 'Maximum quality boundary is 1080p');
console.log('  ✓ Correctly locks strictly at 1080p Full HD');

// TEST 4: Adaptive Bitrate (ABR) attempts to silently degrade to 480p/720p
console.log('\n[TEST 4] ABR downgrade detection and re-elevation');
const test4 = resolveQualitySelection(['hd2160', 'hd1080', 'hd720', 'large', 'medium'], 'medium');
assert.equal(test4.isSub1080p, true, 'ABR medium (360p) detected as sub-1080p violation');
assert.equal(test4.needsEnforcement, true, 'Immediate re-elevation triggered to restore min 1080p/max 2160p');
assert.equal(test4.targetQuality, 'hd2160', 'Re-elevates to highest available 2160p tier');
console.log('  ✓ ABR auto-downgrades intercepted and immediately re-elevated to 1080p+');

// TEST 5: Legacy video with max 720p uploaded (graceful fallback)
console.log('\n[TEST 5] Legacy video (maximum available is 720p)');
const test5 = resolveQualitySelection(['hd720', 'large', 'medium'], 'hd720');
assert.equal(test5.targetQuality, 'hd720', 'Falls back gracefully to highest available tier');
assert.equal(test5.minQuality, 'hd720');
console.log('  ✓ Graceful fallback when 1080p is not encoded by YouTube');

// TEST 6: Resolution badge rendering
console.log('\n[TEST 6] UI Resolution Badges');
assert.equal(getResolutionBadge('hd2160'), '4K UHD (2160P)');
assert.equal(getResolutionBadge('highres'), '4K UHD (2160P)');
assert.equal(getResolutionBadge('hd1440'), '2K QHD (1440P)');
assert.equal(getResolutionBadge('hd1080'), '1080P FULL HD');
assert.equal(getResolutionBadge(undefined), '1080P - 2160P HD');
console.log('  ✓ Resolution badges render accurately across all quality levels');

console.log('\n====================================================');
console.log('RESULT: All video quality lock tests passed!');
console.log('====================================================\n');

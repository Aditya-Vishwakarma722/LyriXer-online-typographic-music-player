import { strict as assert } from 'node:assert';
import {
  TrendingFeedService,
  MASTER_TRENDING_TRACKS,
} from '../services/trending/trendingFeedService';

console.log('====================================================');
console.log('    LYRIXER: TRENDING SIGNALS ROTATION & FRESHNESS  ');
console.log('====================================================');

// TEST 1: Master catalog integrity
console.log('\n[TEST 1] Master Trending Catalog Integrity');
assert.ok(MASTER_TRENDING_TRACKS.length >= 16, 'Catalog must contain at least 16 tracks');
MASTER_TRENDING_TRACKS.forEach((track) => {
  assert.ok(track.id, 'Track must have an ID');
  assert.ok(track.title, 'Track must have a title');
  assert.ok(track.artist, 'Track must have an artist');
  assert.ok(track.videoId && track.videoId.length === 11, `Track ${track.title} must have a valid 11-char YouTube ID`);
  assert.ok(track.thumbnailUrl.includes('ytimg.com'), `Track ${track.title} must have a valid ytimg thumbnail`);
  assert.ok(track.duration > 60, `Track ${track.title} duration must be realistic (> 60s)`);
});
console.log(`  ✓ Verified ${MASTER_TRENDING_TRACKS.length} master tracks with valid metadata & YouTube IDs`);

// TEST 2: Deterministic Daily Rotation
console.log('\n[TEST 2] Daily Rotation Changes Between Days');
const day1 = new Date('2026-11-22T00:00:00Z');
const day2 = new Date('2026-11-23T00:00:00Z');
const day3 = new Date('2026-11-24T00:00:00Z');

const offset1 = TrendingFeedService.getDailyRotationOffset(day1);
const offset2 = TrendingFeedService.getDailyRotationOffset(day2);
const offset3 = TrendingFeedService.getDailyRotationOffset(day3);

console.log(`  Day 1 (Nov 22) Offset: ${offset1}`);
console.log(`  Day 2 (Nov 23) Offset: ${offset2}`);
console.log(`  Day 3 (Nov 24) Offset: ${offset3}`);

assert.notEqual(offset1, offset2, 'Day 1 and Day 2 must have distinct spotlight rotation offsets');
assert.notEqual(offset2, offset3, 'Day 2 and Day 3 must have distinct spotlight rotation offsets');

const tracksDay1 = TrendingFeedService.rotateCatalog(offset1);
const tracksDay2 = TrendingFeedService.rotateCatalog(offset2);

assert.notEqual(tracksDay1[0].id, tracksDay2[0].id, 'Day 1 and Day 2 must highlight different #1 spotlight songs');
console.log(`  ✓ Day 1 Spotlight: "${tracksDay1[0].artist} - ${tracksDay1[0].title}"`);
console.log(`  ✓ Day 2 Spotlight: "${tracksDay2[0].artist} - ${tracksDay2[0].title}"`);

// TEST 3: Catalog Rotation Consistency
console.log('\n[TEST 3] Catalog Rotation Integrity');
const rotated = TrendingFeedService.rotateCatalog(5);
assert.equal(rotated.length, MASTER_TRENDING_TRACKS.length, 'Rotated catalog must preserve all tracks');
assert.equal(rotated[0].rank, 1, 'First track must be rank 1');
assert.equal(rotated[rotated.length - 1].rank, rotated.length, 'Last track must have rank equal to length');
console.log('  ✓ Rotated catalog cleanly re-indexes ranks 1 to N without data loss');

// TEST 4: On-demand Cycle Radar
console.log('\n[TEST 4] On-Demand Cycle Radar');
const cycled = TrendingFeedService.cycleRadarNext(offset1);
assert.notEqual(cycled.tracks[0].id, tracksDay1[0].id, 'Cycling radar must reveal a new spotlight song');
console.log(`  ✓ On-Demand Cycled Spotlight: "${cycled.tracks[0].artist} - ${cycled.tracks[0].title}"`);

// TEST 5: Platform Filtering
console.log('\n[TEST 5] Platform Filtering');
const igTracks = MASTER_TRENDING_TRACKS.filter((t) => t.platform === 'instagram' || t.platform === 'both');
const ytTracks = MASTER_TRENDING_TRACKS.filter((t) => t.platform === 'youtube' || t.platform === 'both');
assert.ok(igTracks.length > 5, 'Must have at least 5 Instagram tracks');
assert.ok(ytTracks.length > 5, 'Must have at least 5 YouTube tracks');
console.log(`  ✓ Instagram Reels pool: ${igTracks.length} tracks, YouTube pool: ${ytTracks.length} tracks`);

console.log('\n====================================================');
console.log('RESULT: All Trending Signals rotation tests passed!');
console.log('====================================================\n');

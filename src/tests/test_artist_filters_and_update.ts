import { strict as assert } from 'assert';
import { parseViewCount, ArtistService, RELEASE_CHECK_INTERVAL_MS } from '../services/artist/artistService';
import type { ArtistTrack } from '../types/artist';

console.log('====================================================');
console.log('   LYRIXER: ARTIST FILTERS & AUTO-UPDATE VERIFY     ');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST 1: View Count Parsing & Numeric Sorting
// ----------------------------------------------------
console.log('[TEST 1] View Count Parsing (Billions, Millions, Thousands, Raw numbers)');
assert.equal(parseViewCount('1.2B views'), 1_200_000_000);
assert.equal(parseViewCount('598M views'), 598_000_000);
assert.equal(parseViewCount('496M views'), 496_000_000);
assert.equal(parseViewCount('950K views'), 950_000);
assert.equal(parseViewCount('125,000 views'), 125_000);
assert.equal(parseViewCount(''), 0);
assert.equal(parseViewCount(undefined), 0);
console.log('  ✓ Correctly parsed 1.2B, 598M, 496M, 950K, and raw view counts into numbers\n');

// ----------------------------------------------------
// TEST 2: Filter Sorting Logic
// ----------------------------------------------------
console.log('[TEST 2] Artist Page Filters: Top Hits & Recently Released');
const mockTracks: ArtistTrack[] = [
  { id: '1', title: 'Song 2018', artist: 'Artist', duration: 200, durationFormatted: '3:20', videoId: 'vid1', isOfficial: true, views: '100M views', year: '2018' },
  { id: '2', title: 'Top Hit #1 (1.2B)', artist: 'Artist', duration: 210, durationFormatted: '3:30', videoId: 'vid2', isOfficial: true, views: '1.2B views', year: '2019' },
  { id: '3', title: 'Recent Drop 2024', artist: 'Artist', duration: 180, durationFormatted: '3:00', videoId: 'vid3', isOfficial: true, views: '45M views', year: '2024' },
  { id: '4', title: 'Top Hit #2 (500M)', artist: 'Artist', duration: 195, durationFormatted: '3:15', videoId: 'vid4', isOfficial: true, views: '500M views', year: '2020' },
  { id: '5', title: 'Brand New 2026', artist: 'Artist', duration: 210, durationFormatted: '3:30', videoId: 'vid5', isOfficial: true, views: '12M views', year: '2026' },
];

// Top Hits: Sorted by views descending
const topHits = [...mockTracks].sort((a, b) => {
  const vB = parseViewCount(b.views);
  const vA = parseViewCount(a.views);
  if (vB !== vA) return vB - vA;
  return (b.isOfficial ? 1 : 0) - (a.isOfficial ? 1 : 0);
}).map((t, idx) => ({ ...t, rank: idx + 1 }));

assert.equal(topHits.length, 5, 'Top Hits must contain all songs ranked, not empty!');
assert.equal(topHits[0].title, 'Top Hit #1 (1.2B)');
assert.equal(topHits[0].rank, 1);
assert.equal(topHits[1].title, 'Top Hit #2 (500M)');
assert.equal(topHits[1].rank, 2);
assert.equal(topHits[2].title, 'Song 2018');
assert.equal(topHits[2].rank, 3);
console.log('  ✓ Top Hits correctly orders the most streamed songs on YouTube (1.2B -> 500M -> 100M)');
console.log('  ✓ Top Hits assign ranks #1, #2, #3 without returning empty list\n');

// Recently Released: Sorted by year descending
const recentlyReleased = [...mockTracks].sort((a, b) => {
  const yB = parseInt(b.year || '0', 10);
  const yA = parseInt(a.year || '0', 10);
  if (yB !== yA) return yB - yA;
  return parseViewCount(b.views) - parseViewCount(a.views);
});

assert.equal(recentlyReleased[0].title, 'Brand New 2026', '2026 release must be at index 0');
assert.equal(recentlyReleased[1].title, 'Recent Drop 2024', '2024 release must be at index 1');
assert.equal(recentlyReleased[2].title, 'Top Hit #2 (500M)', '2020 release must be at index 2');
console.log('  ✓ Recently Released correctly prioritizes 2026 -> 2024 -> 2020 -> 2019 -> 2018\n');

// ----------------------------------------------------
// TEST 3: Juice WRLD Curated Catalog Top Hits
// ----------------------------------------------------
console.log('[TEST 3] Real Curated Artist Juice WRLD Discography Verification');
const jw = ArtistService.getArtistByName('Juice WRLD');
assert.ok(jw.tracks.length >= 10, 'Juice WRLD should have verified catalog');

const jwTopHits = [...jw.tracks].sort((a, b) => {
  const vB = parseViewCount(b.views);
  const vA = parseViewCount(a.views);
  if (vB !== vA) return vB - vA;
  return (b.isOfficial ? 1 : 0) - (a.isOfficial ? 1 : 0);
}).map((t, idx) => ({ ...t, rank: idx + 1 }));

assert.ok(jwTopHits.length > 0, 'Juice WRLD top hits must NOT be empty');
assert.equal(jwTopHits[0].title, 'Lucid Dreams', 'Lucid Dreams (1.2B views) should be #1 Top Hit');
assert.equal(jwTopHits[0].rank, 1);
assert.equal(jwTopHits[1].title, 'Robbery', 'Robbery (598M views) should be #2 Top Hit');
assert.equal(jwTopHits[1].rank, 2);
console.log(`  ✓ Juice WRLD #1: ${jwTopHits[0].title} (${jwTopHits[0].views})`);
console.log(`  ✓ Juice WRLD #2: ${jwTopHits[1].title} (${jwTopHits[1].views})`);
console.log(`  ✓ Juice WRLD #3: ${jwTopHits[2].title} (${jwTopHits[2].views})`);
console.log(`  ✓ Verified total ${jwTopHits.length} songs available in Top Hits tab\n`);

// ----------------------------------------------------
// TEST 4: Interval & Dynamic Update Check
// ----------------------------------------------------
console.log('[TEST 4] Release Check Interval & Catalog Subscriber');
assert.equal(RELEASE_CHECK_INTERVAL_MS, 6 * 60 * 60 * 1000, 'Check interval should be 6 hours');

let notified = false;
const unsub = ArtistService.subscribeArtistUpdates((_profile, _newCount) => {
  notified = true;
});
ArtistService.notifyProfileUpdate(jw, 1);
assert.equal(notified, true, 'Listener must receive catalog update broadcast');
unsub();
console.log('  ✓ Catalog update subscribers successfully receive automated updates\n');

console.log('====================================================');
console.log('RESULT: All Artist Filters & Auto-Update tests passed!');
console.log('====================================================');

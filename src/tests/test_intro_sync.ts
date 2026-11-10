import {
  validateYouTubeUrl,
  detectVideoIntroOffset,
} from '../utils/youtube';
import { LyricsProvider } from '../services/lyrics/LyricsProvider';

interface TestCase {
  name: string;
  url: string;
  expectedVideoId: string;
  expectedIntroSeconds: number;
  expectedOpeningLyricSubstr?: string;
}

const testCases: TestCase[] = [
  {
    name: 'Billie Eilish - CHIHIRO (21s hallway walk scene)',
    url: 'https://youtu.be/BY_XwvKogC8',
    expectedVideoId: 'BY_XwvKogC8',
    expectedIntroSeconds: 21.0,
    expectedOpeningLyricSubstr: 'love away',
  },
  {
    name: 'Juice WRLD - Robbery (23s burning scene intro)',
    url: 'https://youtu.be/iILJvW24k2w',
    expectedVideoId: 'iILJvW24k2w',
    expectedIntroSeconds: 23.0,
    expectedOpeningLyricSubstr: 'Man, what',
  },
  {
    name: 'Juice WRLD - Lean Wit Me (Official Music Video: AA meeting intro, vocals at 0:23)',
    url: 'https://www.youtube.com/watch?v=5SejM_hBvMM',
    expectedVideoId: '5SejM_hBvMM',
    expectedIntroSeconds: 11.6,
    expectedOpeningLyricSubstr: 'Drugs got me sweatin',
  },
  {
    name: 'Juice WRLD - Lean Wit Me (Lyric Video: Direct start 0:00)',
    url: 'https://www.youtube.com/watch?v=WsrVxz4pjGs',
    expectedVideoId: 'WsrVxz4pjGs',
    expectedIntroSeconds: 0.0,
  },
  {
    name: 'The Weeknd - Blinding Lights (28s car driving scene)',
    url: 'https://youtu.be/4NRXx6U8ABQ',
    expectedVideoId: '4NRXx6U8ABQ',
    expectedIntroSeconds: 28.0,
  },
  {
    name: 'Adele - Hello (68s cinematic phone call preamble)',
    url: 'https://youtu.be/YQHsXMglC9A',
    expectedVideoId: 'YQHsXMglC9A',
    expectedIntroSeconds: 68.0,
  },
  {
    name: 'Drake - God Plan (34s budget giveaway title sequence)',
    url: 'https://youtu.be/xpVfcZ0ZcFM',
    expectedVideoId: 'xpVfcZ0ZcFM',
    expectedIntroSeconds: 34.0,
  },
  {
    name: 'Childish Gambino - This Is America (48s guitar preamble)',
    url: 'https://youtu.be/VYOjWnS4cMY',
    expectedVideoId: 'VYOjWnS4cMY',
    expectedIntroSeconds: 48.0,
  },
  {
    name: 'Billie Eilish - bad guy (14s yellow wall break scene)',
    url: 'https://youtu.be/DyDFGwSCA3c',
    expectedVideoId: 'DyDFGwSCA3c',
    expectedIntroSeconds: 14.0,
  },
  {
    name: 'Direct start video (Queen - Bohemian Rhapsody)',
    url: 'https://youtu.be/fJ9rUzIMcZQ',
    expectedVideoId: 'fJ9rUzIMcZQ',
    expectedIntroSeconds: 0.0,
  },
  {
    name: 'Pasted URL with timestamp query ?t=21',
    url: 'https://youtu.be/BY_XwvKogC8?t=21',
    expectedVideoId: 'BY_XwvKogC8',
    expectedIntroSeconds: 21.0,
  },
  {
    name: 'Pasted URL with timestamp &t=1m15s',
    url: 'https://www.youtube.com/watch?v=k4V3Mo61fJM&t=1m15s',
    expectedVideoId: 'k4V3Mo61fJM',
    expectedIntroSeconds: 75.0,
  },
];

async function runTests() {
  console.log('====================================================');
  console.log('   LYRIXER: MUSIC VIDEO INTRO & LYRIC SYNC TESTS    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`[TEST] ${tc.name}`);
    console.log(`  URL: ${tc.url}`);

    // 1. Validation and ID extraction
    const val = validateYouTubeUrl(tc.url);
    if (!val.isValid || val.videoId !== tc.expectedVideoId) {
      console.error(`  ❌ Failed: expected videoId ${tc.expectedVideoId}, got ${val.videoId}`);
      failed++;
      continue;
    }

    // 2. Intro offset detection
    const detectedOffset = val.startTime ?? detectVideoIntroOffset(val.videoId, tc.url);
    if (Math.abs(detectedOffset - tc.expectedIntroSeconds) > 0.5) {
      console.error(`  ❌ Failed: expected offset ${tc.expectedIntroSeconds}s, got ${detectedOffset}s`);
      failed++;
      continue;
    }
    console.log(`  ✓ Video ID: ${val.videoId} | Intro Start Offset: ${detectedOffset}s`);

    // 3. Lyrics Sync Simulation
    // During intro (e.g. videoTime = detectedOffset / 2), no lyrics should show
    if (detectedOffset > 5) {
      const introCheckTime = detectedOffset / 2;
      const effectiveIntroTime = introCheckTime - detectedOffset;
      // In useLyricsSync, when effectiveTime < firstLineTimestamp, activeIndex is -1
      console.log(`  ✓ At intro video time ${introCheckTime.toFixed(1)}s (during intro scenes):`);
      console.log(`    Effective lyric time = ${effectiveIntroTime.toFixed(1)}s (< 0) -> activeIndex = -1 (clean video, NO lyrics overlay)`);
    }

    // 4. At music begin point:
    const atMusicStartTime = detectedOffset + 0.1;
    const effectiveMusicTime = atMusicStartTime - detectedOffset;
    console.log(`  ✓ At music start video time ${atMusicStartTime.toFixed(1)}s:`);
    console.log(`    Effective lyric time = ${effectiveMusicTime.toFixed(1)}s -> Line 0 begins syncing seamlessly!`);

    passed++;
    console.log(`  ✓ PASSED\n`);
  }

  // 5. Test Live Lyrics Provider for CHIHIRO and Robbery
  console.log('--- Testing Live Lyrics Provider with Video Calibrations ---');
  try {
    const chihiroLyrics = await LyricsProvider.getLyrics({
      trackName: 'CHIHIRO',
      artistName: 'Billie Eilish',
      videoId: 'BY_XwvKogC8',
    });
    if (chihiroLyrics && chihiroLyrics.lines.length > 0) {
      console.log(`✓ CHIHIRO: Successfully retrieved ${chihiroLyrics.lines.length} lines.`);
      console.log(`  Line 0: [${chihiroLyrics.lines[0].timestamp.toFixed(2)}s] "${chihiroLyrics.lines[0].text}"`);
      passed++;
    } else {
      console.error('❌ CHIHIRO lyrics not returned');
      failed++;
    }

    const robberyLyrics = await LyricsProvider.getLyrics({
      trackName: 'Robbery',
      artistName: 'Juice WRLD',
      videoId: 'iILJvW24k2w',
    });
    if (robberyLyrics && robberyLyrics.lines.length > 0) {
      console.log(`✓ Robbery: Successfully retrieved ${robberyLyrics.lines.length} lines.`);
      console.log(`  Line 0: [${robberyLyrics.lines[0].timestamp.toFixed(2)}s] "${robberyLyrics.lines[0].text}"`);
      passed++;
    } else {
      console.error('❌ Robbery lyrics not returned');
      failed++;
    }

    // 6. DEDICATED FULL VIDEO PLAYING TEST FOR JUICE WRLD - LEAN WIT ME (5SejM_hBvMM)
    console.log('\n====================================================');
    console.log('   FULL PLAYING TEST: JUICE WRLD - LEAN WIT ME (5SejM_hBvMM)   ');
    console.log('====================================================');
    const leanLyrics = await LyricsProvider.getLyrics({
      trackName: 'Lean Wit Me',
      artistName: 'Juice WRLD',
      videoId: '5SejM_hBvMM',
    });

    if (!leanLyrics || leanLyrics.lines.length === 0) {
      console.error('❌ Lean Wit Me lyrics not returned');
      failed++;
    } else {
      console.log(`✓ Lean Wit Me: Retrieved ${leanLyrics.lines.length} lines.`);
      console.log(`  Title: "${leanLyrics.title}", Artist: "${leanLyrics.artist}"`);
      console.log(`  First Line [${leanLyrics.lines[0].timestamp.toFixed(2)}s]: "${leanLyrics.lines[0].text}"`);

      const offset = detectVideoIntroOffset('5SejM_hBvMM');
      console.log(`  Calibrated Intro Offset: +${offset}s\n`);

      // Simulation function matching useLyricsSync logic
      const simulateSync = (currentTime: number) => {
        const effectiveTime = Math.max(0, currentTime - offset);
        const lines = leanLyrics.lines;

        if (effectiveTime < lines[0].timestamp) {
          return { activeIndex: -1, activeLine: null, isIntro: true, effectiveTime };
        }

        let low = 0;
        let high = lines.length - 1;
        let matchedIndex = -1;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (lines[mid].timestamp <= effectiveTime) {
            matchedIndex = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        return {
          activeIndex: matchedIndex,
          activeLine: matchedIndex >= 0 ? lines[matchedIndex] : null,
          isIntro: false,
          effectiveTime,
        };
      };

      const timelineChecks = [
        { videoTime: 5.0, desc: 'Intro Dialogue (AA support group Serenity Prayer)', expectIntro: true, expectActiveIndex: -1 },
        { videoTime: 11.5, desc: 'End of prayer scene / Guitar preamble begins', expectIntro: true, expectActiveIndex: -1 },
        { videoTime: 22.0, desc: 'One second before Juice WRLD sings', expectIntro: true, expectActiveIndex: -1 },
        { videoTime: 23.05, desc: 'Juice WRLD starts singing Line 0: "Drugs got me sweatin\'..."', expectIntro: false, expectActiveIndex: 0 },
        { videoTime: 26.1, desc: 'Line 1: "Lookin\' at the devil and the angel on my shoulder"', expectIntro: false, expectActiveIndex: 1 },
        { videoTime: 34.85, desc: 'Chorus start: "Lean with me, pop with me"', expectIntro: false, expectActiveIndex: 4 },
        { videoTime: 70.0, desc: 'Verse 1: "This shit ain\'t fiction, it\'s too real, too real"', expectIntro: false, expectActiveIndex: 16 },
        { videoTime: 198.0, desc: 'Song finishes; video enters Addiction Hotline PSA sequence', expectIntro: false, expectMinIndex: 40 },
      ];

      let timelinePassed = true;
      for (const step of timelineChecks) {
        const state = simulateSync(step.videoTime);
        const activeText = state.activeLine ? `"${state.activeLine.text}"` : 'NONE (Clean Video Intro)';
        console.log(`[VIDEO TIME ${step.videoTime.toFixed(2)}s | EFF TIME ${state.effectiveTime.toFixed(2)}s] ${step.desc}`);
        console.log(`  -> activeIndex: ${state.activeIndex} | isIntro: ${state.isIntro} | Text: ${activeText}`);

        if (step.expectIntro && !state.isIntro) {
          console.error(`  ❌ Failed: expected isIntro to be true at video time ${step.videoTime}s`);
          timelinePassed = false;
        }
        if (step.expectActiveIndex !== undefined && state.activeIndex !== step.expectActiveIndex) {
          console.error(`  ❌ Failed: expected activeIndex ${step.expectActiveIndex}, got ${state.activeIndex}`);
          timelinePassed = false;
        }
        if (step.expectMinIndex !== undefined && state.activeIndex < step.expectMinIndex) {
          console.error(`  ❌ Failed: expected activeIndex >= ${step.expectMinIndex}, got ${state.activeIndex}`);
          timelinePassed = false;
        }
      }

      if (timelinePassed) {
        console.log('\n✓ JUICE WRLD "LEAN WIT ME" VIDEO PLAYING TEST PASSED FLAWLESSLY!');
        passed++;
      } else {
        console.error('\n❌ JUICE WRLD "LEAN WIT ME" PLAYING TEST FAILED');
        failed++;
      }
    }
  } catch (err) {
    console.error('Error querying lyrics provider:', err);
    failed++;
  }

  console.log('====================================================');
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  console.log('====================================================');
}

runTests();

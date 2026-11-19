import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import type { VideoSource } from '../../types/session';
import './Hero.css';

interface HeroProps {
  children?: React.ReactNode;
  onQuickSpin?: (source: VideoSource) => void;
}

interface DemoTrack {
  title: string;
  artist: string;
  videoId: string;
  thumbnailUrl: string;
  duration: number;
}

const HERO_DEMO_TRACKS: DemoTrack[] = [
  {
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    videoId: 'ekr2nIex040',
    thumbnailUrl: 'https://i.ytimg.com/vi/ekr2nIex040/hqdefault.jpg',
    duration: 173,
  },
  {
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    videoId: 'kPa7bsKwL-c',
    thumbnailUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
    duration: 252,
  },
  {
    title: 'Lean With Me',
    artist: 'Juice WRLD',
    videoId: '5SejM_hBvMM',
    thumbnailUrl: 'https://i.ytimg.com/vi/5SejM_hBvMM/hqdefault.jpg',
    duration: 176,
  },
  {
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell',
    videoId: '5NV6Rdv1a3I',
    thumbnailUrl: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    duration: 248,
  },
  {
    title: 'Yellow',
    artist: 'Coldplay',
    videoId: 'yKNxeF4KMsY',
    thumbnailUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    duration: 269,
  },
];

export const Hero: React.FC<HeroProps> = React.memo<HeroProps>(({ children, onQuickSpin }) => {
  const handleLaunchTrack = (track: DemoTrack) => {
    if (onQuickSpin) {
      onQuickSpin({
        kind: 'youtube',
        sourceId: track.videoId,
        title: `${track.artist} - ${track.title}`,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
        duration: track.duration,
      });
    }
  };

  return (
    <section className="hero-section" aria-label="LyriXer Spatial Stage">
      {/* Dynamic Viewport Telemetry Tags */}
      <div className="hero-viewport-telemetry" aria-hidden="true">
        <span className="telemetry-corner-tag">[ SYSTEM // SPATIAL_VOCAL_ENGINE ]</span>
        <span className="telemetry-corner-tag">[ 24-BIT HI-RES // LAT 37.77° N ]</span>
      </div>

      <div className="hero-stage-content">
        {/* Monumental Architectural Headline */}
        <motion.h1
          className="hero-monumental-headline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="headline-row">FEEL THE SOUND.</span>
          <span className="headline-row headline-dim">SEE THE LYRICS.</span>
        </motion.h1>

        {/* Minimalist Sub-statement */}
        <motion.p
          className="hero-editorial-copy"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          Music videos unconstrained by player frames. Real-time synchronized lyrics in deep obsidian space.
        </motion.p>

        {/* Floating Input Console Wrapper */}
        <motion.div
          className="hero-input-console-wrapper"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>

        {/* Minimalist Single-Line Quick Auditions Bar */}
        <motion.div
          className="hero-quick-spins-line"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="quick-spins-prefix">// QUICK_SPINS:</span>
          <div className="quick-spins-links">
            {HERO_DEMO_TRACKS.map((track, i) => (
              <React.Fragment key={track.videoId}>
                {i > 0 && <span className="quick-spin-dot">&middot;</span>}
                <button
                  type="button"
                  className="quick-spin-link"
                  onClick={() => handleLaunchTrack(track)}
                  title={`Engage: ${track.artist} - ${track.title}`}
                >
                  <Play size={9} fill="currentColor" className="quick-spin-play-icon" />
                  <span>{track.artist} &ndash; {track.title}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';
export default Hero;

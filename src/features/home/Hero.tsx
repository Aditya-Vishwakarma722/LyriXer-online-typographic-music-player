import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Radio, Music4, Zap, ShieldCheck, Play } from 'lucide-react';
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
  badge?: string;
}

const HERO_DEMO_TRACKS: DemoTrack[] = [
  {
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    videoId: 'ekr2nIex040',
    thumbnailUrl: 'https://i.ytimg.com/vi/ekr2nIex040/hqdefault.jpg',
    duration: 173,
    badge: '#1 Global Viral',
  },
  {
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    videoId: 'kPa7bsKwL-c',
    thumbnailUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
    duration: 252,
    badge: 'Worldwide Hit',
  },
  {
    title: 'Lean With Me',
    artist: 'Juice WRLD',
    videoId: '5SejM_hBvMM',
    thumbnailUrl: 'https://i.ytimg.com/vi/5SejM_hBvMM/hqdefault.jpg',
    duration: 176,
    badge: 'Master Video',
  },
  {
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell',
    videoId: '5NV6Rdv1a3I',
    thumbnailUrl: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    duration: 248,
    badge: 'French Touch',
  },
  {
    title: 'Yellow',
    artist: 'Coldplay',
    videoId: 'yKNxeF4KMsY',
    thumbnailUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    duration: 269,
    badge: 'Studio Master',
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
    <section className="hero-section" aria-label="LyriXer Spatial Sonic Stage">
      <div className="hero-stage-container">
        {/* Beacon Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="hero-beacon-row"
        >
          <div className="hero-live-beacon">
            <span className="beacon-pulse-dot" />
            <Radio size={12} className="beacon-radio-icon" />
            <span className="beacon-text">24-BIT HI-RES VOCAL ENGINE</span>
          </div>
          <span className="hero-sync-beacon">LRCLIB SPATIAL SYNC</span>
        </motion.div>

        {/* Monumental Editorial Headline - Authentic Stark White (Ref: Hybrid Human) */}
        <motion.h1
          className="hero-monumental-headline"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="headline-lead">FEEL THE SOUND.</span>
          <span className="headline-accent-wrap">
            SEE THE LYRICS.
          </span>
        </motion.h1>

        {/* Poetic Sub-manifesto */}
        <motion.p
          className="hero-editorial-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          Music videos unconstrained by player frames. Synchronized lyrics that ignite in real-time
          with the artist&apos;s cadence in a deep obsidian atmospheric theater.
        </motion.p>

        {/* Primary Input Console (VideoInput) */}
        <motion.div
          className="hero-input-console-wrapper"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>

        {/* Quick Demo Auditions Bar */}
        <motion.div
          className="hero-quick-auditions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="quick-auditions-header">
            <Sparkles size={12} className="quick-auditions-sparkle" />
            <span className="quick-auditions-label">TRY AN INSTANT DEMO:</span>
          </div>

          <div className="quick-auditions-chips">
            {HERO_DEMO_TRACKS.map((track) => (
              <button
                key={track.videoId}
                type="button"
                className="quick-audition-chip"
                onClick={() => handleLaunchTrack(track)}
                title={`Instant play: ${track.artist} - ${track.title}`}
              >
                <Play size={10} fill="currentColor" className="chip-play-icon" />
                <span className="chip-artist">{track.artist}</span>
                <span className="chip-sep">&ndash;</span>
                <span className="chip-title">{track.title}</span>
                {track.badge && <span className="chip-badge">{track.badge}</span>}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Performance & Quality Metrics */}
        <motion.div
          className="hero-performance-metrics"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.42 }}
        >
          <div className="metric-item">
            <Zap size={12} className="metric-icon" />
            <span>0.0ms SYNC LATENCY</span>
          </div>
          <span className="metric-divider">&middot;</span>
          <div className="metric-item">
            <ShieldCheck size={12} className="metric-icon" />
            <span>100% PRIVATE LOCAL ENGINE</span>
          </div>
          <span className="metric-divider">&middot;</span>
          <div className="metric-item">
            <Sparkles size={12} className="metric-icon" />
            <span>ZERO WATERMARK CHROME</span>
          </div>
          <span className="metric-divider">&middot;</span>
          <div className="metric-item">
            <Music4 size={12} className="metric-icon" />
            <span>LRCLIB REAL-TIME SYNC</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

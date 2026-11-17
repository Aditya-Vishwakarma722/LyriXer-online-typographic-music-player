import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Radio, Music4, Zap, ShieldCheck } from 'lucide-react';
import { AcousticPrismDeck, type PrismTrackInfo } from '../../components/AcousticPrismDeck';
import ShinyText from '../../components/reactbits/ShinyText';
import type { VideoSource } from '../../types/session';
import './Hero.css';

interface HeroProps {
  children?: React.ReactNode;
  onQuickSpin?: (source: VideoSource) => void;
}

const HERO_DEMO_TRACKS: (PrismTrackInfo & { videoId: string })[] = [
  {
    title: 'Lean With Me',
    artist: 'Juice WRLD',
    videoId: '5SejM_hBvMM',
    artworkUrl: 'https://i.ytimg.com/vi/5SejM_hBvMM/hqdefault.jpg',
    duration: 176,
    badge: 'OFFICIAL MUSIC VIDEO',
    lyricsSnippet: 'Lean with me, pop with me, get high with me if you rock with me...',
  },
  {
    title: 'The Power (Song version)',
    artist: 'Borislav Slavov',
    videoId: 'yKNxeF4KMsY', // Fallback to verified playback or custom source
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    duration: 232,
    badge: 'BALDUR\'S GATE 3 OST',
    lyricsSnippet: 'Firelight burning the tower, hear the choir sing of power...',
  },
  {
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell',
    videoId: '5NV6Rdv1a3I',
    artworkUrl: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    duration: 248,
    badge: 'MASTER CASSETTE',
    lyricsSnippet: 'She\'s up all night \'til the sun, I\'m up all night to get lucky...',
  },
  {
    title: 'Yellow',
    artist: 'Coldplay',
    videoId: 'yKNxeF4KMsY',
    artworkUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    duration: 269,
    badge: 'STUDIO MASTER',
    lyricsSnippet: 'Look at the stars, look how they shine for you...',
  },
];

export const Hero: React.FC<HeroProps> = React.memo<HeroProps>(({ children, onQuickSpin }) => {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const activeDemo = HERO_DEMO_TRACKS[selectedDemoIndex];

  const handleSpinDemo = () => {
    if (onQuickSpin) {
      onQuickSpin({
        kind: 'youtube',
        sourceId: activeDemo.videoId,
        title: `${activeDemo.artist} - ${activeDemo.title}`,
        artist: activeDemo.artist,
        thumbnailUrl: activeDemo.artworkUrl,
        duration: typeof activeDemo.duration === 'number' ? activeDemo.duration : 180,
      });
    }
  };

  return (
    <section className="hero-section" aria-label="LyriXer Spatial Sonic Stage">
      <div className="hero-editorial-stage">
        {/* ============================================================== */}
        {/* WING A: Editorial Monograph & Acoustic Typography              */}
        {/* ============================================================== */}
        <div className="hero-wing-editorial">
          {/* Live Audio Engine Beacon */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
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

          {/* Monumental Editorial Headline */}
          <motion.h1
            className="hero-monumental-headline"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="headline-lead">FEEL THE SOUND.</span>
            <span className="headline-accent-wrap">
              <ShinyText
                text="SEE THE LYRICS."
                color="#D8B4FE"
                shineColor="#FFFFFF"
                speed={3}
                glow={0.35}
                className="headline-shiny-accent"
              />
            </span>
          </motion.h1>

          {/* Poetic Sub-manifesto */}
          <motion.p
            className="hero-editorial-copy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            Music videos unconstrained by player frames. Synchronized lyrics that ignite in
            real-time with the artist's cadence in a deep obsidian atmospheric acoustic theater.
          </motion.p>

          {/* Quick-Spin Crate (Curated demo records selector) */}
          <motion.div
            className="hero-curated-crate"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="crate-header">
              <Sparkles size={12} className="crate-sparkle" />
              <span className="crate-label">INSTANT SPATIAL AUDITIONS:</span>
            </div>

            <div className="crate-pills-list">
              {HERO_DEMO_TRACKS.map((track, idx) => (
                <button
                  key={track.videoId + idx}
                  type="button"
                  className={`crate-track-pill ${selectedDemoIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedDemoIndex(idx)}
                >
                  <Music4 size={11} className="pill-music-icon" />
                  <span className="pill-title">{track.artist} - {track.title}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Performance & Quality Metrics */}
          <motion.div
            className="hero-performance-metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
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
          </motion.div>
        </div>

        {/* ============================================================== */}
        {/* WING B: Spatial Acoustic Prism Deck & Master Terminal          */}
        {/* ============================================================== */}
        <div className="hero-wing-turntable">
          {/* Interactive Holographic Acoustic Prism Deck */}
          <motion.div
            className="hero-turntable-container"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <AcousticPrismDeck
              track={activeDemo}
              isPlaying={true}
              onPlay={handleSpinDemo}
              size="md"
            />
          </motion.div>

          {/* Video Input Terminal Dock */}
          <motion.div
            className="hero-input-deck-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

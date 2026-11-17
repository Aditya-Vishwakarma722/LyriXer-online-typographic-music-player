import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, User, ArrowUpRight, Flame } from 'lucide-react';
import type { VideoSource } from '../../types/session';
import './CuratedShowcase.css';

export interface CuratedMasterpiece {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  genre: string;
  views: string;
  lyricsSnippet: string;
  isTrending?: boolean;
}

export const MASTERPIECES: CuratedMasterpiece[] = [
  {
    id: 'juice-wrld-lean-with-me',
    title: 'Lean With Me',
    artist: 'Juice WRLD',
    videoId: '5SejM_hBvMM',
    thumbnailUrl: 'https://i.ytimg.com/vi/5SejM_hBvMM/hqdefault.jpg',
    duration: 176,
    genre: 'Emo Rap / Melodic',
    views: '310M views',
    lyricsSnippet: 'Lean with me, pop with me, get high with me if you rock with me...',
    isTrending: true,
  },
  {
    id: 'baldurs-gate-the-power',
    title: 'The Power (Song version)',
    artist: 'Borislav Slavov',
    videoId: '43_BG3_THE_POWER',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    duration: 232,
    genre: 'Epic Fantasy / Orchestral',
    views: '18M views',
    lyricsSnippet: 'Firelight burning the tower, hear the choir sing of power...',
    isTrending: true,
  },
  {
    id: 'daft-punk-get-lucky',
    title: 'Get Lucky (ft. Pharrell)',
    artist: 'Daft Punk',
    videoId: '5NV6Rdv1a3I',
    thumbnailUrl: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    duration: 248,
    genre: 'Electronic / Nu-Disco',
    views: '720M views',
    lyricsSnippet: 'She\'s up all night \'til the sun, I\'m up all night to get lucky...',
  },
  {
    id: 'coldplay-yellow',
    title: 'Yellow',
    artist: 'Coldplay',
    videoId: 'yKNxeF4KMsY',
    thumbnailUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    duration: 269,
    genre: 'Alternative / Britpop',
    views: '980M views',
    lyricsSnippet: 'Look at the stars, look how they shine for you...',
  },
  {
    id: 'billie-eilish-chihiro',
    title: 'CHIHIRO',
    artist: 'Billie Eilish',
    videoId: 'BY_XwvKogC8',
    thumbnailUrl: 'https://i.ytimg.com/vi/BY_XwvKogC8/hqdefault.jpg',
    duration: 304,
    genre: 'Dark Pop / Ambient',
    views: '92M views',
    lyricsSnippet: 'Open up the door, can you open up the door? I know you said before...',
  },
  {
    id: 'the-weeknd-blinding-lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    videoId: '4NRXx6U8ABQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    duration: 262,
    genre: 'Synthwave / R&B',
    views: '890M views',
    lyricsSnippet: 'I said, ooh, I\'m blinded by the lights, no, I can\'t sleep until I feel your touch...',
  },
];

interface CuratedShowcaseProps {
  onStartSession: (source: VideoSource) => void;
  onOpenArtist?: (artistName: string) => void;
}

export const CuratedShowcase: React.FC<CuratedShowcaseProps> = React.memo<CuratedShowcaseProps>(({
  onStartSession,
  onOpenArtist,
}) => {
  const handlePlayMasterpiece = (piece: CuratedMasterpiece) => {
    onStartSession({
      kind: 'youtube',
      sourceId: piece.videoId === '43_BG3_THE_POWER' ? 'yKNxeF4KMsY' : piece.videoId,
      title: `${piece.artist} - ${piece.title}`,
      artist: piece.artist,
      thumbnailUrl: piece.thumbnailUrl,
      duration: piece.duration,
    });
  };

  return (
    <section className="curated-showcase-section" aria-label="Curated Masterpieces">
      <div className="curated-container">
        {/* Section Header */}
        <div className="curated-header">
          <div className="curated-title-group">
            <div className="curated-label-wrap">
              <Sparkles size={12} className="curated-label-sparkle" />
              <span className="curated-label-text">EXOTIC MASTER SELECTION</span>
            </div>
            <h2 className="curated-main-title">Curated Soundscapes</h2>
            <p className="curated-sub-title">
              Hand-calibrated music video productions paired with synchronized word-by-word vocal illumination.
            </p>
          </div>

          {onOpenArtist && (
            <button
              type="button"
              className="curated-explore-all-btn"
              onClick={() => onOpenArtist('Juice WRLD')}
            >
              <span>Explore Artist Discographies</span>
              <ArrowUpRight size={15} />
            </button>
          )}
        </div>

        {/* Masterpieces Billboard Grid */}
        <div className="curated-grid">
          {MASTERPIECES.map((piece, index) => (
            <motion.article
              key={piece.id}
              className="curated-card"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Vinyl Sleeve Visual Stage */}
              <div className="card-sleeve-stage">
                {/* Slid-out Vinyl Disc Preview */}
                <div className="card-vinyl-disc" aria-hidden="true">
                  <div className="card-vinyl-grooves" />
                  <div className="card-vinyl-center">
                    <img
                      src={piece.thumbnailUrl}
                      alt=""
                      className="card-vinyl-artwork"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Album Cover / Artwork Sleeve */}
                <div className="card-cover-sleeve">
                  <img
                    src={piece.thumbnailUrl}
                    alt={`${piece.title} by ${piece.artist}`}
                    className="sleeve-artwork"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="sleeve-gradient-wash" />

                  {/* Badges on artwork */}
                  <div className="sleeve-badge-top">
                    {piece.isTrending && (
                      <span className="trending-pill">
                        <Flame size={11} />
                        <span>Featured</span>
                      </span>
                    )}
                    <span className="views-pill">{piece.views}</span>
                  </div>

                  {/* Play Action Trigger on Hover */}
                  <button
                    type="button"
                    className="sleeve-play-btn"
                    onClick={() => handlePlayMasterpiece(piece)}
                    title={`Listen to ${piece.title}`}
                    aria-label={`Play ${piece.title} by ${piece.artist}`}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Spin Now</span>
                  </button>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="card-meta-content">
                <div className="card-genre-row">
                  <span className="card-genre-pill">{piece.genre}</span>
                  <span className="card-duration-text">
                    {Math.floor(piece.duration / 60)}:{(piece.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <h3 className="card-track-title" onClick={() => handlePlayMasterpiece(piece)}>
                  {piece.title}
                </h3>

                <div className="card-artist-row">
                  <span className="card-artist-name">{piece.artist}</span>
                  {onOpenArtist && (
                    <button
                      type="button"
                      className="artist-direct-link"
                      onClick={() => onOpenArtist(piece.artist)}
                      title={`View ${piece.artist} profile & discography`}
                    >
                      <User size={11} />
                      <span>Artist</span>
                    </button>
                  )}
                </div>

                {/* Lyric Excerpt Snippet */}
                <p className="card-lyric-snippet">
                  "{piece.lyricsSnippet}"
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
});

CuratedShowcase.displayName = 'CuratedShowcase';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  Play,
  Music,
  Headphones,
} from 'lucide-react';
import { CURATED_ARTISTS } from '../../services/artist/artistService';
import type { VideoSource } from '../../types/session';
import './ArtistsHub.css';

interface ArtistsHubProps {
  onSelectArtist: (artistName: string) => void;
  onBackToHome: () => void;
  activeSession?: VideoSource | null;
  onResumePlayer?: () => void;
}

type GenreFilter = 'all' | 'hiphop' | 'rnb' | 'rock' | 'electronic' | 'pop';

interface GenreOption {
  id: GenreFilter;
  label: string;
}

const GENRE_OPTIONS: GenreOption[] = [
  { id: 'all', label: 'All Artists' },
  { id: 'hiphop', label: 'Hip-Hop & Trap' },
  { id: 'rnb', label: 'R&B / Soul' },
  { id: 'rock', label: 'Rock & Classics' },
  { id: 'electronic', label: 'Electronic & Synth' },
  { id: 'pop', label: 'Pop & Alternative' },
];

export const ArtistsHub: React.FC<ArtistsHubProps> = ({
  onSelectArtist,
  onBackToHome: _onBackToHome,
  activeSession,
  onResumePlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>('all');

  const artistList = useMemo(() => {
    return Object.values(CURATED_ARTISTS);
  }, []);

  const filteredArtists = useMemo(() => {
    let result = artistList;

    // Filter by genre
    if (selectedGenre !== 'all') {
      result = result.filter((artist) => {
        const genre = artist.genre.toLowerCase();
        switch (selectedGenre) {
          case 'hiphop':
            return genre.includes('rap') || genre.includes('hip-hop') || genre.includes('trap');
          case 'rnb':
            return genre.includes('r&b') || genre.includes('soul');
          case 'rock':
            return genre.includes('rock') || genre.includes('glam') || genre.includes('legend');
          case 'electronic':
            return genre.includes('electronic') || genre.includes('synth') || genre.includes('french touch');
          case 'pop':
            return genre.includes('pop') || genre.includes('alternative') || genre.includes('alt-pop');
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (artist) =>
          artist.name.toLowerCase().includes(q) ||
          artist.genre.toLowerCase().includes(q) ||
          artist.bio?.toLowerCase().includes(q) ||
          artist.tracks.some((t) => t.title.toLowerCase().includes(q))
      );
    }

    return result;
  }, [artistList, selectedGenre, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectArtist(searchQuery.trim());
    }
  };

  return (
    <div className="artists-hub-page">
      <main className="artists-hub-viewport">
        {/* Hero Section */}
        <section className="artists-hub-hero">
          <motion.div
            className="artists-hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles size={13} className="text-accent" />
            <span>EXPLORE ARTISTS & DISCOGRAPHIES</span>
          </motion.div>

          <motion.h1
            className="artists-hero-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            Discover Artists & Complete Discographies
          </motion.h1>

          <motion.p
            className="artists-hero-subtitle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            Explore verified studio collections, 4K master visuals, collaborations, and complete song catalogues.
          </motion.p>

          {/* Interactive Search Bar */}
          <motion.form
            className="artists-search-form"
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.24 }}
          >
            <div className="artists-search-input-wrap">
              <Search size={18} className="artists-search-icon" />
              <input
                type="text"
                className="artists-search-input"
                placeholder="Search any artist (e.g. Juice WRLD, The Weeknd, Taylor Swift, Coldplay)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="artists-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </motion.form>

          {/* Live Action Banner for custom artist searches */}
          <AnimatePresence>
            {searchQuery.trim().length > 0 && (
              <motion.div
                className="artists-dynamic-search-banner"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => onSelectArtist(searchQuery.trim())}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectArtist(searchQuery.trim());
                }}
              >
                <div className="dynamic-banner-content">
                  <div className="dynamic-banner-icon">
                    <Sparkles size={16} className="text-accent" />
                  </div>
                  <div className="dynamic-banner-text">
                    <span className="dynamic-banner-label">Explore Any Artist Worldwide</span>
                    <span className="dynamic-banner-name">
                      Open complete discography, collabs & 4K visuals for <strong>"{searchQuery.trim()}"</strong>
                    </span>
                  </div>
                </div>
                <div className="dynamic-banner-action">
                  <span>Explore Discography</span>
                  <ArrowRight size={14} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Genre / Mood Filter Chips */}
          <motion.div
            className="artists-genre-chips"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
          >
            {GENRE_OPTIONS.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`artists-genre-chip ${selectedGenre === genre.id ? 'active' : ''}`}
                onClick={() => setSelectedGenre(genre.id)}
              >
                {selectedGenre === genre.id && <Sparkles size={11} className="chip-sparkle" />}
                <span>{genre.label}</span>
              </button>
            ))}
          </motion.div>
        </section>

        {/* Featured Artists Grid */}
        <section className="artists-grid-section">
          <div className="artists-grid-header">
            <div className="grid-header-title-wrap">
              <h2 className="artists-grid-title">
                {searchQuery ? `Search Results (${filteredArtists.length})` : 'Featured Master Artists'}
              </h2>
              <span className="artists-grid-caption">
                Verified high-resolution photography & extensive official song catalogues
              </span>
            </div>
            <div className="artists-count-badge">
              <Headphones size={13} />
              <span>{filteredArtists.length} Artists</span>
            </div>
          </div>

          {filteredArtists.length > 0 ? (
            <div className="artists-cards-grid">
              {filteredArtists.map((artist, index) => (
                <motion.article
                  key={artist.id}
                  className="artist-card"
                  onClick={() => onSelectArtist(artist.name)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectArtist(artist.name);
                  }}
                  aria-label={`Explore ${artist.name}`}
                >
                  {/* High-Resolution 2560x1440 Master Photography Backdrop */}
                  <div className="artist-card-backdrop">
                    <img
                      src={artist.heroImageUrl}
                      alt={artist.name}
                      className="artist-card-photo"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="artist-card-gradient" />
                    <div className="artist-card-vignette" />
                  </div>

                  {/* Top Badges */}
                  <div className="artist-card-top">
                    {artist.verified && (
                      <span className="card-verified-badge" title="Official Verified Artist">
                        <CheckCircle2 size={11} />
                        <span>Official Artist</span>
                      </span>
                    )}
                    {artist.monthlyListeners && (
                      <span className="card-listeners-badge">
                        {artist.monthlyListeners.replace('monthly listeners', '').trim()}
                      </span>
                    )}
                  </div>

                  {/* Bottom Content Overlay */}
                  <div className="artist-card-bottom">
                    <span className="card-genre">{artist.genre}</span>
                    <h3 className="card-artist-name">{artist.name}</h3>

                    <div className="card-footer-meta">
                      <span className="card-track-count">
                        <Music size={12} />
                        <span>{artist.tracks.length}+ Songs & Videos</span>
                      </span>

                      <div className="card-action-btn">
                        <span>Explore</span>
                        <Play size={11} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            /* Empty State with Direct Search Action */
            <div className="artists-empty-state">
              <div className="empty-icon-wrap">
                <Music size={32} />
              </div>
              <h3 className="empty-title">No Curated Matches for "{searchQuery}"</h3>
              <p className="empty-desc">
                LyriXer can fetch complete discography, music videos, collabs, and official audios for any artist dynamically.
              </p>
              <button
                type="button"
                className="empty-action-btn"
                onClick={() => onSelectArtist(searchQuery.trim())}
              >
                <Sparkles size={14} />
                <span>Search and Load Discography for "{searchQuery.trim()}"</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Floating Active Player Session Dock (if music is playing in background) */}
      {activeSession && onResumePlayer && (
        <aside className="artists-active-player-dock" aria-label="Active Player Session">
          <div className="dock-meta" onClick={onResumePlayer} role="button" tabIndex={0}>
            <div className="dock-pulse-indicator" />
            <div className="dock-track-info">
              <span className="dock-title">{activeSession.title}</span>
              <span className="dock-artist">{activeSession.artist || 'Playing in Background'}</span>
            </div>
          </div>
          <button
            type="button"
            className="dock-resume-btn"
            onClick={onResumePlayer}
            title="Resume playback session"
          >
            <Play size={12} fill="currentColor" />
            <span>Resume</span>
          </button>
        </aside>
      )}
    </div>
  );
};
export default ArtistsHub;

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Mic2,
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

interface ArtistSuggestion {
  name: string;
  genre?: string;
  imageUrl?: string;
  isCurated?: boolean;
  trackCount?: number;
}

export const ArtistsHub: React.FC<ArtistsHubProps> = ({
  onSelectArtist,
  onBackToHome: _onBackToHome,
  activeSession,
  onResumePlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<ArtistSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const artistList = useMemo(() => {
    return Object.values(CURATED_ARTISTS);
  }, []);

  // Live external autocomplete query via iTunes Search API (fast, CORS-enabled, free)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setLiveSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=6`
        );
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.results)) {
            const items: ArtistSuggestion[] = data.results
              .filter((r: any) => r.artistName)
              .map((r: any) => ({
                name: r.artistName,
                genre: r.primaryGenreName,
                isCurated: false,
              }));
            setLiveSuggestions(items);
          }
        }
      } catch {
        // ignore network error
      }
    }, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Combined matching suggestions: Curated + Live External API
  const matchingSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const curatedMatches: ArtistSuggestion[] = artistList
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.genre.toLowerCase().includes(q) ||
          a.bio?.toLowerCase().includes(q)
      )
      .map((a) => ({
        name: a.name,
        genre: a.genre,
        imageUrl: a.heroImageUrl,
        isCurated: true,
        trackCount: a.tracks.length,
      }));

    const seen = new Set(curatedMatches.map((m) => m.name.toLowerCase()));
    const externalMatches: ArtistSuggestion[] = [];

    for (const live of liveSuggestions) {
      const cleanName = live.name.toLowerCase();
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        externalMatches.push(live);
      }
    }

    return [...curatedMatches, ...externalMatches].slice(0, 6);
  }, [searchQuery, artistList, liveSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredArtists = useMemo(() => {
    let result = artistList;

    // Filter by genre
    if (selectedGenre !== 'all') {
      result = result.filter((artist) => {
        const genre = artist.genre.toLowerCase();
        switch (selectedGenre) {
          case 'hiphop':
            return (
              genre.includes('rap') ||
              genre.includes('hip-hop') ||
              genre.includes('trap') ||
              genre.includes('emo')
            );
          case 'rnb':
            return genre.includes('r&b') || genre.includes('soul');
          case 'rock':
            return (
              genre.includes('rock') ||
              genre.includes('glam') ||
              genre.includes('legend')
            );
          case 'electronic':
            return (
              genre.includes('electronic') ||
              genre.includes('synth') ||
              genre.includes('french touch')
            );
          case 'pop':
            return (
              genre.includes('pop') ||
              genre.includes('alternative') ||
              genre.includes('alt-pop')
            );
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
    if (selectedIndex >= 0 && selectedIndex < matchingSuggestions.length) {
      onSelectArtist(matchingSuggestions[selectedIndex].name);
      setIsSearchFocused(false);
    } else if (searchQuery.trim()) {
      onSelectArtist(searchQuery.trim());
      setIsSearchFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matchingSuggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matchingSuggestions.length));
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  return (
    <div className="artists-hub-page">
      <main className="artists-hub-viewport">
        {/* Hero Section */}
        <section className="artists-hub-hero">
          {/* Authentic & Classy Artists Master Insignia Logo */}
          <motion.div
            className="artists-master-logo"
            initial={{ opacity: 0, scale: 0.9, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="master-logo-halo" />
            <div className="master-logo-glyph">
              <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
                <circle
                  cx="14"
                  cy="14"
                  r="12"
                  stroke="rgba(167, 139, 250, 0.45)"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
                <circle
                  cx="14"
                  cy="14"
                  r="8.5"
                  stroke="rgba(167, 139, 250, 0.25)"
                  strokeWidth="1"
                />
                <path
                  d="M14 6v16M10 9v10M18 9v10M7 11v6M21 11v6"
                  stroke="#A78BFA"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="14" cy="14" r="2.5" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="master-logo-badge">
              <Sparkles size={11} className="text-accent" />
              <span>LYRIXER ARTISTS &bull; VERIFIED DISCOGRAPHIES</span>
            </div>
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

          {/* Interactive Search Bar Container with Autocomplete Options Dropdown */}
          <div ref={searchContainerRef} className="artists-search-container">
            <motion.form
              className="artists-search-form"
              onSubmit={handleSearchSubmit}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.24 }}
            >
              <div
                className={`artists-search-input-wrap ${
                  isSearchFocused ? 'is-focused' : ''
                }`}
              >
                <Search size={18} className="artists-search-icon" />
                <input
                  type="text"
                  className="artists-search-input"
                  placeholder="Search any artist (e.g. Juice WRLD, XXXTENTACION, The Weeknd, Taylor Swift)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck={false}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="artists-search-clear"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedIndex(-1);
                    }}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </motion.form>

            {/* Interactive Search Options / Autocomplete Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <motion.div
                  className="artists-suggestions-dropdown"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="suggestions-header">
                    <span className="suggestions-heading">Select Artist to Explore</span>
                    <span className="suggestions-count">
                      {matchingSuggestions.length} matching {matchingSuggestions.length === 1 ? 'artist' : 'artists'}
                    </span>
                  </div>

                  <div className="suggestions-list" role="listbox">
                    {matchingSuggestions.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className={`suggestion-item ${
                          index === selectedIndex ? 'highlighted' : ''
                        }`}
                        onClick={() => {
                          onSelectArtist(item.name);
                          setIsSearchFocused(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        role="option"
                        aria-selected={index === selectedIndex}
                      >
                        <div className="suggestion-avatar">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="suggestion-avatar-img"
                              loading="lazy"
                            />
                          ) : (
                            <div className="suggestion-avatar-icon">
                              <Mic2 size={13} />
                            </div>
                          )}
                        </div>

                        <div className="suggestion-info">
                          <div className="suggestion-name-row">
                            <span className="suggestion-name">{item.name}</span>
                            {item.isCurated && (
                              <span
                                className="suggestion-verified-pill"
                                title="Official Verified Artist Profile"
                              >
                                <CheckCircle2 size={10} />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                          <span className="suggestion-genre">
                            {item.genre || 'Music Artist'}
                            {item.trackCount ? ` • ${item.trackCount}+ songs & videos` : ''}
                          </span>
                        </div>

                        <div className="suggestion-action">
                          <span className="suggestion-action-text">Explore</span>
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    ))}

                    {/* Direct Search Option at bottom */}
                    <div
                      className={`suggestion-item search-custom-action ${
                        selectedIndex === matchingSuggestions.length ? 'highlighted' : ''
                      }`}
                      onClick={() => {
                        onSelectArtist(searchQuery.trim());
                        setIsSearchFocused(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(matchingSuggestions.length)}
                    >
                      <div className="suggestion-avatar-icon action-icon">
                        <Sparkles size={14} className="text-accent" />
                      </div>
                      <div className="suggestion-info">
                        <span className="suggestion-name">
                          Explore Complete Discography for <strong>"{searchQuery.trim()}"</strong>
                        </span>
                        <span className="suggestion-genre">
                          Load 4K visuals, collabs & official music videos worldwide
                        </span>
                      </div>
                      <div className="suggestion-action">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                className={`artists-genre-chip ${
                  selectedGenre === genre.id ? 'active' : ''
                }`}
                onClick={() => setSelectedGenre(genre.id)}
              >
                {selectedGenre === genre.id && (
                  <Sparkles size={11} className="chip-sparkle" />
                )}
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
                {searchQuery
                  ? `Search Results (${filteredArtists.length})`
                  : 'Featured Master Artists'}
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
                  transition={{
                    duration: 0.4,
                    delay: Math.min(index * 0.05, 0.4),
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectArtist(artist.name);
                  }}
                  aria-label={`Explore ${artist.name}`}
                >
                  {/* High-Resolution Master Photography Backdrop */}
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
                      <span
                        className="card-verified-badge"
                        title="Official Verified Artist"
                      >
                        <CheckCircle2 size={11} />
                        <span>Official Artist</span>
                      </span>
                    )}
                    {artist.monthlyListeners && (
                      <span className="card-listeners-badge">
                        {artist.monthlyListeners
                          .replace('monthly listeners', '')
                          .trim()}
                      </span>
                    )}
                  </div>

                  {/* Bottom Content Overlay with Authentic Artist Avatar Crest */}
                  <div className="artist-card-bottom">
                    <div className="card-artist-identity">
                      <div className="card-artist-avatar">
                        <img
                          src={artist.heroImageUrl}
                          alt={artist.name}
                          className="card-avatar-img"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="card-avatar-ring" />
                        {artist.verified && (
                          <div
                            className="card-avatar-check"
                            title="Official Verified Artist"
                          >
                            <CheckCircle2 size={10} />
                          </div>
                        )}
                      </div>

                      <div className="card-artist-meta">
                        <span className="card-genre">{artist.genre}</span>
                        <h3 className="card-artist-name">{artist.name}</h3>
                      </div>
                    </div>

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
              <h3 className="empty-title">
                No Curated Matches for "{searchQuery}"
              </h3>
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

      {/* Floating Active Player Session Dock */}
      {activeSession && onResumePlayer && (
        <aside
          className="artists-active-player-dock"
          aria-label="Active Player Session"
        >
          <div
            className="dock-meta"
            onClick={onResumePlayer}
            role="button"
            tabIndex={0}
          >
            <div className="dock-pulse-indicator" />
            <div className="dock-track-info">
              <span className="dock-title">{activeSession.title}</span>
              <span className="dock-artist">
                {activeSession.artist || 'Playing in Background'}
              </span>
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

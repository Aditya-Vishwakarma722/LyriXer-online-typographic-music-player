import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  Search,
  Loader2,
  Music2,
  ExternalLink,
  Sparkles,
  Clock,
  Zap,
  Check,
  ArrowRight,
  X,
} from 'lucide-react';
import { LyricsProvider, type LrclibSearchResult } from '../../services/lyrics/LyricsProvider';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import { TimelineMatcher } from '../../services/lyrics/timelineMatcher';
import { formatDuration } from '../../utils/formatters';
import './LrclibSearchModal.css';

interface LrclibSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectLyrics: (track: LyricTrack, suggestedOffset?: number) => void;
  videoDuration?: number;
  videoTitle?: string;
  videoArtist?: string;
}

export const LrclibSearchModal: React.FC<LrclibSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onSelectLyrics,
  videoDuration = 0,
  videoTitle = '',
  videoArtist = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LrclibSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (termToSearch: string) => {
    const q = termToSearch.trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const searchResults = await LyricsProvider.searchLrclib(q);
      setResults(searchResults);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const activeQuery = (initialQuery || '').trim();
      setQuery(activeQuery);
      if (activeQuery) {
        let isMounted = true;
        setIsSearching(true);
        setHasSearched(true);
        LyricsProvider.searchLrclib(activeQuery)
          .then((res) => {
            if (isMounted) {
              setResults(res);
              setIsSearching(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setResults([]);
              setIsSearching(false);
            }
          });
        return () => {
          isMounted = false;
        };
      }
    }
  }, [isOpen, initialQuery]);

  const handleSearch = () => {
    performSearch(query);
  };

  // Timeline analysis: Match LRCLIB results against video timeline
  const timelineSummary = useMemo(() => {
    return TimelineMatcher.matchResults(
      results,
      videoDuration,
      videoTitle || query,
      videoArtist
    );
  }, [results, videoDuration, videoTitle, videoArtist, query]);

  const handleSelect = (item: LrclibSearchResult, suggestedOffset = 0) => {
    const track = LyricsProvider.convertLrclibItemToTrack(item, videoTitle, videoArtist);
    if (track) {
      onSelectLyrics(track, suggestedOffset);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Lyrics on LRCLIB"
      description="Look up synchronized lyrics and match the complete video timeline"
      maxWidth="940px"
    >
      <div className="lrclib-modal-content">
        {/* Active Playing Video Context Bar */}
        {(videoTitle || videoDuration > 0) && (
          <div className="lrclib-active-context-bar">
            <div className="context-left">
              <span className="context-indicator-dot" />
              <span className="context-label">CURRENT VIDEO</span>
              <span className="context-title" title={videoTitle}>
                {videoTitle || 'Active Track'}
              </span>
              {videoArtist && (
                <span className="context-artist">&bull; {videoArtist}</span>
              )}
            </div>
            {videoDuration > 0 && (
              <div className="context-duration-badge">
                <Clock size={11} />
                <span>Video: {formatDuration(videoDuration)}</span>
              </div>
            )}
          </div>
        )}

        {/* Search Input Bar with Clear Action */}
        <form
          className="lrclib-search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <div className="lrclib-input-wrap">
            <Search size={16} className="lrclib-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by song name and artist (e.g. Juice WRLD - Lucid Dreams)..."
              className="lrclib-search-input"
              autoFocus
            />
            {query.trim().length > 0 && (
              <button
                type="button"
                className="lrclib-input-clear-btn"
                onClick={() => setQuery('')}
                title="Clear query"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSearching || !query.trim()}
            className="lrclib-submit-btn"
          >
            {isSearching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={15} />
                <span>Search</span>
              </>
            )}
          </Button>
        </form>

        {/* Results Container */}
        <div className="lrclib-results-container">
          {isSearching && (
            <div className="lrclib-loading">
              <div className="lrclib-loading-spinner-wrap">
                <Loader2 size={28} className="animate-spin text-accent" />
              </div>
              <span className="lrclib-loading-text">
                Querying LRCLIB & matching video timeline...
              </span>
              <span className="lrclib-loading-subtext">
                Calculating vocal start offsets and sync alignment
              </span>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="lrclib-no-results">
              <Music2 size={36} className="lrclib-no-results-icon" />
              <p className="no-results-main">
                No matching tracks found on LRCLIB for "{query}".
              </p>
              <span className="no-results-hint">
                Try searching with just the song title, an alternate spelling, or the artist name.
              </span>
            </div>
          )}

          {/* Featured: Best Suitable Option Hero Card (Calculated from Video Duration vs Song Duration) */}
          {!isSearching && timelineSummary.bestMatch && (
            <div className="lrclib-featured-hero">
              <div className="featured-hero-header">
                <span className="featured-hero-badge">
                  <Sparkles size={12} />
                  Best Suitable Option
                </span>

                <div className="featured-hero-timing">
                  <span className="timing-pill">
                    Song: <strong>{formatDuration(timelineSummary.bestMatch.item.duration || 0)}</strong>
                  </span>
                  {videoDuration > 0 && (
                    <>
                      <span className="timing-divider">&bull;</span>
                      <span className="timing-pill">
                        Video: <strong>{formatDuration(videoDuration)}</strong>
                      </span>
                    </>
                  )}
                  {timelineSummary.bestMatch.hasIntroDelay && (
                    <span className="timing-intro-tag">
                      <Zap size={11} />
                      Starts at {timelineSummary.bestMatch.formattedOffset}
                    </span>
                  )}
                </div>
              </div>

              <div className="featured-hero-body">
                <div className="featured-hero-title-group">
                  <h4 className="featured-hero-track">
                    {timelineSummary.bestMatch.item.trackName}
                  </h4>
                  <p className="featured-hero-artist">
                    {timelineSummary.bestMatch.item.artistName}
                    {timelineSummary.bestMatch.item.albumName && (
                      <span className="featured-hero-album">
                        {' '}&bull; {timelineSummary.bestMatch.item.albumName}
                      </span>
                    )}
                  </p>
                </div>

                {timelineSummary.bestMatch.matchReason && (
                  <p className="featured-hero-reason">
                    {timelineSummary.bestMatch.matchReason}
                  </p>
                )}
              </div>

              <div className="featured-hero-actions">
                <Button
                  variant="primary"
                  size="md"
                  className="btn-apply-featured"
                  onClick={() =>
                    handleSelect(
                      timelineSummary.bestMatch!.item,
                      timelineSummary.bestMatch!.introOffset
                    )
                  }
                >
                  <Sparkles size={14} />
                  <span>
                    {timelineSummary.bestMatch.hasIntroDelay
                      ? `Apply with ${timelineSummary.bestMatch.formattedOffset} Sync`
                      : 'Apply Synchronized Lyrics'}
                  </span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Subtitles Results Grid: 2 in a Row */}
          {!isSearching && results.length > 0 && (
            <div className="lrclib-results-section">
              <div className="results-section-header">
                <div className="results-header-left">
                  <span className="results-list-heading">
                    All Matching Subtitles & Lyrics
                  </span>
                  <span className="results-count-pill">{results.length} available</span>
                </div>
                <span className="results-layout-hint">
                  Showing 2 in a row &bull; Select any subtitle to apply
                </span>
              </div>

              <div className="lrclib-results-grid">
                {timelineSummary.scoredResults.map((scoredItem) => (
                  <div
                    key={scoredItem.item.id}
                    className={`lrclib-subtitle-card ${
                      scoredItem.isBestMatch ? 'is-best-match' : ''
                    }`}
                    onClick={() => handleSelect(scoredItem.item, scoredItem.introOffset)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(scoredItem.item, scoredItem.introOffset);
                      }
                    }}
                  >
                    {/* Top Row: Track Title & Badges */}
                    <div className="subtitle-card-header">
                      <div className="subtitle-title-wrap">
                        <h5
                          className="subtitle-track-name"
                          title={scoredItem.item.trackName}
                        >
                          {scoredItem.item.trackName}
                        </h5>
                        <div className="subtitle-artist-row">
                          <span className="subtitle-artist-name">
                            {scoredItem.item.artistName}
                          </span>
                          {scoredItem.item.albumName && (
                            <span
                              className="subtitle-album-name"
                              title={scoredItem.item.albumName}
                            >
                              &bull; {scoredItem.item.albumName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="subtitle-badge-cluster">
                        {scoredItem.item.syncedLyrics ? (
                          <span className="badge-sync synced" title="Synchronized lyrics available">
                            <Sparkles size={10} />
                            Synced
                          </span>
                        ) : (
                          <span className="badge-sync plain" title="Plain text lyrics">
                            Plain
                          </span>
                        )}
                        {scoredItem.item.duration && (
                          <span className="badge-duration-tag">
                            <Clock size={10} />
                            {formatDuration(scoredItem.item.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline & Vocal Alignment Row */}
                    <div className="subtitle-card-timeline">
                      {scoredItem.hasIntroDelay ? (
                        <span
                          className="tag-intro-delay"
                          title="Calibrated offset for video vocal start"
                        >
                          <Zap size={11} />
                          +{scoredItem.formattedOffset} Vocal Start
                        </span>
                      ) : (
                        <span className="tag-direct-sync">
                          <Check size={11} />
                          Direct Timeline Match
                        </span>
                      )}

                      {scoredItem.isBestMatch && (
                        <span className="tag-recommended-mini">
                          <Sparkles size={10} />
                          Best Match
                        </span>
                      )}
                    </div>

                    {/* Match reason text if present */}
                    {scoredItem.matchReason && (
                      <p className="subtitle-reason-text">
                        {scoredItem.matchReason}
                      </p>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="subtitle-card-footer">
                      <span className="subtitle-id-label">ID #{scoredItem.item.id}</span>
                      <button
                        type="button"
                        className="btn-apply-subtitle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(scoredItem.item, scoredItem.introOffset);
                        }}
                      >
                        <span>Apply</span>
                        <ArrowRight size={12} className="apply-icon" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer attribution */}
        <div className="lrclib-modal-footer">
          <a
            href="https://lrclib.net"
            target="_blank"
            rel="noopener noreferrer"
            className="lrclib-link"
          >
            Powered by LRCLIB Open Lyrics Database
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </Modal>
  );
};

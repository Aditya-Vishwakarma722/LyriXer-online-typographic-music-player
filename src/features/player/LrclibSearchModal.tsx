import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Search, Loader2, Check, Music2, ExternalLink } from 'lucide-react';
import { LyricsProvider, type LrclibSearchResult } from '../../services/lyrics/LyricsProvider';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import { formatDuration } from '../../utils/formatters';
import './LrclibSearchModal.css';

interface LrclibSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectLyrics: (track: LyricTrack) => void;
}

export const LrclibSearchModal: React.FC<LrclibSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onSelectLyrics,
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
    if (isOpen && initialQuery) {
      let isMounted = true;
      LyricsProvider.searchLrclib(initialQuery.trim()).then((res) => {
        if (isMounted) {
          setResults(res);
          setHasSearched(true);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, initialQuery]);

  const handleSearch = () => {
    performSearch(query);
  };

  const handleSelect = (item: LrclibSearchResult) => {
    const track = LyricsProvider.convertLrclibItemToTrack(item);
    if (track) {
      onSelectLyrics(track);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Lyrics on LRCLIB"
      description="Look up synchronized lyrics directly from https://lrclib.net"
      maxWidth="600px"
    >
      <div className="lrclib-modal-content">
        {/* Search Input Bar */}
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
              placeholder="Search by song name and artist (e.g. Coldplay Yellow)..."
              className="lrclib-search-input"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
          </Button>
        </form>

        {/* Results List */}
        <div className="lrclib-results-container">
          {isSearching && (
            <div className="lrclib-loading">
              <Loader2 size={24} className="animate-spin text-accent" />
              <span>Querying lrclib.net database...</span>
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="lrclib-no-results">
              <Music2 size={32} className="text-muted" />
              <p>No matching tracks found on LRCLIB for "{query}".</p>
              <span className="text-secondary text-sm">
                Try searching with just the song title or a simpler spelling.
              </span>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="lrclib-results-list">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="lrclib-result-card"
                  onClick={() => handleSelect(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(item);
                    }
                  }}
                >
                  <div className="result-info">
                    <div className="result-title-row">
                      <span className="result-track">{item.trackName}</span>
                      {item.syncedLyrics ? (
                        <span className="badge-synced">
                          <Check size={11} /> Synced
                        </span>
                      ) : (
                        <span className="badge-plain">Plain</span>
                      )}
                    </div>
                    <span className="result-artist">{item.artistName}</span>
                    {item.albumName && (
                      <span className="result-album">{item.albumName}</span>
                    )}
                  </div>

                  <div className="result-actions">
                    {item.duration && (
                      <span className="result-duration">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                    <button type="button" className="btn-apply-lyrics">
                      Apply
                    </button>
                  </div>
                </div>
              ))}
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

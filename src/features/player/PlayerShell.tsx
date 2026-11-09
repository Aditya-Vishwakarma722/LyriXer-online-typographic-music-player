import React, { useState, useEffect, useRef } from 'react';
import { YouTubePlayerView } from './YouTubePlayerView';
import { LocalPlayerView } from './LocalPlayerView';
import { PlayerControls } from './PlayerControls';
import { LrclibSearchModal } from './LrclibSearchModal';
import { LyricsProvider } from '../../services/lyrics/LyricsProvider';
import { useLyricsSync } from '../../hooks/useLyricsSync';
import { cleanTrackTitle, KNOWN_VIDEO_INTROS } from '../../utils/youtube';
import type { VideoPlayerAdapter, VideoPlayerState, VideoPlayerListener } from '../../services/video/types';
import type { VideoSource, UserPreferences } from '../../types/session';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import { Sparkles, Search, Upload, X, CheckCircle2, UserRound, Clock } from 'lucide-react';
import './PlayerShell.css';

interface PlayerShellProps {
  source: VideoSource;
  preferences: UserPreferences;
  onExit: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onOpenArtist?: (artistName?: string) => void;
}

export const PlayerShell: React.FC<PlayerShellProps> = ({
  source,
  preferences,
  onExit,
  onUpdatePreferences,
  onOpenArtist,
}) => {
  const [adapter, setAdapter] = useState<VideoPlayerAdapter | null>(null);
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    currentTime: 0,
    duration: source.duration || 0,
    paused: true,
    volume: 80,
    muted: false,
    status: 'loading',
  });

  const [lyrics, setLyrics] = useState<LyricTrack | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(true);
  const [trackInfo, setTrackInfo] = useState({
    title: source.title,
    artist: source.artist || '',
  });

  // Load saved intro/vocal timing offset:
  // 1. Verified intro offset from KNOWN_VIDEO_INTROS (e.g. 0.0 for curated tracks)
  // 2. Saved offset from localStorage
  // 3. Fallback to 0
  const [manualOffset, setManualOffset] = useState<number>(() => {
    if (KNOWN_VIDEO_INTROS[source.sourceId] !== undefined) {
      return KNOWN_VIDEO_INTROS[source.sourceId];
    }
    try {
      const saved = localStorage.getItem(`lyrixer_offset_${source.sourceId}`);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  // Ensure manualOffset resets appropriately whenever the active video source changes
  useEffect(() => {
    let offset = 0;
    if (KNOWN_VIDEO_INTROS[source.sourceId] !== undefined) {
      offset = KNOWN_VIDEO_INTROS[source.sourceId];
    } else {
      try {
        const saved = localStorage.getItem(`lyrixer_offset_${source.sourceId}`);
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed)) offset = parsed;
        }
      } catch {
        // ignore
      }
    }
    setManualOffset(offset);
    manualOffsetRef.current = offset;
  }, [source.sourceId]);

  const [introNotice, setIntroNotice] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lyricsVisible, setLyricsVisible] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lrcFileInputRef = useRef<HTMLInputElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Sync refs to avoid stale closures in adapter listeners
  const lyricsRef = useRef(lyrics);
  const manualOffsetRef = useRef(manualOffset);
  const playerStateRef = useRef(playerState);
  const trackInfoRef = useRef(trackInfo);

  useEffect(() => {
    lyricsRef.current = lyrics;
    manualOffsetRef.current = manualOffset;
    playerStateRef.current = playerState;
    trackInfoRef.current = trackInfo;
  });

  // Sync hook (manualOffset shifts effective lyric time to compensate for music video intros)
  const { activeIndex } = useLyricsSync(lyrics, playerState.currentTime, manualOffset);

  // Detect intro preamble if video duration exceeds lyrics audio duration by 5s+
  const detectedIntroGap = React.useMemo(() => {
    if (
      lyrics &&
      lyrics.source !== 'curated' &&
      lyrics.duration &&
      playerState.duration > lyrics.duration + 5
    ) {
      return Number((playerState.duration - lyrics.duration).toFixed(1));
    }
    return null;
  }, [lyrics, playerState.duration]);

  const handleOffsetChange = (newOffset: number) => {
    setManualOffset(newOffset);
    manualOffsetRef.current = newOffset;
    try {
      localStorage.setItem(`lyrixer_offset_${source.sourceId}`, newOffset.toString());
    } catch {
      // ignore
    }
  };

  /**
   * The Sync button synchronizes lyrics directly to the point where the song begins,
   * or snaps the active vocal line to current playback time if a mid-song pause/interlude caused drift.
   */
  const handleAutoSync = () => {
    const curLyrics = lyricsRef.current;
    const curState = playerStateRef.current;

    if (!curLyrics || !curLyrics.lines || curLyrics.lines.length === 0) {
      setIntroNotice('No lyrics loaded to sync');
      setTimeout(() => setIntroNotice(null), 3000);
      return;
    }

    const firstTimestamp = curLyrics.lines[0].timestamp; // e.g. 0.95s or 4.8s
    const t = curState.currentTime;

    let newOffset = 0;
    // If the video is in the intro before the vocals start, or within 4s of the opening line:
    if (t <= firstTimestamp + 4 || activeIndex <= 0) {
      newOffset = Number(Math.max(0, t - firstTimestamp).toFixed(1));
    } else {
      // Song is actively playing mid-track. The user pressed Sync right as a line is being sung.
      // Find the closest lyric line to current effective playback:
      const currentEffective = Math.max(0, t - manualOffsetRef.current);
      let closestLine = curLyrics.lines[0];
      let minDiff = Infinity;
      for (const line of curLyrics.lines) {
        const d = Math.abs(line.timestamp - currentEffective);
        if (d < minDiff) {
          minDiff = d;
          closestLine = line;
        }
      }
      newOffset = Number(Math.max(0, t - closestLine.timestamp).toFixed(1));
    }

    handleOffsetChange(newOffset);
    setIntroNotice(`Lyrics synchronized (+${newOffset}s)`);
    setTimeout(() => setIntroNotice(null), 3500);
  };

  const handleResetSync = () => {
    handleOffsetChange(0);
    setIntroNotice('Sync offset reset to 0:00');
    setTimeout(() => setIntroNotice(null), 3000);
  };

  // Fetch lyrics from LRCLIB (https://lrclib.net) on mount or source change
  useEffect(() => {
    let isCancelled = false;

    const fetchLyrics = async () => {
      // Avoid searching with placeholder title
      if (!source.title || source.title.startsWith('YouTube Video (')) {
        setIsLoadingLyrics(true);
        return;
      }

      setIsLoadingLyrics(true);
      const track = await LyricsProvider.getLyrics({
        trackName: source.title,
        artistName: source.artist,
        duration: source.duration,
        videoId: source.kind === 'youtube' ? source.sourceId : undefined,
      });

      if (!isCancelled) {
        if (track) {
          setLyrics(track);
          // Check for automatic music video intro delay (only for non-curated tracks)
          if (track.source !== 'curated' && track.duration && playerStateRef.current.duration > 0 && manualOffsetRef.current === 0) {
            const saved = localStorage.getItem(`lyrixer_offset_${source.sourceId}`);
            if (!saved) {
              const diff = Number((playerStateRef.current.duration - track.duration).toFixed(1));
              if (diff >= 1.5 && diff <= 90) {
                handleOffsetChange(diff);
                setIntroNotice(`Music video intro detected (+${diff}s) · Synchronized`);
                setTimeout(() => setIntroNotice(null), 4500);
              }
            }
          }
        }
        setIsLoadingLyrics(false);
      }
    };

    fetchLyrics();

    return () => {
      isCancelled = true;
    };
  }, [source.title, source.artist, source.sourceId, source.kind, source.duration]);

  // Listener callbacks from adapter
  const listener: VideoPlayerListener = {
    onTimeUpdate: (currentTime) => {
      setPlayerState((prev) => ({ ...prev, currentTime }));
    },
    onStateChange: (updated) => {
      setPlayerState((prev) => ({ ...prev, ...updated }));
    },
    onDurationChange: (duration) => {
      setPlayerState((prev) => ({ ...prev, duration }));
      // Check for automatic music video intro delay (only for non-curated tracks)
      const curLyrics = lyricsRef.current;
      if (duration > 0 && curLyrics && curLyrics.source !== 'curated' && curLyrics.duration && manualOffsetRef.current === 0) {
        const saved = localStorage.getItem(`lyrixer_offset_${source.sourceId}`);
        if (!saved) {
          const diff = Number((duration - curLyrics.duration).toFixed(1));
          if (diff >= 1.5 && diff <= 90) {
            handleOffsetChange(diff);
            setIntroNotice(`Music video intro detected (+${diff}s) · Synchronized`);
            setTimeout(() => setIntroNotice(null), 4500);
          }
        }
      }
    },
    onMetadata: (meta) => {
      if (!meta.title) return;
      const { artist, title } = cleanTrackTitle(meta.title, meta.author);
      const curTrack = trackInfoRef.current;
      const curLyrics = lyricsRef.current;
      if (title && (title !== curTrack.title || artist !== curTrack.artist || !curLyrics)) {
        setTrackInfo({ title, artist: artist || '' });
        setIsLoadingLyrics(true);
        LyricsProvider.getLyrics({
          trackName: title,
          artistName: artist,
          duration: playerStateRef.current.duration || source.duration,
          videoId: meta.videoId || source.sourceId,
        }).then((track) => {
          if (track) {
            setLyrics(track);
            // Check for music video intro delay (only for non-curated tracks)
            if (track.source !== 'curated' && track.duration && playerStateRef.current.duration > 0 && manualOffsetRef.current === 0) {
              const diff = Number((playerStateRef.current.duration - track.duration).toFixed(1));
              const saved = localStorage.getItem(`lyrixer_offset_${source.sourceId}`);
              if (!saved && diff >= 1.5 && diff <= 90) {
                handleOffsetChange(diff);
                setIntroNotice(`Music video intro detected (+${diff}s) · Synchronized`);
                setTimeout(() => setIntroNotice(null), 4500);
              }
            }
          }
          setIsLoadingLyrics(false);
        });
      }
    },
  };

  // Fullscreen handling
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Controls auto-hide on inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (!playerState.paused) {
        setControlsVisible(false);
      }
    }, 3500);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a modal or input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (playerState.paused) adapter?.play();
        else adapter?.pause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        adapter?.seekTo(Math.max(0, playerState.currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        adapter?.seekTo(Math.min(playerState.duration, playerState.currentTime + 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        adapter?.setVolume(Math.min(100, playerState.volume + 5));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        adapter?.setVolume(Math.max(0, playerState.volume - 5));
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setLyricsVisible((prev) => !prev);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullScreen();
      } else if (e.code === 'Escape' && !isSearchModalOpen) {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adapter, playerState, isSearchModalOpen, onExit]);

  // Manual LRC file upload
  const handleLrcFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const parsed = await LyricsProvider.parseUserFile(file);
      setLyrics(parsed);
    }
  };

  const handleSelectFromLrclib = (customTrack: LyricTrack) => {
    setLyrics(customTrack);
  };

  return (
    <div
      ref={containerRef}
      className={`player-shell-root ${controlsVisible ? 'controls-active' : 'controls-hidden'}`}
      onMouseMove={handleMouseMove}
    >
      {/* Hidden LRC file picker */}
      <input
        type="file"
        ref={lrcFileInputRef}
        onChange={handleLrcFileUpload}
        accept=".lrc,text/plain"
        style={{ display: 'none' }}
        aria-label="Upload custom LRC file"
      />

      {/* Floating Top Header Overlay */}
      <header className={`player-top-header ${controlsVisible ? 'visible' : 'hidden'}`}>
        <div className="header-brand">
          <div className="header-wordmark">
            <Sparkles size={16} className="header-sparkle" />
            <span>LyriXer</span>
          </div>

          <div className="header-track-info">
            <span className="header-track-title" title={trackInfo.title}>
              {trackInfo.title}
            </span>
            {trackInfo.artist && (
              <span className="header-track-artist"> &middot; {trackInfo.artist}</span>
            )}
            {lyrics?.synced && (
              <span className="header-lrclib-badge" title="Synchronized lyrics active from lrclib.net">
                <CheckCircle2 size={12} /> lrclib.net
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {onOpenArtist && (
            <button
              type="button"
              className="header-btn header-artist-btn"
              onClick={() => onOpenArtist(trackInfo.artist || source.artist)}
              title={trackInfo.artist ? `Open ${trackInfo.artist} profile & songs` : 'Open Artist Profile'}
            >
              <UserRound size={14} />
              <span>Artist</span>
            </button>
          )}

          <button
            type="button"
            className="header-btn"
            onClick={() => setIsSearchModalOpen(true)}
            title="Search for lyrics on https://lrclib.net"
          >
            <Search size={14} />
            <span>Search LRCLIB</span>
          </button>

          <button
            type="button"
            className="header-btn"
            onClick={() => lrcFileInputRef.current?.click()}
            title="Load a custom .lrc file from your device"
          >
            <Upload size={14} />
            <span>Load .lrc</span>
          </button>

          <button
            type="button"
            className="header-btn header-btn-exit"
            onClick={onExit}
            title="Exit player and return to home"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Floating Intro Alignment Notification Toast */}
      {introNotice && (
        <div className="player-intro-notice" role="status">
          <Clock size={13} className="text-accent" />
          <span>{introNotice}</span>
        </div>
      )}

      {/* Primary Video Background with Overlayed Lyrics */}
      {source.kind === 'youtube' ? (
        <YouTubePlayerView
          videoId={source.sourceId}
          lyrics={lyrics}
          activeIndex={activeIndex}
          isLoadingLyrics={isLoadingLyrics}
          typographyPreset={preferences.typographyPreset}
          fontSizeScale={preferences.fontSize}
          blurLevel={preferences.blurLevel}
          overlayOpacity={preferences.overlayOpacity}
          lyricsVisible={lyricsVisible}
          onAdapterReady={setAdapter}
          listener={listener}
          onSeekTo={(sec) => adapter?.seekTo(sec)}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
          onSearchLrclibClick={() => setIsSearchModalOpen(true)}
          onAutoSync={handleAutoSync}
        />
      ) : (
        <LocalPlayerView
          localFile={source.localFile || source.sourceId}
          lyrics={lyrics}
          activeIndex={activeIndex}
          isLoadingLyrics={isLoadingLyrics}
          typographyPreset={preferences.typographyPreset}
          fontSizeScale={preferences.fontSize}
          blurLevel={preferences.blurLevel}
          overlayOpacity={preferences.overlayOpacity}
          lyricsVisible={lyricsVisible}
          onAdapterReady={setAdapter}
          listener={listener}
          onSeekTo={(sec) => adapter?.seekTo(sec)}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
          onSearchLrclibClick={() => setIsSearchModalOpen(true)}
          onAutoSync={handleAutoSync}
        />
      )}

      {/* Floating Bottom Player Controls */}
      <div className={`controls-wrapper ${controlsVisible ? 'visible' : 'hidden'}`}>
        <PlayerControls
          playerState={playerState}
          title={trackInfo.title}
          sourceKind={source.kind}
          manualOffset={manualOffset}
          preferences={preferences}
          isFullScreen={isFullScreen}
          lyricsVisible={lyricsVisible}
          detectedIntroGap={detectedIntroGap}
          onPlay={() => adapter?.play()}
          onPause={() => adapter?.pause()}
          onSeek={(sec) => adapter?.seekTo(sec)}
          onVolumeChange={(vol) => adapter?.setVolume(vol)}
          onToggleMute={() => adapter?.setMuted(!playerState.muted)}
          onAutoSync={handleAutoSync}
          onOffsetChange={handleOffsetChange}
          onResetSync={handleResetSync}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
          onSearchLrclibClick={() => setIsSearchModalOpen(true)}
          onOpenArtist={onOpenArtist ? () => onOpenArtist(trackInfo.artist || source.artist) : undefined}
          onToggleLyricsVisible={() => setLyricsVisible(!lyricsVisible)}
          onToggleFullScreen={handleToggleFullScreen}
          onExitPlayer={onExit}
          onUpdatePreferences={onUpdatePreferences}
        />
      </div>

      {/* LRCLIB Search Modal */}
      <LrclibSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={trackInfo.artist ? `${trackInfo.artist} ${trackInfo.title}` : trackInfo.title}
        onSelectLyrics={handleSelectFromLrclib}
      />
    </div>
  );
};

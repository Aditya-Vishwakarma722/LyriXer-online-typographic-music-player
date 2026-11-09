import React, { useState, useEffect, useRef } from 'react';
import { YouTubePlayerView } from './YouTubePlayerView';
import { LocalPlayerView } from './LocalPlayerView';
import { PlayerControls } from './PlayerControls';
import { LrclibSearchModal } from './LrclibSearchModal';
import { LyricsProvider } from '../../services/lyrics/LyricsProvider';
import { useLyricsSync } from '../../hooks/useLyricsSync';
import type { VideoPlayerAdapter, VideoPlayerState, VideoPlayerListener } from '../../services/video/types';
import type { VideoSource, UserPreferences } from '../../types/session';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import { Sparkles, Search, Upload, X, CheckCircle2 } from 'lucide-react';
import './PlayerShell.css';

interface PlayerShellProps {
  source: VideoSource;
  preferences: UserPreferences;
  onExit: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

export const PlayerShell: React.FC<PlayerShellProps> = ({
  source,
  preferences,
  onExit,
  onUpdatePreferences,
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
  const [manualOffset, setManualOffset] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lyricsVisible, setLyricsVisible] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lrcFileInputRef = useRef<HTMLInputElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Sync hook
  const { activeIndex } = useLyricsSync(lyrics, playerState.currentTime, manualOffset);

  // Fetch lyrics from LRCLIB (https://lrclib.net) on mount or source change
  useEffect(() => {
    let isCancelled = false;

    const fetchLyrics = async () => {
      setIsLoadingLyrics(true);
      const track = await LyricsProvider.getLyrics({
        trackName: source.title,
        artistName: source.artist,
        duration: source.duration,
        videoId: source.kind === 'youtube' ? source.sourceId : undefined,
      });

      if (!isCancelled) {
        setLyrics(track);
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
            <span className="header-track-title" title={source.title}>
              {source.title}
            </span>
            {lyrics?.synced && (
              <span className="header-lrclib-badge" title="Synchronized lyrics active from lrclib.net">
                <CheckCircle2 size={12} /> lrclib.net
              </span>
            )}
          </div>
        </div>

        <div className="header-actions">
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
        />
      )}

      {/* Floating Bottom Player Controls */}
      <div className={`controls-wrapper ${controlsVisible ? 'visible' : 'hidden'}`}>
        <PlayerControls
          playerState={playerState}
          title={source.title}
          sourceKind={source.kind}
          manualOffset={manualOffset}
          preferences={preferences}
          isFullScreen={isFullScreen}
          lyricsVisible={lyricsVisible}
          onPlay={() => adapter?.play()}
          onPause={() => adapter?.pause()}
          onSeek={(sec) => adapter?.seekTo(sec)}
          onVolumeChange={(vol) => adapter?.setVolume(vol)}
          onToggleMute={() => adapter?.setMuted(!playerState.muted)}
          onOffsetChange={setManualOffset}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
          onSearchLrclibClick={() => setIsSearchModalOpen(true)}
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
        initialQuery={source.artist ? `${source.artist} ${source.title}` : source.title}
        onSelectLyrics={handleSelectFromLrclib}
      />
    </div>
  );
};

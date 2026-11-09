import React, { useState, useEffect, useRef } from 'react';
import { YouTubePlayerView } from './YouTubePlayerView';
import { LocalPlayerView } from './LocalPlayerView';
import { PlayerControls } from './PlayerControls';
import { LyricsProvider } from '../../services/lyrics/LyricsProvider';
import { useLyricsSync } from '../../hooks/useLyricsSync';
import type { VideoPlayerAdapter, VideoPlayerState, VideoPlayerListener } from '../../services/video/types';
import type { VideoSource, UserPreferences } from '../../types/session';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
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

  const containerRef = useRef<HTMLDivElement>(null);
  const lrcFileInputRef = useRef<HTMLInputElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Sync hook
  const { activeIndex } = useLyricsSync(lyrics, playerState.currentTime, manualOffset);

  // Fetch lyrics on mount
  useEffect(() => {
    let isCancelled = false;

    const fetchLyrics = async () => {
      setIsLoadingLyrics(true);
      const track = await LyricsProvider.getLyrics({
        trackName: source.title,
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
  }, [source.title, source.sourceId, source.kind, source.duration]);

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

  // Manual LRC file upload
  const handleLrcFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const parsed = await LyricsProvider.parseUserFile(file);
      setLyrics(parsed);
    }
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

      {/* Primary Video / Lyrics Layout */}
      {source.kind === 'youtube' ? (
        <YouTubePlayerView
          videoId={source.sourceId}
          lyrics={lyrics}
          activeIndex={activeIndex}
          isLoadingLyrics={isLoadingLyrics}
          typographyPreset={preferences.typographyPreset}
          fontSizeScale={preferences.fontSize}
          onAdapterReady={setAdapter}
          listener={listener}
          onSeekTo={(sec) => adapter?.seekTo(sec)}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
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
          onAdapterReady={setAdapter}
          listener={listener}
          onSeekTo={(sec) => adapter?.seekTo(sec)}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
        />
      )}

      {/* Floating / Docked Player Controls */}
      <div className={`controls-wrapper ${controlsVisible ? 'visible' : 'hidden'}`}>
        <PlayerControls
          playerState={playerState}
          title={source.title}
          sourceKind={source.kind}
          manualOffset={manualOffset}
          preferences={preferences}
          isFullScreen={isFullScreen}
          onPlay={() => adapter?.play()}
          onPause={() => adapter?.pause()}
          onSeek={(sec) => adapter?.seekTo(sec)}
          onVolumeChange={(vol) => adapter?.setVolume(vol)}
          onToggleMute={() => adapter?.setMuted(!playerState.muted)}
          onOffsetChange={setManualOffset}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
          onToggleFullScreen={handleToggleFullScreen}
          onExitPlayer={onExit}
          onUpdatePreferences={onUpdatePreferences}
        />
      </div>
    </div>
  );
};

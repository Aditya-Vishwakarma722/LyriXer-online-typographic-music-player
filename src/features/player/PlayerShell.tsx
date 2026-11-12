import React, { useState, useEffect, useRef, useCallback } from 'react';
import { YouTubePlayerView } from './YouTubePlayerView';
import { LocalPlayerView } from './LocalPlayerView';
import { PlayerControls } from './PlayerControls';
import { LrclibSearchModal } from './LrclibSearchModal';
import { PlayerIntroModal } from './PlayerIntroModal';
import { LyricsProvider } from '../../services/lyrics/LyricsProvider';
import { useLyricsSync } from '../../hooks/useLyricsSync';
import { cleanTrackTitle } from '../../utils/youtube';
import type { VideoPlayerAdapter, VideoPlayerState, VideoPlayerListener } from '../../services/video/types';
import type { VideoSource, UserPreferences } from '../../types/session';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import { Sparkles, Search, Upload, X, CheckCircle2, UserRound, Clock, HelpCircle } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';
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

  // Lyrics Sync timing offset: cleanly resets to 0.0s for every new video
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [introNotice, setIntroNotice] = useState<string | null>(null);

  // Pre-playback Introduction Guide Modal:
  // Shows before video begins playing unless user checked "Don't show this intro automatically again"
  const [showIntroModal, setShowIntroModal] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lyrixer_hide_player_intro') !== 'true';
    } catch {
      return true;
    }
  });

  const isUserOffsetCustomizedRef = useRef(false);
  const noticeTimerRef = useRef<number | null>(null);
  const showIntroModalRef = useRef(showIntroModal);
  const adapterRef = useRef<VideoPlayerAdapter | null>(null);

  useEffect(() => {
    showIntroModalRef.current = showIntroModal;
  }, [showIntroModal]);

  // Cleanly reset manualOffset to 0.0s for every new video loaded
  useEffect(() => {
    setManualOffset(0);
    manualOffsetRef.current = 0;
    isUserOffsetCustomizedRef.current = false;
  }, [source.sourceId]);

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

  const effectiveArtist =
    trackInfo.artist ||
    source.artist ||
    cleanTrackTitle(source.title).artist ||
    cleanTrackTitle(trackInfo.title).artist ||
    '';
  const effectiveArtistRef = useRef(effectiveArtist);

  useEffect(() => {
    lyricsRef.current = lyrics;
    manualOffsetRef.current = manualOffset;
    playerStateRef.current = playerState;
    trackInfoRef.current = trackInfo;
    effectiveArtistRef.current = effectiveArtist;
  });

  // Sync hook (manualOffset shifts effective lyric time to compensate for music video intros)
  const { activeIndex } = useLyricsSync(lyrics, playerState.currentTime, manualOffset);

  /**
   * Applies manual timing offset adjustments (Fine Adjust Delay/Rush, Brackets [ ], etc.)
   * Supports both absolute number or updater function to prevent dropped clicks during rapid tapping.
   * Displays immediate on-screen visual confirmation toast.
   */
  const handleOffsetChange = useCallback(
    (
      newOffsetOrUpdater: number | ((prev: number) => number),
      isManualUserAction = true
    ) => {
      if (isManualUserAction) {
        isUserOffsetCustomizedRef.current = true;
      }

      setManualOffset((prev) => {
        const rawTarget =
          typeof newOffsetOrUpdater === 'function'
            ? newOffsetOrUpdater(prev)
            : newOffsetOrUpdater;

        const cleanOffset = Number(rawTarget.toFixed(1));
        manualOffsetRef.current = cleanOffset;

        try {
          localStorage.setItem(`lyrixer_offset_${source.sourceId}`, cleanOffset.toString());
        } catch {
          // ignore
        }

        if (isManualUserAction) {
          const label =
            cleanOffset > 0.05
              ? `+${cleanOffset.toFixed(1)}s (Delayed · Lyrics later)`
              : cleanOffset < -0.05
              ? `${cleanOffset.toFixed(1)}s (Rushed · Lyrics earlier)`
              : '0.0s (Direct Timeline · In Sync)';
          setIntroNotice(`Sync Adjusted: ${label}`);
          if (noticeTimerRef.current) {
            window.clearTimeout(noticeTimerRef.current);
          }
          noticeTimerRef.current = window.setTimeout(() => {
            setIntroNotice(null);
          }, 2500);
        }

        return cleanOffset;
      });
    },
    [source.sourceId]
  );

  /**
   * Nudges the lyrics timing offset by a relative delta (in seconds).
   * Positive delta = DELAY (lyrics appear later in video).
   * Negative delta = RUSH (lyrics appear earlier in video).
   */
  const handleNudgeOffset = useCallback(
    (delta: number) => {
      handleOffsetChange((prev) => prev + delta, true);
    },
    [handleOffsetChange]
  );

  /**
   * The Sync button synchronizes lyrics directly to the video:
   * Catches the opening vocal line (if early in track or forced) or snaps the nearest lyric line to now.
   */
  const handleAutoSync = (forceVocalStart?: boolean) => {
    const curLyrics = lyricsRef.current;
    const curState = playerStateRef.current;

    if (!curLyrics || !curLyrics.lines || curLyrics.lines.length === 0) {
      setIntroNotice('No lyrics available to synchronize');
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => setIntroNotice(null), 2500);
      return;
    }

    const currentTime = curState.currentTime;

    if (forceVocalStart) {
      const line0 = curLyrics.lines[0];
      const offset = Number((currentTime - line0.timestamp).toFixed(1));
      handleOffsetChange(offset, false);
      isUserOffsetCustomizedRef.current = true;
      const sign = offset >= 0 ? `+${offset}s` : `${offset}s`;
      setIntroNotice(
        `Synchronized to vocal start (${sign}) · Opening line set to ${formatDuration(currentTime)}`
      );
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => setIntroNotice(null), 3500);
      return;
    }

    const activeLine = curLyrics.lines[activeIndex >= 0 ? activeIndex : 0];
    if (activeLine) {
      const offset = Number((currentTime - activeLine.timestamp).toFixed(1));
      handleOffsetChange(offset, false);
      isUserOffsetCustomizedRef.current = true;
      const sign = offset >= 0 ? `+${offset}s` : `${offset}s`;
      setIntroNotice(`Snapped line to playback position (${sign})`);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => setIntroNotice(null), 3000);
    }
  };

  const handleResetSync = () => {
    isUserOffsetCustomizedRef.current = true;
    handleOffsetChange(0, false);
    setIntroNotice('Lyrics offset reset to 0.0s (Direct Timeline)');
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setIntroNotice(null), 2500);
  };

  /**
   * Matches video duration with LRCLIB song duration to automatically detect intro delays
   * (e.g. Misfit by Juice WRLD: video 4:16 vs song 2:39 -> intro delay +1:37).
   */
  const autoAlignTimeline = useCallback(
    (vDuration: number, curLyrics: LyricTrack | null) => {
      if (!vDuration || vDuration <= 0 || !curLyrics) return;

      // Do not overwrite if user has already customized the offset manually
      if (isUserOffsetCustomizedRef.current) return;

      // Curated tracks already have video-accurate timestamps
      if (curLyrics.source === 'curated') return;

      const songDur =
        curLyrics.duration ||
        (curLyrics.lines.length > 0
          ? curLyrics.lines[curLyrics.lines.length - 1].timestamp + 5
          : 0);

      if (songDur > 0 && vDuration > songDur + 5) {
        const diff = Number((vDuration - songDur).toFixed(1));
        if (diff >= 3.0 && diff <= vDuration - 10) {
          handleOffsetChange(diff, false);
          setIntroNotice(
            `Intro detected (+${formatDuration(diff)}) · Lyrics set to begin when song starts`
          );
          if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = window.setTimeout(() => setIntroNotice(null), 4500);
        }
      }
    },
    []
  );

  /**
   * Fetches synchronized lyrics directly from LRCLIB (https://lrclib.net)
   */
  const fetchLyrics = useCallback(
    async (title: string, artist?: string, duration?: number) => {
      setIsLoadingLyrics(true);
      try {
        const foundLyrics = await LyricsProvider.getLyrics({
          trackName: title,
          artistName: artist,
          duration: duration || playerStateRef.current.duration || source.duration,
          videoId: source.sourceId,
        });

        if (foundLyrics) {
          setLyrics(foundLyrics);
          const vDur = playerStateRef.current.duration || source.duration || 0;
          autoAlignTimeline(vDur, foundLyrics);
        } else {
          setLyrics(null);
        }
      } catch (err) {
        console.warn('[PlayerShell] LRCLIB lyrics fetch error:', err);
        setLyrics(null);
      } finally {
        setIsLoadingLyrics(false);
      }
    },
    [source.sourceId, source.duration, autoAlignTimeline]
  );

  useEffect(() => {
    fetchLyrics(trackInfo.title, effectiveArtist);
  }, [trackInfo.title, effectiveArtist, fetchLyrics]);

  const handleAdapterReady = (newAdapter: VideoPlayerAdapter) => {
    adapterRef.current = newAdapter;
    setAdapter(newAdapter);
    if (showIntroModalRef.current) {
      newAdapter.pause();
    }
  };

  const handleStartWatching = () => {
    setShowIntroModal(false);
    adapterRef.current?.play();
  };

  // Listener callbacks from adapter
  const listener: VideoPlayerListener = {
    onTimeUpdate: (currentTime) => {
      setPlayerState((prev) => ({ ...prev, currentTime }));
    },
    onStateChange: (updated) => {
      setPlayerState((prev) => ({ ...prev, ...updated }));
      if (showIntroModalRef.current && updated.status === 'playing') {
        adapterRef.current?.pause();
      }
    },
    onDurationChange: (duration) => {
      setPlayerState((prev) => ({ ...prev, duration }));
      autoAlignTimeline(duration, lyricsRef.current);
    },
    onMetadata: (meta) => {
      if (!meta.title) return;
      const { artist, title } = cleanTrackTitle(meta.title, meta.author);
      const curTrack = trackInfoRef.current;
      if (title && (title !== curTrack.title || artist !== curTrack.artist)) {
        setTrackInfo({ title, artist: artist || '' });
        fetchLyrics(title, artist);
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
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleAutoSync(true);
      } else if (e.code === 'BracketLeft') {
        e.preventDefault();
        handleNudgeOffset(0.1); // Left bracket '[' = DELAY (+0.1s later)
      } else if (e.code === 'BracketRight') {
        e.preventDefault();
        handleNudgeOffset(-0.1); // Right bracket ']' = RUSH (-0.1s earlier)
      } else if (e.code === 'Escape') {
        if (showIntroModalRef.current) {
          setShowIntroModal(false);
        } else if (!isSearchModalOpen) {
          onExit();
        }
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

  const handleSelectFromLrclib = (customTrack: LyricTrack, suggestedOffset = 0) => {
    setLyrics(customTrack);
    handleOffsetChange(suggestedOffset);
    if (suggestedOffset > 0) {
      setIntroNotice(
        `Lyrics synchronized (+${formatDuration(suggestedOffset)}) · Opening line timed to vocal start`
      );
    } else {
      setIntroNotice('Lyrics synchronized · Direct timeline start');
    }
    setTimeout(() => setIntroNotice(null), 4000);
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
              onClick={() => onOpenArtist(effectiveArtist)}
              title={effectiveArtist ? `Explore ${effectiveArtist} profile & songs` : 'Open Artist Profile'}
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
            onClick={() => setShowIntroModal(true)}
            title="View lyrics synchronization & controls guide"
          >
            <HelpCircle size={14} />
            <span>Guide</span>
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
          onAdapterReady={handleAdapterReady}
          listener={listener}
          onSeekTo={(sec) => adapter?.seekTo(sec)}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
          onSearchLrclibClick={() => setIsSearchModalOpen(true)}
          onAutoSync={handleAutoSync}
          currentTime={playerState.currentTime}
          duration={playerState.duration || source.duration || 0}
          isEnded={
            playerState.status === 'ended' ||
            (playerState.duration > 5 && playerState.currentTime >= playerState.duration - 0.6)
          }
          trackTitle={trackInfo.title}
          trackArtist={effectiveArtist}
          onOpenArtist={onOpenArtist ? () => onOpenArtist(effectiveArtist) : undefined}
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
          onAdapterReady={handleAdapterReady}
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
          artistName={effectiveArtist}
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
          onAutoSync={() => handleAutoSync(false)}
          onAlignVocalsToNow={() => handleAutoSync(true)}
          onNudgeOffset={handleNudgeOffset}
          onOffsetChange={handleOffsetChange}
          onResetSync={handleResetSync}
          onUploadLrcClick={() => lrcFileInputRef.current?.click()}
          onSearchLrclibClick={() => setIsSearchModalOpen(true)}
          onOpenArtist={onOpenArtist ? () => onOpenArtist(effectiveArtist) : undefined}
          onToggleLyricsVisible={() => setLyricsVisible(!lyricsVisible)}
          onToggleFullScreen={handleToggleFullScreen}
          onExitPlayer={onExit}
          onUpdatePreferences={onUpdatePreferences}
        />
      </div>

      {/* Pre-Playback Introduction Guide Modal */}
      <PlayerIntroModal
        isOpen={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        onStart={handleStartWatching}
        trackTitle={trackInfo.title}
        trackArtist={effectiveArtist}
      />

      {/* LRCLIB Search Modal */}
      <LrclibSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={trackInfo.artist ? `${trackInfo.artist} ${trackInfo.title}` : trackInfo.title}
        onSelectLyrics={handleSelectFromLrclib}
        videoDuration={playerState.duration || source.duration || 0}
        videoTitle={trackInfo.title}
        videoArtist={effectiveArtist}
      />
    </div>
  );
};

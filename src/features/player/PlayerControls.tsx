import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Upload,
  Type,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  UserRound,
  Timer,
  RotateCcw,
  X,
  Search,
} from 'lucide-react';
import type { VideoPlayerState } from '../../services/video/types';
import type { TypographyPreset, UserPreferences } from '../../types/session';
import { formatDuration } from '../../utils/formatters';
import './PlayerControls.css';

interface PlayerControlsProps {
  playerState: VideoPlayerState;
  title: string;
  artistName?: string;
  sourceKind: 'youtube' | 'local';
  manualOffset: number;
  preferences: UserPreferences;
  isFullScreen: boolean;
  lyricsVisible: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onAutoSync?: () => void;
  onAlignVocalsToNow?: () => void;
  onOffsetChange?: (offset: number) => void;
  onResetSync?: () => void;
  onUploadLrcClick: () => void;
  onSearchLrclibClick?: () => void;
  onOpenArtist?: () => void;
  onToggleLyricsVisible: () => void;
  onToggleFullScreen: () => void;
  onExitPlayer: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerState,
  title,
  artistName,
  sourceKind,
  manualOffset,
  preferences,
  isFullScreen,
  lyricsVisible,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onAutoSync,
  onAlignVocalsToNow,
  onOffsetChange,
  onResetSync,
  onUploadLrcClick,
  onSearchLrclibClick,
  onOpenArtist,
  onToggleLyricsVisible,
  onToggleFullScreen,
  onExitPlayer,
  onUpdatePreferences,
}) => {
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);
  const [showEffectsMenu, setShowEffectsMenu] = useState(false);
  const [isSyncManagerOpen, setIsSyncManagerOpen] = useState(false);
  const syncMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (syncMenuRef.current && !syncMenuRef.current.contains(e.target as Node)) {
        setIsSyncManagerOpen(false);
      }
    };
    if (isSyncManagerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSyncManagerOpen]);

  const { currentTime, duration, paused, volume, muted } = playerState;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <footer className="player-controls-root" aria-label="Player Controls Bar">
      {/* Top Scrub Timeline Bar */}
      <div
        className="timeline-scrubber"
        onClick={handleScrub}
        role="slider"
        aria-label="Seek timeline"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek(currentTime + 5);
          else if (e.key === 'ArrowLeft') onSeek(currentTime - 5);
        }}
      >
        <div className="timeline-track">
          <div
            className="timeline-progress"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="timeline-thumb"
            style={{ left: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="controls-row">
        {/* Left Section: Back button & Title */}
        <div className="controls-left">
          <button
            type="button"
            className="ctrl-btn ctrl-btn-back"
            onClick={onExitPlayer}
            title="Return to homepage"
            aria-label="Exit player to home"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="track-info">
            <h4 className="track-title" title={title}>
              {title}
            </h4>
            <div className="track-meta">
              <span className="source-pill">{sourceKind.toUpperCase()}</span>
              {manualOffset !== 0 && (
                <button
                  type="button"
                  className="offset-pill offset-pill-interactive"
                  onClick={onResetSync}
                  title="Lyrics intro offset applied. Click to reset to 0.0s."
                >
                  Offset: {manualOffset > 0 ? `+${manualOffset.toFixed(1)}s` : `${manualOffset.toFixed(1)}s`} ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Play/Pause and Seek Time */}
        <div className="controls-center">
          <button
            type="button"
            className="ctrl-btn-play"
            onClick={paused ? onPlay : onPause}
            aria-label={paused ? 'Play' : 'Pause'}
          >
            {paused ? (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            ) : (
              <Pause size={20} fill="currentColor" />
            )}
          </button>

          <div className="time-display">
            <span>{formatDuration(currentTime)}</span>
            <span className="time-sep">/</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right Section: Volume, Sync Manager, Artist, Search, Upload, Typography, Blur, Fullscreen */}
        <div className="controls-right">
          {/* Volume Control */}
          <div className="volume-group">
            <button
              type="button"
              className="ctrl-btn"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="volume-slider"
              aria-label="Volume slider"
            />
          </div>

          {/* Lyrics Synchronization Mode Popover */}
          {onAutoSync && (
            <div className="dropdown-wrapper" ref={syncMenuRef}>
              <button
                type="button"
                className={`ctrl-btn sync-ctrl-btn ${isSyncManagerOpen || manualOffset !== 0 ? 'active' : ''}`}
                onClick={() => {
                  setIsSyncManagerOpen(!isSyncManagerOpen);
                  setShowTypographyMenu(false);
                  setShowEffectsMenu(false);
                }}
                title={
                  manualOffset !== 0
                    ? `Lyrics Synced (${manualOffset > 0 ? `+${manualOffset.toFixed(1)}s` : `${manualOffset.toFixed(1)}s`}) — Open Sync Mode`
                    : 'Lyrics Synchronization'
                }
                aria-label="Manage lyrics synchronization"
              >
                <Timer size={17} />
                {manualOffset !== 0 && <span className="sync-active-dot" />}
              </button>

              {isSyncManagerOpen && (
                <div className="player-popover sync-popover">
                  <div className="sync-popover-header">
                    <span className="popover-title">Lyrics Synchronization</span>
                    <button
                      type="button"
                      className="popover-close-btn"
                      onClick={() => setIsSyncManagerOpen(false)}
                      aria-label="Close sync mode"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Current Status Indicator */}
                  <div className="sync-status-indicator">
                    <span className="sync-status-label">Current Offset:</span>
                    <span className={`sync-status-value ${manualOffset !== 0 ? 'offset-applied' : ''}`}>
                      {manualOffset === 0
                        ? '0.0s (Direct / In Sync)'
                        : manualOffset > 0
                        ? `+${manualOffset.toFixed(1)}s (Delayed · Lyrics later)`
                        : `${manualOffset.toFixed(1)}s (Rushed · Lyrics earlier)`}
                    </span>
                  </div>

                  {/* 1-Click Vocal Start Alignment (Hero Action) */}
                  <div className="sync-section">
                    <button
                      type="button"
                      className="sync-catch-hero-btn primary"
                      onClick={() => {
                        if (onAlignVocalsToNow) onAlignVocalsToNow();
                        else if (onAutoSync) onAutoSync();
                      }}
                      title="Align opening line to current video playback position (Press 'S')"
                    >
                      <Sparkles size={16} />
                      <div className="sync-btn-text">
                        <strong>Sync to Vocal Start</strong>
                        <span>Sets opening line to {formatDuration(currentTime)} (Press 'S')</span>
                      </div>
                    </button>
                  </div>

                  {/* Fine Adjust Steppers (Nudge Delay / Forward) */}
                  {onOffsetChange && (
                    <div className="sync-section">
                      <div className="sync-section-title">
                        <span>Fine Adjust (Delay / Rush)</span>
                        <span className={`current-offset-tag ${manualOffset !== 0 ? 'active' : ''}`}>
                          {manualOffset > 0
                            ? `+${manualOffset.toFixed(1)}s Delay`
                            : manualOffset < 0
                            ? `${manualOffset.toFixed(1)}s Rush`
                            : '0.0s In Sync'}
                        </span>
                      </div>
                      <div className="sync-direction-row">
                        <span className="sync-dir-label rush">◀ Rush (Earlier)</span>
                        <span className="sync-dir-label delay">Delay (Later) ▶</span>
                      </div>
                      <div className="sync-stepper-row">
                        <button
                          type="button"
                          className="stepper-btn rush-btn"
                          onClick={() => onOffsetChange(Number((manualOffset - 1.0).toFixed(1)))}
                          title="Rush lyrics 1.0s earlier"
                        >
                          -1s
                        </button>
                        <button
                          type="button"
                          className="stepper-btn rush-btn"
                          onClick={() => onOffsetChange(Number((manualOffset - 0.5).toFixed(1)))}
                          title="Rush lyrics 0.5s earlier"
                        >
                          -0.5s
                        </button>
                        <button
                          type="button"
                          className="stepper-btn rush-btn"
                          onClick={() => onOffsetChange(Number((manualOffset - 0.1).toFixed(1)))}
                          title="Rush lyrics 0.1s earlier"
                        >
                          -0.1s
                        </button>
                        <button
                          type="button"
                          className="stepper-btn delay-btn"
                          onClick={() => onOffsetChange(Number((manualOffset + 0.1).toFixed(1)))}
                          title="Delay lyrics 0.1s later"
                        >
                          +0.1s
                        </button>
                        <button
                          type="button"
                          className="stepper-btn delay-btn"
                          onClick={() => onOffsetChange(Number((manualOffset + 0.5).toFixed(1)))}
                          title="Delay lyrics 0.5s later"
                        >
                          +0.5s
                        </button>
                        <button
                          type="button"
                          className="stepper-btn delay-btn"
                          onClick={() => onOffsetChange(Number((manualOffset + 1.0).toFixed(1)))}
                          title="Delay lyrics 1.0s later"
                        >
                          +1s
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reset Offset Button */}
                  {onResetSync && manualOffset !== 0 && (
                    <button
                      type="button"
                      className="sync-reset-action-btn"
                      onClick={onResetSync}
                      title="Reset lyrics offset to 0.0s"
                    >
                      <RotateCcw size={12} />
                      <span>Reset to 0.0s</span>
                    </button>
                  )}

                  {/* Keyboard Shortcuts Hint */}
                  <div className="sync-tip-hint">
                    <span>
                      Tip: Press <kbd className="hint-kbd">S</kbd> when lyrics start &middot;{' '}
                      <kbd className="hint-kbd">[</kbd> / <kbd className="hint-kbd">]</kbd> to adjust sync (&plusmn;0.1s)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Artist Profile Button */}
          {onOpenArtist && (
            <button
              type="button"
              className="ctrl-btn ctrl-btn-artist"
              onClick={onOpenArtist}
              title={artistName ? `Explore ${artistName} music videos & songs` : 'Open Artist Profile'}
              aria-label="Open Artist Profile"
            >
              <UserRound size={17} />
            </button>
          )}

          {/* Search LRCLIB */}
          {onSearchLrclibClick && (
            <button
              type="button"
              className="ctrl-btn"
              onClick={onSearchLrclibClick}
              title="Search LRCLIB (https://lrclib.net)"
              aria-label="Search LRCLIB"
            >
              <Search size={17} />
            </button>
          )}

          {/* Manual LRC File Upload */}
          <button
            type="button"
            className="ctrl-btn"
            onClick={onUploadLrcClick}
            title="Load custom .LRC file"
            aria-label="Upload LRC file"
          >
            <Upload size={17} />
          </button>

          {/* Toggle Lyrics Visibility */}
          <button
            type="button"
            className={`ctrl-btn ${!lyricsVisible ? 'active' : ''}`}
            onClick={onToggleLyricsVisible}
            title={lyricsVisible ? 'Hide lyrics overlay' : 'Show lyrics overlay'}
            aria-label="Toggle lyrics overlay visibility"
          >
            {lyricsVisible ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>

          {/* Typography Preset Picker Trigger */}
          <div className="dropdown-wrapper">
            <button
              type="button"
              className={`ctrl-btn ${showTypographyMenu ? 'active' : ''}`}
              onClick={() => {
                setShowTypographyMenu(!showTypographyMenu);
                setShowEffectsMenu(false);
                setIsSyncManagerOpen(false);
              }}
              title="Lyric Typography Presets"
              aria-label="Select typography preset"
            >
              <Type size={17} />
            </button>

            {showTypographyMenu && (
              <div className="player-popover typography-popover">
                <span className="popover-title">Lyric Typography</span>
                {(
                  [
                    { id: 'kinetic', name: 'Kinetic Screen (Cinema Edit)' },
                    { id: 'focus-stack', name: 'Focus Stack' },
                    { id: 'inter', name: 'Modern Sans' },
                    { id: 'geometric', name: 'Geometric' },
                    { id: 'serif', name: 'Editorial Serif' },
                    { id: 'mono', name: 'Monospace' },
                  ] as { id: TypographyPreset; name: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`popover-item ${
                      preferences.typographyPreset === t.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      onUpdatePreferences({ typographyPreset: t.id });
                      setShowTypographyMenu(false);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Background Blur & Atmosphere Slider (Available for all sources) */}
          <div className="dropdown-wrapper">
            <button
              type="button"
              className={`ctrl-btn ${showEffectsMenu ? 'active' : ''}`}
              onClick={() => {
                setShowEffectsMenu(!showEffectsMenu);
                setShowTypographyMenu(false);
                setIsSyncManagerOpen(false);
              }}
              title="Background Blur & Dim"
              aria-label="Background visual atmosphere settings"
            >
              <Sliders size={17} />
            </button>

            {showEffectsMenu && (
              <div className="player-popover effects-popover">
                <div className="popover-header-row">
                  <span className="popover-title">Blur & Dim</span>
                  {((preferences.blurLevel ?? 0) > 0 || (preferences.overlayOpacity ?? 0) > 0) && (
                    <button
                      type="button"
                      className="popover-reset-btn"
                      onClick={() =>
                        onUpdatePreferences({ blurLevel: 0, overlayOpacity: 0 })
                      }
                      title="Reset to Original Video (0% Dim, 0px Blur)"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="effects-presets-row">
                  <button
                    type="button"
                    className={`effects-preset-chip ${(preferences.blurLevel ?? 0) === 0 && (preferences.overlayOpacity ?? 0) === 0 ? 'active' : ''}`}
                    onClick={() =>
                      onUpdatePreferences({ blurLevel: 0, overlayOpacity: 0 })
                    }
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    className={`effects-preset-chip ${(preferences.blurLevel ?? 0) === 4 && Math.round((preferences.overlayOpacity ?? 0) * 100) === 20 ? 'active' : ''}`}
                    onClick={() =>
                      onUpdatePreferences({ blurLevel: 4, overlayOpacity: 0.2 })
                    }
                  >
                    Subtle
                  </button>
                  <button
                    type="button"
                    className={`effects-preset-chip ${(preferences.blurLevel ?? 0) === 8 && Math.round((preferences.overlayOpacity ?? 0) * 100) === 40 ? 'active' : ''}`}
                    onClick={() =>
                      onUpdatePreferences({ blurLevel: 8, overlayOpacity: 0.4 })
                    }
                  >
                    Atmosphere
                  </button>
                </div>

                <div className="popover-slider-row">
                  <div className="popover-slider-label-row">
                    <label>Dim Video</label>
                    <span className="slider-val-tag">
                      {Math.round((preferences.overlayOpacity ?? 0) * 100)}%
                      {(preferences.overlayOpacity ?? 0) === 0 ? ' (No Dim)' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={preferences.overlayOpacity ?? 0}
                    onChange={(e) =>
                      onUpdatePreferences({ overlayOpacity: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="popover-slider-row">
                  <div className="popover-slider-label-row">
                    <label>Blur Video</label>
                    <span className="slider-val-tag">
                      {preferences.blurLevel ?? 0}px
                      {(preferences.blurLevel ?? 0) === 0 ? ' (Original Sharp)' : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={preferences.blurLevel ?? 0}
                    onChange={(e) =>
                      onUpdatePreferences({ blurLevel: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="ctrl-btn"
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </div>
    </footer>
  );
};

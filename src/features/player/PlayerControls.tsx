import React, { useState } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import type { VideoPlayerState } from '../../services/video/types';
import type { TypographyPreset, UserPreferences } from '../../types/session';
import { formatDuration } from '../../utils/formatters';
import './PlayerControls.css';

interface PlayerControlsProps {
  playerState: VideoPlayerState;
  title: string;
  sourceKind: 'youtube' | 'local';
  manualOffset: number;
  preferences: UserPreferences;
  isFullScreen: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onOffsetChange: (offset: number) => void;
  onUploadLrcClick: () => void;
  onToggleFullScreen: () => void;
  onExitPlayer: () => void;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerState,
  title,
  sourceKind,
  manualOffset,
  preferences,
  isFullScreen,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOffsetChange,
  onUploadLrcClick,
  onToggleFullScreen,
  onExitPlayer,
  onUpdatePreferences,
}) => {
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);
  const [showEffectsMenu, setShowEffectsMenu] = useState(false);

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
                <span className="offset-pill">
                  Offset: {manualOffset > 0 ? `+${manualOffset.toFixed(1)}s` : `${manualOffset.toFixed(1)}s`}
                </span>
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

        {/* Right Section: Volume, LRC Offset, Typo Preset, Fullscreen */}
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

          {/* Sync Offset Adjuster */}
          <div className="offset-adjuster" title="Adjust lyric timing forward or backward">
            <button
              type="button"
              className="offset-step-btn"
              onClick={() => onOffsetChange(Number((manualOffset - 0.2).toFixed(1)))}
              title="Shift lyrics earlier (-0.2s)"
            >
              -0.2s
            </button>
            {manualOffset !== 0 && (
              <button
                type="button"
                className="offset-reset-btn"
                onClick={() => onOffsetChange(0)}
                title="Reset timing offset"
              >
                <RotateCcw size={12} />
              </button>
            )}
            <button
              type="button"
              className="offset-step-btn"
              onClick={() => onOffsetChange(Number((manualOffset + 0.2).toFixed(1)))}
              title="Shift lyrics later (+0.2s)"
            >
              +0.2s
            </button>
          </div>

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

          {/* Typography Preset Picker Trigger */}
          <div className="dropdown-wrapper">
            <button
              type="button"
              className={`ctrl-btn ${showTypographyMenu ? 'active' : ''}`}
              onClick={() => {
                setShowTypographyMenu(!showTypographyMenu);
                setShowEffectsMenu(false);
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

          {/* Local Mode Blur & Atmosphere Slider (Only for Local/Licensed source) */}
          {sourceKind === 'local' && (
            <div className="dropdown-wrapper">
              <button
                type="button"
                className={`ctrl-btn ${showEffectsMenu ? 'active' : ''}`}
                onClick={() => {
                  setShowEffectsMenu(!showEffectsMenu);
                  setShowTypographyMenu(false);
                }}
                title="Background Blur & Dim"
                aria-label="Background visual settings"
              >
                <Sliders size={17} />
              </button>

              {showEffectsMenu && (
                <div className="player-popover effects-popover">
                  <span className="popover-title">Background Atmosphere</span>
                  <div className="popover-slider-row">
                    <label>Blur ({preferences.blurLevel}px)</label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={preferences.blurLevel}
                      onChange={(e) =>
                        onUpdatePreferences({ blurLevel: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="popover-slider-row">
                    <label>Dim Overlay ({Math.round(preferences.overlayOpacity * 100)}%)</label>
                    <input
                      type="range"
                      min="0.2"
                      max="0.85"
                      step="0.05"
                      value={preferences.overlayOpacity}
                      onChange={(e) =>
                        onUpdatePreferences({ overlayOpacity: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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

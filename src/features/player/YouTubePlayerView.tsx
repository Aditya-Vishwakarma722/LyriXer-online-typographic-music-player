import React, { useEffect, useRef } from 'react';
import { YouTubeAdapter } from '../../services/video/YouTubeAdapter';
import { LyricsView } from './LyricsView';
import type { VideoPlayerListener, VideoPlayerAdapter } from '../../services/video/types';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import type { TypographyPreset } from '../../types/session';
import { Sparkles, RotateCcw, UserRound } from 'lucide-react';
import './YouTubePlayerView.css';

interface YouTubePlayerViewProps {
  videoId: string;
  lyrics: LyricTrack | null;
  activeIndex: number;
  isLoadingLyrics: boolean;
  typographyPreset: TypographyPreset;
  fontSizeScale: number;
  blurLevel: number;
  overlayOpacity: number;
  lyricsVisible: boolean;
  onAdapterReady: (adapter: VideoPlayerAdapter) => void;
  listener: VideoPlayerListener;
  onSeekTo: (seconds: number) => void;
  onUploadLrcClick: () => void;
  onSearchLrclibClick: () => void;
  onAutoSync?: () => void;
  onAlignVocalsToNow?: () => void;
  isEnded?: boolean;
  trackTitle?: string;
  trackArtist?: string;
  onOpenArtist?: () => void;
}

export const YouTubePlayerView: React.FC<YouTubePlayerViewProps> = ({
  videoId,
  lyrics,
  activeIndex,
  isLoadingLyrics,
  typographyPreset,
  fontSizeScale,
  blurLevel,
  overlayOpacity,
  lyricsVisible,
  onAdapterReady,
  listener,
  onSeekTo,
  onUploadLrcClick,
  onSearchLrclibClick,
  onAutoSync,
  onAlignVocalsToNow,
  isEnded,
  trackTitle,
  trackArtist,
  onOpenArtist,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<YouTubeAdapter | null>(null);
  const listenerRef = useRef(listener);
  const onAdapterReadyRef = useRef(onAdapterReady);

  useEffect(() => {
    listenerRef.current = listener;
    onAdapterReadyRef.current = onAdapterReady;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Create container element for YouTube player
    const playerDiv = document.createElement('div');
    playerDiv.id = `yt-player-${videoId}`;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(playerDiv);

    const adapter = new YouTubeAdapter(playerDiv.id, videoId, {
      onTimeUpdate: (t) => listenerRef.current?.onTimeUpdate?.(t),
      onStateChange: (s) => listenerRef.current?.onStateChange?.(s),
      onDurationChange: (d) => listenerRef.current?.onDurationChange?.(d),
      onMetadata: (m) => listenerRef.current?.onMetadata?.(m),
    });
    adapterRef.current = adapter;
    onAdapterReadyRef.current?.(adapter);

    return () => {
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="yt-fullscreen-player-root">
      {/* 1. Full-Viewport YouTube Video Backdrop */}
      <div
        className="yt-fullscreen-video-viewport"
        style={{
          filter: blurLevel > 0 ? `blur(${blurLevel}px)` : 'none',
        }}
      >
        <div ref={containerRef} className="yt-fullscreen-host" />
      </div>

      {/* 2. Atmospheric Translucent Contrast Overlay */}
      <div
        className="yt-fullscreen-contrast-overlay"
        style={{
          backgroundColor: `rgba(11, 11, 13, ${overlayOpacity})`,
        }}
      />

      {/* 3. Centered Lyrics Overlay (Floating directly above the playing video) */}
      <div
        className={`yt-fullscreen-lyrics-overlay ${
          lyricsVisible && !isEnded ? 'lyrics-visible' : 'lyrics-hidden'
        }`}
      >
        <LyricsView
          lyrics={lyrics}
          activeIndex={activeIndex}
          isLoadingLyrics={isLoadingLyrics}
          typographyPreset={typographyPreset}
          fontSizeScale={fontSizeScale}
          onSeekTo={onSeekTo}
          onUploadLrcClick={onUploadLrcClick}
          onSearchLrclibClick={onSearchLrclibClick}
          onAutoSync={onAutoSync}
          onAlignVocalsToNow={onAlignVocalsToNow}
        />
      </div>

      {/* 4. Complete End-Screen Blocker (Hides all YouTube recommendations & suggested video cards) */}
      {isEnded && (
        <div className="yt-end-screen-blocker" role="dialog" aria-label="Playback Finished">
          <div className="yt-end-screen-content">
            <div className="end-sparkle-badge">
              <Sparkles size={16} className="text-accent" />
              <span>Track Completed</span>
            </div>
            <h2 className="end-track-title">{trackTitle || 'Track Finished'}</h2>
            {trackArtist && <p className="end-track-artist">{trackArtist}</p>}

            <div className="end-action-buttons">
              <button
                type="button"
                className="end-action-btn primary"
                onClick={() => {
                  onSeekTo(0);
                  adapterRef.current?.play();
                }}
              >
                <RotateCcw size={15} />
                <span>Replay Song</span>
              </button>
              {onOpenArtist && (
                <button
                  type="button"
                  className="end-action-btn secondary"
                  onClick={onOpenArtist}
                >
                  <UserRound size={15} />
                  <span>Explore {trackArtist || 'Artist'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { YouTubeAdapter } from '../../services/video/YouTubeAdapter';
import { LyricsView } from './LyricsView';
import type { VideoPlayerListener, VideoPlayerAdapter } from '../../services/video/types';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import type { TypographyPreset } from '../../types/session';
import './YouTubePlayerView.css';

interface YouTubePlayerViewProps {
  videoId: string;
  lyrics: LyricTrack | null;
  activeIndex: number;
  isLoadingLyrics: boolean;
  typographyPreset: TypographyPreset;
  fontSizeScale: number;
  onAdapterReady: (adapter: VideoPlayerAdapter) => void;
  listener: VideoPlayerListener;
  onSeekTo: (seconds: number) => void;
  onUploadLrcClick: () => void;
}

export const YouTubePlayerView: React.FC<YouTubePlayerViewProps> = ({
  videoId,
  lyrics,
  activeIndex,
  isLoadingLyrics,
  typographyPreset,
  fontSizeScale,
  onAdapterReady,
  listener,
  onSeekTo,
  onUploadLrcClick,
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
    });
    adapterRef.current = adapter;
    onAdapterReadyRef.current?.(adapter);

    return () => {
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="yt-player-layout">
      {/* Left/Top Video Column: Official Unobscured YouTube Player */}
      <div className="yt-video-column">
        <div className="yt-frame-container">
          <div ref={containerRef} className="yt-embed-host" />
        </div>
      </div>

      {/* Right/Bottom Lyrics Column: Clean Adjacent Synchronized View */}
      <div className="yt-lyrics-column">
        <LyricsView
          lyrics={lyrics}
          activeIndex={activeIndex}
          isLoadingLyrics={isLoadingLyrics}
          typographyPreset={typographyPreset}
          fontSizeScale={fontSizeScale}
          onSeekTo={onSeekTo}
          onUploadLrcClick={onUploadLrcClick}
        />
      </div>
    </div>
  );
};

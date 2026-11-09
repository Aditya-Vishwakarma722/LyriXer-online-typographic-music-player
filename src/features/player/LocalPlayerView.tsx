import React, { useEffect, useRef } from 'react';
import { HTML5VideoAdapter } from '../../services/video/HTML5VideoAdapter';
import { LyricsView } from './LyricsView';
import type { VideoPlayerListener, VideoPlayerAdapter } from '../../services/video/types';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import type { TypographyPreset } from '../../types/session';
import './LocalPlayerView.css';

interface LocalPlayerViewProps {
  localFile: File | string;
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
}

export const LocalPlayerView: React.FC<LocalPlayerViewProps> = ({
  localFile,
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
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adapterRef = useRef<HTML5VideoAdapter | null>(null);
  const listenerRef = useRef(listener);
  const onAdapterReadyRef = useRef(onAdapterReady);

  useEffect(() => {
    listenerRef.current = listener;
    onAdapterReadyRef.current = onAdapterReady;
  });

  useEffect(() => {
    if (!videoRef.current) return;

    const adapter = new HTML5VideoAdapter(videoRef.current, localFile, {
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
  }, [localFile]);

  return (
    <div className="local-player-layout">
      {/* 1. Background Full-Viewport Video Layer with Configurable Blur */}
      <video
        ref={videoRef}
        className="local-bg-video"
        style={{
          filter: blurLevel > 0 ? `blur(${blurLevel}px) saturate(1.2)` : 'saturate(1.2)',
        }}
        muted={false}
        playsInline
      />

      {/* 2. Atmospheric Dark Translucent Overlay */}
      <div
        className="local-dark-overlay"
        style={{
          backgroundColor: `rgba(11, 11, 13, ${overlayOpacity})`,
        }}
      />

      {/* 3. Centered Overlay Lyrics View */}
      <div
        className={`local-lyrics-container ${
          lyricsVisible ? 'lyrics-visible' : 'lyrics-hidden'
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
        />
      </div>
    </div>
  );
};

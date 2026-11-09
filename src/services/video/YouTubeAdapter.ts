import type { VideoPlayerAdapter, VideoPlayerListener } from './types';

// Ambient declaration for YouTube IFrame API
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: any }) => void;
            onStateChange?: (event: { data: number; target: any }) => void;
            onPlaybackQualityChange?: (event: { data: string; target: any }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * Ensures the official YouTube IFrame API script is loaded once.
 */
function loadYouTubeIframeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve();
    };
  });
}

export class YouTubeAdapter implements VideoPlayerAdapter {
  private player: any = null;
  private videoId: string;
  private listener: VideoPlayerListener;
  private timer: number | null = null;
  private isDestroyed = false;
  private lastEmittedTitle = '';
  private lastEmittedAuthor = '';

  constructor(
    container: HTMLElement | string,
    videoId: string,
    listener: VideoPlayerListener
  ) {
    this.videoId = videoId;
    this.listener = listener;
    this.init(container, videoId);
  }

  private async init(container: HTMLElement | string, videoId: string) {
    try {
      this.listener.onStateChange?.({ status: 'loading' });
      await loadYouTubeIframeApi();

      if (this.isDestroyed) return;

      this.player = new window.YT!.Player(container, {
        videoId,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          vq: 'hd1440', // Request 1440p high definition default
          controls: 0, // Disable YouTube's own player controls so LyriXer custom player handles everything
          disablekb: 1,
          cc_load_policy: 0, // Disable YouTube's own auto captions to prevent collision with LyriXer
          cc_lang_pref: 'none',
          iv_load_policy: 3, // Disable video annotations
        },
        events: {
          onReady: (event) => {
            if (this.isDestroyed) return;
            this.disableYouTubeCaptions(event.target);
            const duration = event.target.getDuration() || 0;
            this.listener.onDurationChange?.(duration);
            this.enforceMaxQuality();
            this.emitVideoMetadata(event.target);
            this.listener.onStateChange?.({
              status: 'ready',
              duration,
              paused: true,
              volume: event.target.getVolume() || 80,
              muted: event.target.isMuted() || false,
            });
            this.startClock();
            setTimeout(() => this.disableYouTubeCaptions(), 500);
            setTimeout(() => this.disableYouTubeCaptions(), 1500);
          },
          onStateChange: (event) => {
            if (this.isDestroyed) return;
            const YTState = window.YT!.PlayerState;

            if (event.data === YTState.PLAYING) {
              this.disableYouTubeCaptions(event.target);
              this.enforceMaxQuality();
              this.emitVideoMetadata(event.target);
              this.listener.onStateChange?.({ status: 'playing', paused: false });
              this.startClock();
              setTimeout(() => this.disableYouTubeCaptions(), 400);
              setTimeout(() => this.disableYouTubeCaptions(), 1200);
            } else if (event.data === YTState.PAUSED) {
              this.listener.onStateChange?.({ status: 'paused', paused: true });
              this.syncTime();
            } else if (event.data === YTState.ENDED) {
              this.listener.onStateChange?.({ status: 'ended', paused: true });
              this.stopClock();
            } else if (event.data === YTState.BUFFERING) {
              this.listener.onStateChange?.({ status: 'loading' });
            }
          },
          onPlaybackQualityChange: () => {
            if (this.isDestroyed) return;
            this.enforceMaxQuality();
            this.disableYouTubeCaptions();
          },
          onError: (event) => {
            if (this.isDestroyed) return;
            let errorMsg = 'An error occurred loading the YouTube video.';
            if (event.data === 2) errorMsg = 'Invalid YouTube video ID parameter.';
            else if (event.data === 100) errorMsg = 'Video requested was not found or has been removed.';
            else if (event.data === 101 || event.data === 150)
              errorMsg = 'Embedding this video is restricted by the copyright owner.';
            this.listener.onError?.(errorMsg);
            this.listener.onStateChange?.({ status: 'error', errorMessage: errorMsg });
          },
        },
      });
    } catch (err: any) {
      this.listener.onError?.(err?.message || 'Failed to initialize YouTube player.');
      this.listener.onStateChange?.({ status: 'error', errorMessage: 'Initialization failed.' });
    }
  }

  /**
   * Forcibly disables and unloads YouTube native captions and subtitles,
   * preventing them from displaying over or behind LyriXer's typographic lyrics.
   */
  private disableYouTubeCaptions(playerInstance?: any) {
    const p = playerInstance || this.player;
    if (!p) return;
    try {
      if (typeof p.unloadModule === 'function') {
        p.unloadModule('captions');
        p.unloadModule('cc');
      }
      if (typeof p.setOption === 'function') {
        p.setOption('captions', 'track', {});
        p.setOption('cc', 'track', {});
        p.setOption('captions', 'fontSize', 0);
        p.setOption('captions', 'reload', false);
      }
    } catch {
      // Module might not yet be initialized
    }
  }

  /**
   * Enforces the maximum available video quality (1440p+ if supported, otherwise 1080p).
   */
  private enforceMaxQuality() {
    if (!this.player) return;
    try {
      const available: string[] =
        typeof this.player.getAvailableQualityLevels === 'function'
          ? this.player.getAvailableQualityLevels()
          : [];

      // Check quality preference hierarchy: 1440p+ ('highres', 'hd2160', 'hd1440'), then 1080p ('hd1080')
      const targetQuality =
        available.find((q) => ['highres', 'hd2160', 'hd1440'].includes(q)) ||
        available.find((q) => q === 'hd1080') ||
        (available.length > 0 ? available[0] : 'hd1080');

      if (typeof this.player.setPlaybackQuality === 'function') {
        this.player.setPlaybackQuality(targetQuality);
      }
    } catch {
      // Quality switch may not be permitted in initial buffering phase
    }
  }

  private emitVideoMetadata(player: any) {
    if (!player) return;
    try {
      if (typeof player.getVideoData === 'function') {
        const data = player.getVideoData();
        const title = (data?.title || '').trim();
        const author = (data?.author || '').trim();

        // Ensure title is a real song title (not generic placeholder)
        if (
          title &&
          title.toLowerCase() !== 'youtube' &&
          !title.startsWith('YouTube Video (') &&
          (title !== this.lastEmittedTitle || author !== this.lastEmittedAuthor)
        ) {
          this.lastEmittedTitle = title;
          this.lastEmittedAuthor = author;
          this.listener.onMetadata?.({
            title,
            author,
            videoId: data.video_id || this.videoId,
          });
        }
      }
    } catch {
      // player may not yet have data loaded
    }
  }

  private startClock() {
    this.stopClock();
    // High-frequency 35ms polling clock for frame-accurate lyric sync
    this.timer = window.setInterval(() => {
      this.syncTime();
    }, 35);
  }

  private stopClock() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private syncTime() {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      try {
        const time = this.player.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          this.listener.onTimeUpdate?.(time);
        }
        // Poll for metadata if not yet resolved
        if (!this.lastEmittedTitle) {
          this.emitVideoMetadata(this.player);
        }
      } catch {
        // Player may be transitioning
      }
    }
  }

  async play(): Promise<void> {
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  pause(): void {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
  }

  seekTo(seconds: number): void {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
      this.syncTime();
    }
  }

  setVolume(volume: number): void {
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.max(0, Math.min(100, volume)));
    }
  }

  setMuted(muted: boolean): void {
    if (this.player) {
      if (muted && typeof this.player.mute === 'function') {
        this.player.mute();
      } else if (!muted && typeof this.player.unMute === 'function') {
        this.player.unMute();
      }
    }
  }

  getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      return this.player.getCurrentTime() || 0;
    }
    return 0;
  }

  getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function') {
      return this.player.getDuration() || 0;
    }
    return 0;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.stopClock();
    if (this.player && typeof this.player.destroy === 'function') {
      try {
        this.player.destroy();
      } catch {
        // Ignored
      }
      this.player = null;
    }
  }
}


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
  private listener: VideoPlayerListener;
  private timer: number | null = null;
  private isDestroyed = false;

  constructor(
    container: HTMLElement | string,
    videoId: string,
    listener: VideoPlayerListener
  ) {
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
        },
        events: {
          onReady: (event) => {
            if (this.isDestroyed) return;
            const duration = event.target.getDuration() || 0;
            this.listener.onDurationChange?.(duration);
            this.listener.onStateChange?.({
              status: 'ready',
              duration,
              paused: true,
              volume: event.target.getVolume() || 80,
              muted: event.target.isMuted() || false,
            });
            this.startClock();
          },
          onStateChange: (event) => {
            if (this.isDestroyed) return;
            const YTState = window.YT!.PlayerState;

            if (event.data === YTState.PLAYING) {
              this.listener.onStateChange?.({ status: 'playing', paused: false });
              this.startClock();
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

  private startClock() {
    this.stopClock();
    this.timer = window.setInterval(() => {
      this.syncTime();
    }, 100);
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

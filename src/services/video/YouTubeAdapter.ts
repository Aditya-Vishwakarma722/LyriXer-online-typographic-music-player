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
  private lastQualityCheckTime = 0;
  private lastCaptionCheckTime = 0;

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
          loop: 1,
          playlist: videoId,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          vq: 'hd2160', // Request 2160p (4K UHD) as upper ceiling, strictly minimum 1080p HD
          controls: 0, // Disable YouTube's own player controls so LyriXer custom player handles everything
          showinfo: 0,
          disablekb: 1,
          cc_load_policy: 0, // Disable YouTube's own auto captions to prevent collision with LyriXer
          cc_lang_pref: 'none',
          iv_load_policy: 3, // Disable video annotations
          fs: 0, // Disable native fullscreen button inside iframe
          autohide: 1,
        },
        events: {
          onReady: (event) => {
            if (this.isDestroyed) return;
            this.disableYouTubeCaptions(event.target);
            const duration = event.target.getDuration() || 0;
            this.listener.onDurationChange?.(duration);
            this.enforceQualityRange();
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
            setTimeout(() => this.enforceQualityRange(), 400);
            setTimeout(() => this.enforceQualityRange(), 1200);
          },
          onStateChange: (event) => {
            if (this.isDestroyed) return;
            const YTState = window.YT!.PlayerState;

            if (event.data === YTState.PLAYING) {
              this.disableYouTubeCaptions(event.target);
              this.enforceQualityRange();
              this.emitVideoMetadata(event.target);
              this.listener.onStateChange?.({ status: 'playing', paused: false });
              this.startClock();
              setTimeout(() => this.disableYouTubeCaptions(), 400);
              setTimeout(() => this.disableYouTubeCaptions(), 1200);

              // Continuously re-verify and lock quality between min 1080p and max 2160p as streams initialize
              [300, 800, 1600, 3200, 5000].forEach((delay) => {
                setTimeout(() => {
                  if (!this.isDestroyed) {
                    this.enforceQualityRange();
                  }
                }, delay);
              });
            } else if (event.data === YTState.PAUSED) {
              this.listener.onStateChange?.({ status: 'paused', paused: true });
              this.syncTime();
            } else if (event.data === YTState.ENDED) {
              this.listener.onStateChange?.({ status: 'ended', paused: true });
              this.stopClock();
            } else if (event.data === YTState.BUFFERING) {
              this.enforceQualityRange();
              this.listener.onStateChange?.({ status: 'loading' });
            }
          },
          onPlaybackQualityChange: (event: any) => {
            if (this.isDestroyed) return;
            // Intercept quality change: reject sub-1080p drops and enforce 1080p - 2160p range
            this.enforceQualityRange(event?.data);
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
        p.setOption('captions', 'fontSize', -1);
        p.setOption('captions', 'reload', false);
      }
    } catch {
      // Module might not yet be initialized
    }
  }

  /**
   * Enforces strict video playback quality locked between:
   * - Minimum: 1080p ('hd1080' Full HD)
   * - Maximum: 2160p ('hd2160' / 4K UHD)
   *
   * Systematically checks available stream levels, locks suggested range,
   * and prevents YouTube's ABR from silently degrading quality below 1080p.
   */
  public enforceQualityRange(currentQuality?: string) {
    if (!this.player) return;
    try {
      const available: string[] =
        typeof this.player.getAvailableQualityLevels === 'function'
          ? this.player.getAvailableQualityLevels()
          : [];

      // Quality tier priorities capped at 2160p (4K UHD) down to 1080p floor
      let targetQuality = 'hd2160';

      if (available && available.length > 0) {
        // Find best match in order: 2160p (4K) -> 1440p (2K) -> 1080p (Full HD)
        if (available.includes('hd2160') || available.includes('highres')) {
          targetQuality = 'hd2160';
        } else if (available.includes('hd1440')) {
          targetQuality = 'hd1440';
        } else if (available.includes('hd1080')) {
          targetQuality = 'hd1080';
        } else {
          // If video was only uploaded in lower resolutions (legacy 720p/480p), select maximum available
          targetQuality = available[0];
        }
      }

      const activeQuality =
        currentQuality ||
        (typeof this.player.getPlaybackQuality === 'function'
          ? this.player.getPlaybackQuality()
          : null);

      const isSub1080p =
        activeQuality &&
        ['hd720', 'large', 'medium', 'small', 'tiny', 'auto', 'default'].includes(activeQuality) &&
        available.some((tier) => ['hd2160', 'highres', 'hd1440', 'hd1080'].includes(tier));

      const isOver2160p =
        activeQuality && ['hd2880', 'highres'].includes(activeQuality) && available.includes('hd2160');

      if (
        !activeQuality ||
        activeQuality !== targetQuality ||
        isSub1080p ||
        isOver2160p
      ) {
        if (typeof this.player.setPlaybackQuality === 'function') {
          this.player.setPlaybackQuality(targetQuality);
        }
        if (typeof this.player.setPlaybackQualityRange === 'function') {
          // Lock suggested range strictly: min 1080p, max 2160p
          const minQuality = available.includes('hd1080') ? 'hd1080' : targetQuality;
          const maxQuality = available.includes('hd2160') ? 'hd2160' : (targetQuality === 'hd1440' ? 'hd1440' : targetQuality);
          this.player.setPlaybackQualityRange(minQuality, maxQuality);
        }
      }

      const resolved =
        (typeof this.player.getPlaybackQuality === 'function'
          ? this.player.getPlaybackQuality()
          : null) || targetQuality;

      this.listener.onStateChange?.({ playbackQuality: resolved });
    } catch {
      // Quality switch may not be permitted in initial buffering phase
    }
  }

  /**
   * Alias for enforceQualityRange
   */
  public enforceMaxQuality(currentQuality?: string) {
    this.enforceQualityRange(currentQuality);
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
        const duration = typeof this.player.getDuration === 'function' ? this.player.getDuration() : 0;

        if (typeof time === 'number' && !isNaN(time)) {
          this.listener.onTimeUpdate?.(time);

          const now = performance.now();
          // During the first 5 seconds, keep suppressing YouTube captions at a stable rate
          if (time < 5 && now - this.lastCaptionCheckTime > 1200) {
            this.lastCaptionCheckTime = now;
            this.disableYouTubeCaptions();
          }

          // Periodic quality watchdog: verify that playback has not dropped below 1080p (every 3s max)
          if (time > 2 && now - this.lastQualityCheckTime > 3000) {
            this.lastQualityCheckTime = now;
            this.enforceQualityRange();
          }

          // Pre-emptively intercept video end right before YouTube renders its recommendation grid
          if (duration > 5 && time >= duration - 0.6) {
            this.pause();
            this.listener.onStateChange?.({ status: 'ended', paused: true });
            this.stopClock();
            return;
          }
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
      this.enforceMaxQuality();
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
      this.enforceMaxQuality();
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


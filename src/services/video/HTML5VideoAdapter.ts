import type { VideoPlayerAdapter, VideoPlayerListener } from './types';

export class HTML5VideoAdapter implements VideoPlayerAdapter {
  private videoElement: HTMLVideoElement | null = null;
  private listener: VideoPlayerListener;
  private objectUrl: string | null = null;
  private isDestroyed = false;

  constructor(
    videoElement: HTMLVideoElement,
    source: File | string,
    listener: VideoPlayerListener
  ) {
    this.videoElement = videoElement;
    this.listener = listener;
    this.init(source);
  }

  private init(source: File | string) {
    if (!this.videoElement) return;

    this.listener.onStateChange?.({ status: 'loading' });

    if (source instanceof File) {
      this.objectUrl = URL.createObjectURL(source);
      this.videoElement.src = this.objectUrl;
    } else {
      this.videoElement.src = source;
    }

    this.videoElement.playsInline = true;
    this.videoElement.preload = 'auto';

    // Event Listeners
    this.videoElement.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.videoElement.addEventListener('timeupdate', this.handleTimeUpdate);
    this.videoElement.addEventListener('play', this.handlePlay);
    this.videoElement.addEventListener('pause', this.handlePause);
    this.videoElement.addEventListener('ended', this.handleEnded);
    this.videoElement.addEventListener('waiting', this.handleWaiting);
    this.videoElement.addEventListener('playing', this.handlePlaying);
    this.videoElement.addEventListener('error', this.handleError);

    // Initial check
    if (this.videoElement.readyState >= 1) {
      this.handleLoadedMetadata();
    }
  }

  private handleLoadedMetadata = () => {
    if (this.isDestroyed || !this.videoElement) return;
    const duration = this.videoElement.duration || 0;
    this.listener.onDurationChange?.(duration);
    this.listener.onStateChange?.({
      status: 'ready',
      duration,
      paused: this.videoElement.paused,
      volume: Math.round(this.videoElement.volume * 100),
      muted: this.videoElement.muted,
    });
  };

  private handleTimeUpdate = () => {
    if (this.isDestroyed || !this.videoElement) return;
    this.listener.onTimeUpdate?.(this.videoElement.currentTime);
  };

  private handlePlay = () => {
    if (this.isDestroyed) return;
    this.listener.onStateChange?.({ status: 'playing', paused: false });
  };

  private handlePause = () => {
    if (this.isDestroyed) return;
    this.listener.onStateChange?.({ status: 'paused', paused: true });
  };

  private handleEnded = () => {
    if (this.isDestroyed) return;
    this.listener.onStateChange?.({ status: 'ended', paused: true });
  };

  private handleWaiting = () => {
    if (this.isDestroyed) return;
    this.listener.onStateChange?.({ status: 'loading' });
  };

  private handlePlaying = () => {
    if (this.isDestroyed) return;
    this.listener.onStateChange?.({ status: 'playing', paused: false });
  };

  private handleError = () => {
    if (this.isDestroyed || !this.videoElement) return;
    const err = this.videoElement.error;
    const errorMsg = err?.message || 'Error occurred playing local video file.';
    this.listener.onError?.(errorMsg);
    this.listener.onStateChange?.({ status: 'error', errorMessage: errorMsg });
  };

  async play(): Promise<void> {
    if (this.videoElement) {
      try {
        await this.videoElement.play();
      } catch (err: any) {
        // Autoplay may be restricted by browser until user gesture
        console.warn('Autoplay prevented:', err);
      }
    }
  }

  pause(): void {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }

  seekTo(seconds: number): void {
    if (this.videoElement && isFinite(seconds)) {
      this.videoElement.currentTime = Math.max(0, Math.min(seconds, this.videoElement.duration || seconds));
    }
  }

  setVolume(volume: number): void {
    if (this.videoElement) {
      this.videoElement.volume = Math.max(0, Math.min(100, volume)) / 100;
    }
  }

  setMuted(muted: boolean): void {
    if (this.videoElement) {
      this.videoElement.muted = muted;
    }
  }

  getCurrentTime(): number {
    return this.videoElement?.currentTime || 0;
  }

  getDuration(): number {
    return this.videoElement?.duration || 0;
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.videoElement) {
      this.videoElement.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
      this.videoElement.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.videoElement.removeEventListener('play', this.handlePlay);
      this.videoElement.removeEventListener('pause', this.handlePause);
      this.videoElement.removeEventListener('ended', this.handleEnded);
      this.videoElement.removeEventListener('waiting', this.handleWaiting);
      this.videoElement.removeEventListener('playing', this.handlePlaying);
      this.videoElement.removeEventListener('error', this.handleError);
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement = null;
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}

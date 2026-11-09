export type PlayerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export interface VideoPlayerState {
  currentTime: number;
  duration: number;
  paused: boolean;
  volume: number; // 0 - 100
  muted: boolean;
  status: PlayerStatus;
  errorMessage?: string;
}

export interface VideoPlayerListener {
  onTimeUpdate?: (currentTime: number) => void;
  onStateChange?: (state: Partial<VideoPlayerState>) => void;
  onError?: (errorMessage: string) => void;
  onDurationChange?: (duration: number) => void;
  onMetadata?: (meta: { title: string; author: string; videoId?: string }) => void;
}

export interface VideoPlayerAdapter {
  play(): Promise<void>;
  pause(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}


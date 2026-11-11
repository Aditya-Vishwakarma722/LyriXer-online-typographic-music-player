export type VideoSourceKind = 'youtube' | 'local';

export interface LocalFileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface VideoSource {
  kind: VideoSourceKind;
  sourceId: string;
  title: string;
  artist?: string;
  duration?: number;
  thumbnailUrl?: string;
  localFile?: File;
  fileMetadata?: LocalFileMetadata;
  startOffset?: number; // lyrics start timestamp offset in seconds
}

export interface RecentSession {
  id: string;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
  kind: VideoSourceKind;
  sourceId: string;
  duration?: number;
  playedAt: string;
}

export type TypographyPreset = 'kinetic' | 'focus-stack' | 'inter' | 'serif' | 'geometric' | 'mono';

export type BackgroundStyle = 'combined' | 'waves' | 'halo';

export interface UserPreferences {
  typographyPreset: TypographyPreset;
  fontSize: number; // in rem or px
  haloMotion: boolean;
  backgroundStyle: BackgroundStyle;
  enableParticles: boolean;
  theme: 'midnight' | 'abyss' | 'obsidian';
  blurLevel: number; // 0 to 24 px (0 = original sharpness, no blur)
  overlayOpacity: number; // 0 to 1 (0 = original video, no dim)
  hasCustomVisualSettings?: boolean;
}


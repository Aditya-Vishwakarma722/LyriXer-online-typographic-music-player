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
  duration?: number;
  thumbnailUrl?: string;
  localFile?: File;
  fileMetadata?: LocalFileMetadata;
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

export type TypographyPreset = 'inter' | 'serif' | 'geometric' | 'rounded' | 'mono';

export type BackgroundStyle = 'dark-veil' | 'aurora' | 'halo';

export interface UserPreferences {
  typographyPreset: TypographyPreset;
  fontSize: number; // in rem or px
  haloMotion: boolean;
  backgroundStyle: BackgroundStyle;
  enableParticles: boolean;
  theme: 'midnight' | 'abyss' | 'obsidian';
  blurLevel: number; // 0 to 20 px
  overlayOpacity: number; // 0.2 to 0.8
}


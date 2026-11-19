export interface ArtistTrack {
  id: string;
  title: string;
  artist: string;
  featuredArtist?: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "4:29"
  videoId: string; // YouTube Video ID
  isOfficial: boolean; // Verified official upload / Vevo
  trackType?: 'video' | 'collab' | 'audio';
  album?: string;
  year?: string;
  views?: string;
  thumbnailUrl?: string;
  rank?: number;
}

export interface ArtistProfile {
  id: string;
  name: string;
  genre: string;
  monthlyListeners?: string;
  verified: boolean;
  bio?: string;
  heroImageUrl: string;
  portraitImageUrl?: string; // Vertical 9:16 portrait image for Billboard-style artist panels
  heroImages?: string[]; // Multiple normal images aligned left-to-right for panoramic display
  albumCovers?: string[]; // High-resolution iconic album artwork for discography backdrop
  imageAttribution: string;
  youtubeChannelUrl?: string;
  tracks: ArtistTrack[];
  lastChecked?: number; // Timestamp of when catalog release update was last checked
  lastUpdated?: number; // Timestamp of when new songs were added
}

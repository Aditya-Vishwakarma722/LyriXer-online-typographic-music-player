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
  heroImages?: string[]; // Multiple normal images aligned left-to-right for panoramic display
  imageAttribution: string;
  youtubeChannelUrl?: string;
  tracks: ArtistTrack[];
}

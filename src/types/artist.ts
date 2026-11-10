export interface ArtistTrack {
  id: string;
  title: string;
  artist: string;
  featuredArtist?: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "4:29"
  videoId: string; // YouTube Video ID
  isOfficial: boolean; // Verified official upload / Vevo
  album?: string;
  year?: string;
  views?: string;
  thumbnailUrl?: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  genre: string;
  monthlyListeners?: string;
  verified: boolean;
  bio?: string;
  heroImageUrl: string;
  imageAttribution: string;
  youtubeChannelUrl?: string;
  tracks: ArtistTrack[];
}


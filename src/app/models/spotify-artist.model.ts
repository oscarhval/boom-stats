export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string; height?: number; width?: number }>;
  genres: string[];
}
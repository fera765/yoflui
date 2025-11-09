export interface Artist {
  id: string;
  name: string;
  avatar?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: number;
}

export interface Track {
  id: string;
  title: string;
  artist: Artist;
  album: Album;
  duration: string;
  cover: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  tracks: Track[];
}
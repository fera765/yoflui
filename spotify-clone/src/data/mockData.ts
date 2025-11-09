export interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string;
  tracks: Track[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  year: number;
  tracks: Track[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  cover: string;
  audioUrl: string;
}

// Mock playlists
export const mockPlaylists: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Chill Vibes',
    description: 'Relaxing tunes for your downtime',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-2',
    name: 'Workout Hits',
    description: 'High energy tracks for your workout',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-3',
    name: 'Focus Flow',
    description: 'Concentration enhancing music',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-4',
    name: 'Road Trip',
    description: 'Perfect tracks for your journey',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-5',
    name: 'Late Night Jazz',
    description: 'Smooth jazz for late nights',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-6',
    name: 'Morning Motivation',
    description: 'Energetic tracks to start your day',
    image: 'https://images.unsplash.com/photo-1504898770365-14faca6a255f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-7',
    name: 'Study Session',
    description: 'Background music for studying',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-8',
    name: 'Indie Mix',
    description: 'The best indie tracks',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-9',
    name: 'Electronic Dreams',
    description: 'Electronic music for your soul',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-10',
    name: 'Acoustic Sessions',
    description: 'Unplugged and intimate',
    image: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-11',
    name: 'Hip Hop Classics',
    description: 'Timeless hip hop tracks',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-12',
    name: 'Rock Revolution',
    description: 'Classic and modern rock',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-13',
    name: 'Pop Hits 2023',
    description: 'The biggest pop songs of 2023',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-14',
    name: 'Classical Focus',
    description: 'Classical music for concentration',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-15',
    name: 'Reggae Vibes',
    description: 'Laid back reggae rhythms',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-16',
    name: 'R&B Sensations',
    description: 'Smooth R&B tracks',
    image: 'https://images.unsplash.com/photo-1504898770365-14faca6a255f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-17',
    name: 'Country Roads',
    description: 'Country music favorites',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-18',
    name: 'Latin Beats',
    description: 'Hot Latin music',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-19',
    name: 'K-Pop Hits',
    description: 'The latest K-Pop sensations',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-20',
    name: 'Jazz Classics',
    description: 'Timeless jazz standards',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  },
  {
    id: 'playlist-21',
    name: 'Blues Journey',
    description: 'Deep blues tracks',
    image: 'https://images.unsplash.com/photo-1504898770365-14faca6a255f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    tracks: []
  }
];

// Mock albums
export const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'Summer Vibes',
    artist: 'Various Artists',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2023,
    tracks: []
  },
  {
    id: 'album-2',
    title: 'Midnight Dreams',
    artist: 'Nocturnal Sounds',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2022,
    tracks: []
  },
  {
    id: 'album-3',
    title: 'Electric Pulse',
    artist: 'Synth Masters',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2023,
    tracks: []
  },
  {
    id: 'album-4',
    title: 'Acoustic Sessions',
    artist: 'Unplugged Band',
    image: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2021,
    tracks: []
  },
  {
    id: 'album-5',
    title: 'Urban Beats',
    artist: 'City Sounds',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2022,
    tracks: []
  },
  {
    id: 'album-6',
    title: 'Retro Rewind',
    artist: 'Vintage Vibes',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2020,
    tracks: []
  },
  {
    id: 'album-7',
    title: 'Indie Mixtape',
    artist: 'Indie Collective',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2023,
    tracks: []
  },
  {
    id: 'album-8',
    title: 'Classical Essentials',
    artist: 'Symphony Orchestra',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    year: 2021,
    tracks: []
  }
];

// Mock tracks
export const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'Summer Breeze',
    artist: 'Ocean Waves',
    album: 'Summer Vibes',
    duration: 245,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'track-2',
    title: 'Midnight Drive',
    artist: 'Night Riders',
    album: 'Midnight Dreams',
    duration: 198,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'track-3',
    title: 'Electric Storm',
    artist: 'Synth Masters',
    album: 'Electric Pulse',
    duration: 210,
    cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'track-4',
    title: 'Acoustic Dreams',
    artist: 'Unplugged Band',
    album: 'Acoustic Sessions',
    duration: 267,
    cover: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'track-5',
    title: 'City Lights',
    artist: 'Urban Beats',
    album: 'Urban Beats',
    duration: 189,
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'track-6',
    title: 'Retro Funk',
    artist: 'Vintage Vibes',
    album: 'Retro Rewind',
    duration: 234,
    cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 'track-7',
    title: 'Indie Pop',
    artist: 'Indie Collective',
    album: 'Indie Mixtape',
    duration: 201,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'track-8',
    title: 'Classical Symphony',
    artist: 'Symphony Orchestra',
    album: 'Classical Essentials',
    duration: 320,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'track-9',
    title: 'Beach Waves',
    artist: 'Ocean Sounds',
    album: 'Summer Vibes',
    duration: 187,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: 'track-10',
    title: 'Night Drive',
    artist: 'City Cruisers',
    album: 'Midnight Dreams',
    duration: 215,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: 'track-11',
    title: 'Digital Dreams',
    artist: 'Synth Masters',
    album: 'Electric Pulse',
    duration: 192,
    cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'track-12',
    title: 'Guitar Strings',
    artist: 'Unplugged Band',
    album: 'Acoustic Sessions',
    duration: 245,
    cover: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'track-13',
    title: 'Urban Jungle',
    artist: 'City Sounds',
    album: 'Urban Beats',
    duration: 203,
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'track-14',
    title: 'Vintage Groove',
    artist: 'Vintage Vibes',
    album: 'Retro Rewind',
    duration: 178,
    cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'track-15',
    title: 'Indie Rock',
    artist: 'Indie Collective',
    album: 'Indie Mixtape',
    duration: 221,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 'track-16',
    title: 'Piano Melody',
    artist: 'Symphony Orchestra',
    album: 'Classical Essentials',
    duration: 289,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 'track-17',
    title: 'Sunset Chill',
    artist: 'Ocean Waves',
    album: 'Summer Vibes',
    duration: 195,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'track-18',
    title: 'Midnight City',
    artist: 'Night Riders',
    album: 'Midnight Dreams',
    duration: 212,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'track-19',
    title: 'Synth Wave',
    artist: 'Synth Masters',
    album: 'Electric Pulse',
    duration: 188,
    cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: 'track-20',
    title: 'Acoustic Journey',
    artist: 'Unplugged Band',
    album: 'Acoustic Sessions',
    duration: 256,
    cover: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: 'track-21',
    title: 'Urban Rhythm',
    artist: 'City Sounds',
    album: 'Urban Beats',
    duration: 207,
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'track-22',
    title: 'Retro Soul',
    artist: 'Vintage Vibes',
    album: 'Retro Rewind',
    duration: 194,
    cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  }
];
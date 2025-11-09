import { Playlist } from '../types/music';
import { mockTracks } from './tracks';

export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Liked Songs',
    description: 'Your favorite tracks',
    cover: 'https://placehold.co/300x300/1db954/ffffff?text=♥',
    tracks: mockTracks.slice(0, 5),
  },
  {
    id: '2',
    name: 'Chill Vibes',
    description: 'Relaxing tunes for your downtime',
    cover: 'https://placehold.co/300x300/5bcefa/ffffff?text=CV',
    tracks: mockTracks.slice(2, 7),
  },
  {
    id: '3',
    name: 'Workout Hits',
    description: 'High energy tracks for your workout',
    cover: 'https://placehold.co/300x300/ff6b6b/ffffff?text=WH',
    tracks: mockTracks.filter((_, index) => index % 2 === 0),
  },
  {
    id: '4',
    name: 'Road Trip',
    description: 'Perfect tracks for your journey',
    cover: 'https://placehold.co/300x300/ffd93d/ffffff?text=RT',
    tracks: mockTracks.filter((_, index) => index % 3 === 0),
  },
  {
    id: '5',
    name: 'Focus Flow',
    description: 'Concentration enhancing music',
    cover: 'https://placehold.co/300x300/a0a0a0/ffffff?text=FF',
    tracks: mockTracks.slice(1, 6),
  },
];
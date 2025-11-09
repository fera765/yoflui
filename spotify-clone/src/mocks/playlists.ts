export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  tracksCount: number;
  owner: string;
  followers: number;
  isPublic: boolean;
  isCollaborative: boolean;
  duration: string;
}

export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Chill Vibes',
    description: 'Relaxing tunes for your downtime',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=CV',
    tracksCount: 24,
    owner: 'Spotify',
    followers: 12500,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 32m'
  },
  {
    id: '2',
    name: 'Workout Energy',
    description: 'High energy tracks to fuel your workout',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=WE',
    tracksCount: 32,
    owner: 'Fitness Hub',
    followers: 8900,
    isPublic: true,
    isCollaborative: true,
    duration: '2h 15m'
  },
  {
    id: '3',
    name: 'Focus Flow',
    description: 'Concentration enhancing beats',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=FF',
    tracksCount: 18,
    owner: 'Productivity Pro',
    followers: 5600,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 10m'
  },
  {
    id: '4',
    name: 'Indie Mix',
    description: 'The best indie tracks of the moment',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=IM',
    tracksCount: 40,
    owner: 'Indie Central',
    followers: 21000,
    isPublic: true,
    isCollaborative: false,
    duration: '2h 45m'
  },
  {
    id: '5',
    name: 'Jazz Classics',
    description: 'Timeless jazz standards',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=JC',
    tracksCount: 28,
    owner: 'Jazz Archive',
    followers: 15400,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 58m'
  },
  {
    id: '6',
    name: 'Electronic Dreams',
    description: 'Electronic and synthwave for your soul',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=ED',
    tracksCount: 35,
    owner: 'Synthwave Collective',
    followers: 9800,
    isPublic: true,
    isCollaborative: true,
    duration: '2h 20m'
  },
  {
    id: '7',
    name: 'Rock Anthems',
    description: 'The greatest rock hits of all time',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=RA',
    tracksCount: 42,
    owner: 'Rock Legends',
    followers: 32000,
    isPublic: true,
    isCollaborative: false,
    duration: '2h 50m'
  },
  {
    id: '8',
    name: 'Hip Hop Essentials',
    description: 'Must-have hip hop tracks',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=HH',
    tracksCount: 30,
    owner: 'Hip Hop Central',
    followers: 18700,
    isPublic: true,
    isCollaborative: false,
    duration: '2h 5m'
  },
  {
    id: '9',
    name: 'Pop Hits 2023',
    description: 'The biggest pop hits of the year',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=PH',
    tracksCount: 25,
    owner: 'Pop Central',
    followers: 45000,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 38m'
  },
  {
    id: '10',
    name: 'Acoustic Sessions',
    description: 'Unplugged and intimate performances',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=AS',
    tracksCount: 22,
    owner: 'Acoustic Central',
    followers: 11200,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 25m'
  },
  {
    id: '11',
    name: 'Classical Relaxation',
    description: 'Soothing classical music for relaxation',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=CR',
    tracksCount: 19,
    owner: 'Classical Archive',
    followers: 7800,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 42m'
  },
  {
    id: '12',
    name: 'R&B Soul Mix',
    description: 'Smooth R&B and soul tracks',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=RB',
    tracksCount: 27,
    owner: 'Soul Central',
    followers: 13500,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 55m'
  },
  {
    id: '13',
    name: 'Country Roads',
    description: 'The best country hits',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=CR',
    tracksCount: 33,
    owner: 'Country Central',
    followers: 9200,
    isPublic: true,
    isCollaborative: false,
    duration: '2h 18m'
  },
  {
    id: '14',
    name: 'Reggae Vibes',
    description: 'Laid-back reggae rhythms',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=RV',
    tracksCount: 26,
    owner: 'Reggae Central',
    followers: 6700,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 48m'
  },
  {
    id: '15',
    name: 'K-Pop Essentials',
    description: 'The best K-Pop hits',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=KP',
    tracksCount: 29,
    owner: 'K-Pop Central',
    followers: 24500,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 52m'
  },
  {
    id: '16',
    name: 'Latin Rhythms',
    description: 'Hot Latin tracks',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=LR',
    tracksCount: 31,
    owner: 'Latin Central',
    followers: 16800,
    isPublic: true,
    isCollaborative: true,
    duration: '2h 8m'
  },
  {
    id: '17',
    name: 'Metal Thunder',
    description: 'Heavy metal classics',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=MT',
    tracksCount: 36,
    owner: 'Metal Central',
    followers: 14200,
    isPublic: true,
    isCollaborative: false,
    duration: '2h 35m'
  },
  {
    id: '18',
    name: 'Blues Journey',
    description: 'Deep blues tracks',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=BJ',
    tracksCount: 23,
    owner: 'Blues Central',
    followers: 8900,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 38m'
  },
  {
    id: '19',
    name: 'Folk Stories',
    description: 'Narrative folk music',
    coverImage: 'https://placehold.co/300x300/1DB954/FFFFFF?text=FS',
    tracksCount: 20,
    owner: 'Folk Central',
    followers: 7600,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 22m'
  },
  {
    id: '20',
    name: 'Ambient Soundscapes',
    description: 'Atmospheric ambient music',
    coverImage: 'https://placehold.co/300x300/1ED760/FFFFFF?text=AS',
    tracksCount: 17,
    owner: 'Ambient Central',
    followers: 10300,
    isPublic: true,
    isCollaborative: false,
    duration: '1h 15m'
  }
];
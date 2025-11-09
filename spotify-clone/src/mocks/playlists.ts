export interface Playlist {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  description: string;
  tracks: number;
}

export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    title: 'Top Hits 2023',
    artist: 'Various Artists',
    coverImage: 'https://placehold.co/300x300/1db954/ffffff?text=Top+Hits',
    description: 'The biggest hits of 2023 in one place',
    tracks: 50
  },
  {
    id: '2',
    title: 'Chill Vibes',
    artist: 'Relaxing Tunes',
    coverImage: 'https://placehold.co/300x300/5e5e5e/ffffff?text=Chill+Vibes',
    description: 'Perfect for relaxing and unwinding',
    tracks: 30
  },
  {
    id: '3',
    title: 'Workout Energy',
    artist: 'Fitness Beats',
    coverImage: 'https://placehold.co/300x300/ff3c4e/ffffff?text=Workout',
    description: 'High energy tracks for your workout sessions',
    tracks: 40
  },
  {
    id: '4',
    title: 'Indie Discoveries',
    artist: 'Indie Scene',
    coverImage: 'https://placehold.co/300x300/9b59b6/ffffff?text=Indie',
    description: 'Fresh indie tracks you need to hear',
    tracks: 35
  },
  {
    id: '5',
    title: 'Jazz Classics',
    artist: 'Jazz Legends',
    coverImage: 'https://placehold.co/300x300/8b4513/ffffff?text=Jazz',
    description: 'Timeless jazz classics for sophisticated listening',
    tracks: 45
  },
  {
    id: '6',
    title: 'Electronic Dreams',
    artist: 'EDM Masters',
    coverImage: 'https://placehold.co/300x300/00bfff/ffffff?text=Electronic',
    description: 'The best electronic music for your journey',
    tracks: 55
  },
  {
    id: '7',
    title: 'Rock Anthems',
    artist: 'Rock Icons',
    coverImage: 'https://placehold.co/300x300/800000/ffffff?text=Rock',
    description: 'Legendary rock anthems that defined generations',
    tracks: 60
  },
  {
    id: '8',
    title: 'Pop Sensations',
    artist: 'Pop Royalty',
    coverImage: 'https://placehold.co/300x300/ff69b4/ffffff?text=Pop',
    description: 'The most popular pop hits of the moment',
    tracks: 42
  },
  {
    id: '9',
    title: 'Hip Hop Essentials',
    artist: 'Rap Legends',
    coverImage: 'https://placehold.co/300x300/000000/ffffff?text=Hip+Hop',
    description: 'Essential hip hop tracks for your collection',
    tracks: 48
  },
  {
    id: '10',
    title: 'Classical Masterpieces',
    artist: 'Orchestra Masters',
    coverImage: 'https://placehold.co/300x300/f5f5dc/000000?text=Classical',
    description: 'Timeless classical compositions',
    tracks: 38
  },
  {
    id: '11',
    title: 'Country Roads',
    artist: 'Country Stars',
    coverImage: 'https://placehold.co/300x300/d2b48c/000000?text=Country',
    description: 'The best country music for your soul',
    tracks: 33
  },
  {
    id: '12',
    title: 'Reggae Vibes',
    artist: 'Island Sounds',
    coverImage: 'https://placehold.co/300x300/32cd32/ffffff?text=Reggae',
    description: 'Laid back reggae rhythms for good times',
    tracks: 28
  },
  {
    id: '13',
    title: 'R&B Soul',
    artist: 'Soul Legends',
    coverImage: 'https://placehold.co/300x300/800080/ffffff?text=R%26B',
    description: 'Smooth R&B and soul tracks for your ears',
    tracks: 37
  },
  {
    id: '14',
    title: 'Latin Flavors',
    artist: 'Latin Artists',
    coverImage: 'https://placehold.co/300x300/ff4500/ffffff?text=Latin',
    description: 'Hot Latin rhythms and melodies',
    tracks: 44
  },
  {
    id: '15',
    title: 'K-Pop Hits',
    artist: 'Korean Wave',
    coverImage: 'https://placehold.co/300x300/ff1493/ffffff?text=K-Pop',
    description: 'The latest and greatest K-Pop sensations',
    tracks: 39
  },
  {
    id: '16',
    title: 'Folk Stories',
    artist: 'Folk Musicians',
    coverImage: 'https://placehold.co/300x300/deb887/000000?text=Folk',
    description: 'Traditional and contemporary folk music',
    tracks: 31
  },
  {
    id: '17',
    title: 'Blues Journey',
    artist: 'Blues Masters',
    coverImage: 'https://placehold.co/300x300/000080/ffffff?text=Blues',
    description: 'Deep blues tracks for your soul',
    tracks: 29
  },
  {
    id: '18',
    title: 'Metal Thunder',
    artist: 'Metal Bands',
    coverImage: 'https://placehold.co/300x300/2f4f4f/ffffff?text=Metal',
    description: 'Heavy metal tracks that pack a punch',
    tracks: 52
  },
  {
    id: '19',
    title: 'Ambient Sounds',
    artist: 'Ambient Artists',
    coverImage: 'https://placehold.co/300x300/4682b4/ffffff?text=Ambient',
    description: 'Atmospheric sounds for focus and relaxation',
    tracks: 25
  },
  {
    id: '20',
    title: 'Funk Grooves',
    artist: 'Funk Masters',
    coverImage: 'https://placehold.co/300x300/ff6347/ffffff?text=Funk',
    description: 'Groovy funk tracks to get you moving',
    tracks: 36
  }
];
export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  songs: Song[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverImage: string;
  audioUrl: string;
  genre: string;
  releaseYear: number;
}

export const mockSongs: Song[] = [
  {
    id: 'song-1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 355,
    coverImage: 'https://via.placeholder.com/300x300?text=Queen',
    audioUrl: 'https://example.com/songs/bohemian_rhapsody.mp3',
    genre: 'Rock',
    releaseYear: 1975
  },
  {
    id: 'song-2',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 203,
    coverImage: 'https://via.placeholder.com/300x300?text=The+Weeknd',
    audioUrl: 'https://example.com/songs/blinding_lights.mp3',
    genre: 'Pop',
    releaseYear: 2020
  },
  {
    id: 'song-3',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 233,
    coverImage: 'https://via.placeholder.com/300x300?text=Ed+Sheeran',
    audioUrl: 'https://example.com/songs/shape_of_you.mp3',
    genre: 'Pop',
    releaseYear: 2017
  },
  {
    id: 'song-4',
    title: 'Dance Monkey',
    artist: 'Tones and I',
    album: 'The Kids Are Coming',
    duration: 209,
    coverImage: 'https://via.placeholder.com/300x300?text=Tones+and+I',
    audioUrl: 'https://example.com/songs/dance_monkey.mp3',
    genre: 'Pop',
    releaseYear: 2019
  },
  {
    id: 'song-5',
    title: 'Smooth',
    artist: 'Santana ft. Rob Thomas',
    album: 'Supernatural',
    duration: 298,
    coverImage: 'https://via.placeholder.com/300x300?text=Santana',
    audioUrl: 'https://example.com/songs/smooth.mp3',
    genre: 'Rock',
    releaseYear: 1999
  },
  {
    id: 'song-6',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    album: 'Uptown Special',
    duration: 270,
    coverImage: 'https://via.placeholder.com/300x300?text=Mark+Ronson',
    audioUrl: 'https://example.com/songs/uptown_funk.mp3',
    genre: 'Funk',
    releaseYear: 2014
  },
  {
    id: 'song-7',
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21',
    duration: 285,
    coverImage: 'https://via.placeholder.com/300x300?text=Adele',
    audioUrl: 'https://example.com/songs/someone_like_you.mp3',
    genre: 'Pop',
    releaseYear: 2011
  },
  {
    id: 'song-8',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    album: '21',
    duration: 228,
    coverImage: 'https://via.placeholder.com/300x300?text=Adele',
    audioUrl: 'https://example.com/songs/rolling_in_the_deep.mp3',
    genre: 'Pop',
    releaseYear: 2010
  },
  {
    id: 'song-9',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    album: 'When We All Fall Asleep, Where Do We Go?',
    duration: 194,
    coverImage: 'https://via.placeholder.com/300x300?text=Billie+Eilish',
    audioUrl: 'https://example.com/songs/bad_guy.mp3',
    genre: 'Pop',
    releaseYear: 2019
  },
  {
    id: 'song-10',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    duration: 174,
    coverImage: 'https://via.placeholder.com/300x300?text=Harry+Styles',
    audioUrl: 'https://example.com/songs/watermelon_sugar.mp3',
    genre: 'Pop',
    releaseYear: 2019
  },
  {
    id: 'song-11',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 203,
    coverImage: 'https://via.placeholder.com/300x300?text=Dua+Lipa',
    audioUrl: 'https://example.com/songs/levitating.mp3',
    genre: 'Pop',
    releaseYear: 2020
  },
  {
    id: 'song-12',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 203,
    coverImage: 'https://via.placeholder.com/300x300?text=The+Weeknd',
    audioUrl: 'https://example.com/songs/blinding_lights_alt.mp3',
    genre: 'R&B',
    releaseYear: 2020
  },
  {
    id: 'song-13',
    title: 'Don\'t Start Now',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 183,
    coverImage: 'https://via.placeholder.com/300x300?text=Dua+Lipa',
    audioUrl: 'https://example.com/songs/dont_start_now.mp3',
    genre: 'Pop',
    releaseYear: 2019
  },
  {
    id: 'song-14',
    title: 'Shallow',
    artist: 'Lady Gaga & Bradley Cooper',
    album: 'A Star Is Born Soundtrack',
    duration: 215,
    coverImage: 'https://via.placeholder.com/300x300?text=Lady+Gaga',
    audioUrl: 'https://example.com/songs/shallow.mp3',
    genre: 'Pop',
    releaseYear: 2018
  },
  {
    id: 'song-15',
    title: 'Old Town Road',
    artist: 'Lil Nas X ft. Billy Ray Cyrus',
    album: '7',
    duration: 157,
    coverImage: 'https://via.placeholder.com/300x300?text=Lil+Nas+X',
    audioUrl: 'https://example.com/songs/old_town_road.mp3',
    genre: 'Hip-Hop',
    releaseYear: 2019
  }
];

export const mockPlaylists: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Top Hits 2023',
    description: 'The most popular songs of 2023',
    coverImage: 'https://via.placeholder.com/300x300?text=Top+Hits',
    songs: [mockSongs[0], mockSongs[1], mockSongs[2]],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-10-15')
  },
  {
    id: 'playlist-2',
    name: 'Rock Classics',
    description: 'Timeless rock songs that never get old',
    coverImage: 'https://via.placeholder.com/300x300?text=Rock+Classics',
    songs: [mockSongs[0], mockSongs[4], mockSongs[8]],
    createdAt: new Date('2022-05-10'),
    updatedAt: new Date('2023-09-20')
  },
  {
    id: 'playlist-3',
    name: 'Chill Vibes',
    description: 'Perfect for relaxing and unwinding',
    coverImage: 'https://via.placeholder.com/300x300?text=Chill+Vibes',
    songs: [mockSongs[6], mockSongs[9], mockSongs[10]],
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2023-10-10')
  },
  {
    id: 'playlist-4',
    name: 'Workout Mix',
    description: 'High energy tracks for your workout',
    coverImage: 'https://via.placeholder.com/300x300?text=Workout+Mix',
    songs: [mockSongs[1], mockSongs[5], mockSongs[12]],
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-10-05')
  },
  {
    id: 'playlist-5',
    name: 'Pop Sensations',
    description: 'The biggest pop hits of the decade',
    coverImage: 'https://via.placeholder.com/300x300?text=Pop+Sensations',
    songs: [mockSongs[1], mockSongs[2], mockSongs[3], mockSongs[9]],
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2023-10-12')
  },
  {
    id: 'playlist-6',
    name: 'Throwback Hits',
    description: 'Nostalgic songs from the 90s and early 2000s',
    coverImage: 'https://via.placeholder.com/300x300?text=Throwback+Hits',
    songs: [mockSongs[4], mockSongs[7], mockSongs[13]],
    createdAt: new Date('2022-11-30'),
    updatedAt: new Date('2023-09-15')
  },
  {
    id: 'playlist-7',
    name: 'Indie Favorites',
    description: 'Indie tracks that deserve more recognition',
    coverImage: 'https://via.placeholder.com/300x300?text=Indie+Favorites',
    songs: [mockSongs[8], mockSongs[10], mockSongs[14]],
    createdAt: new Date('2023-06-18'),
    updatedAt: new Date('2023-10-08')
  },
  {
    id: 'playlist-8',
    name: 'R&B Grooves',
    description: 'Smooth R&B tracks for any occasion',
    coverImage: 'https://via.placeholder.com/300x300?text=R&B+Grooves',
    songs: [mockSongs[11], mockSongs[13], mockSongs[6]],
    createdAt: new Date('2023-07-22'),
    updatedAt: new Date('2023-10-01')
  },
  {
    id: 'playlist-9',
    name: 'Hip-Hop Essentials',
    description: 'Must-have hip-hop tracks',
    coverImage: 'https://via.placeholder.com/300x300?text=Hip-Hop+Essentials',
    songs: [mockSongs[14], mockSongs[5], mockSongs[0]],
    createdAt: new Date('2023-01-30'),
    updatedAt: new Date('2023-09-25')
  },
  {
    id: 'playlist-10',
    name: 'Acoustic Sessions',
    description: 'Unplugged versions of popular songs',
    coverImage: 'https://via.placeholder.com/300x300?text=Acoustic+Sessions',
    songs: [mockSongs[6], mockSongs[7], mockSongs[2]],
    createdAt: new Date('2023-05-05'),
    updatedAt: new Date('2023-09-30')
  },
  {
    id: 'playlist-11',
    name: 'Electronic Dance',
    description: 'Electronic tracks to get you moving',
    coverImage: 'https://via.placeholder.com/300x300?text=Electronic+Dance',
    songs: [mockSongs[3], mockSongs[10], mockSongs[12]],
    createdAt: new Date('2023-08-14'),
    updatedAt: new Date('2023-10-14')
  },
  {
    id: 'playlist-12',
    name: 'Jazz Classics',
    description: 'Timeless jazz standards',
    coverImage: 'https://via.placeholder.com/300x300?text=Jazz+Classics',
    songs: [mockSongs[9], mockSongs[1], mockSongs[4]],
    createdAt: new Date('2022-12-12'),
    updatedAt: new Date('2023-09-18')
  },
  {
    id: 'playlist-13',
    name: 'Country Roads',
    description: 'Country songs for the open road',
    coverImage: 'https://via.placeholder.com/300x300?text=Country+Roads',
    songs: [mockSongs[13], mockSongs[2], mockSongs[5]],
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-10-03')
  },
  {
    id: 'playlist-14',
    name: 'Alternative Rock',
    description: 'Alternative rock gems',
    coverImage: 'https://via.placeholder.com/300x300?text=Alternative+Rock',
    songs: [mockSongs[0], mockSongs[8], mockSongs[11]],
    createdAt: new Date('2023-04-25'),
    updatedAt: new Date('2023-09-28')
  },
  {
    id: 'playlist-15',
    name: 'Love Songs',
    description: 'Perfect for romantic moments',
    coverImage: 'https://via.placeholder.com/300x300?text=Love+Songs',
    songs: [mockSongs[6], mockSongs[7], mockSongs[13]],
    createdAt: new Date('2023-02-14'),
    updatedAt: new Date('2023-10-11')
  },
  {
    id: 'playlist-16',
    name: 'Summer Hits',
    description: 'Songs that define summer',
    coverImage: 'https://via.placeholder.com/300x300?text=Summer+Hits',
    songs: [mockSongs[1], mockSongs[3], mockSongs[9], mockSongs[12]],
    createdAt: new Date('2023-06-21'),
    updatedAt: new Date('2023-09-22')
  },
  {
    id: 'playlist-17',
    name: 'Motivational Mix',
    description: 'Songs to inspire and motivate',
    coverImage: 'https://via.placeholder.com/300x300?text=Motivational+Mix',
    songs: [mockSongs[5], mockSongs[10], mockSongs[14]],
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-10-07')
  },
  {
    id: 'playlist-18',
    name: 'Retro Rewind',
    description: 'Songs from the 70s, 80s, and 90s',
    coverImage: 'https://via.placeholder.com/300x300?text=Retro+Rewind',
    songs: [mockSongs[0], mockSongs[4], mockSongs[7], mockSongs[13]],
    createdAt: new Date('2022-10-10'),
    updatedAt: new Date('2023-09-27')
  },
  {
    id: 'playlist-19',
    name: 'Focus Flow',
    description: 'Instrumental tracks for concentration',
    coverImage: 'https://via.placeholder.com/300x300?text=Focus+Flow',
    songs: [mockSongs[2], mockSongs[6], mockSongs[11]],
    createdAt: new Date('2023-07-01'),
    updatedAt: new Date('2023-10-09')
  },
  {
    id: 'playlist-20',
    name: 'Late Night Vibes',
    description: 'Perfect for those late night sessions',
    coverImage: 'https://via.placeholder.com/300x300?text=Late+Night+Vibes',
    songs: [mockSongs[8], mockSongs[10], mockSongs[12], mockSongs[14]],
    createdAt: new Date('2023-08-30'),
    updatedAt: new Date('2023-10-13')
  }
];
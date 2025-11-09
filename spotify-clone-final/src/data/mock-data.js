const mockPlaylists = [
  {
    id: 1,
    name: "Pop Hits",
    description: "The biggest pop hits of the moment",
    coverImage: "https://via.placeholder.com/300x300/ff6b6b/ffffff?text=Pop+Hits",
    songs: []
  },
  {
    id: 2,
    name: "Chill Vibes",
    description: "Perfect for relaxing and studying",
    coverImage: "https://via.placeholder.com/300x300/4ecdc4/ffffff?text=Chill+Vibes",
    songs: []
  },
  {
    id: 3,
    name: "Workout Mix",
    description: "High energy tracks for your workout",
    coverImage: "https://via.placeholder.com/300x300/45b7d1/ffffff?text=Workout+Mix",
    songs: []
  },
  {
    id: 4,
    name: "Indie Favorites",
    description: "The best indie tracks from around the world",
    coverImage: "https://via.placeholder.com/300x300/f9ca24/ffffff?text=Indie+Favorites",
    songs: []
  },
  {
    id: 5,
    name: "Jazz Classics",
    description: "Timeless jazz standards",
    coverImage: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Jazz+Classics",
    songs: []
  },
  {
    id: 6,
    name: "Rock Anthems",
    description: "The greatest rock songs of all time",
    coverImage: "https://via.placeholder.com/300x300/a55eea/ffffff?text=Rock+Anthems",
    songs: []
  },
  {
    id: 7,
    name: "Electronic Dance",
    description: "The best EDM tracks for dancing",
    coverImage: "https://via.placeholder.com/300x300/26de81/ffffff?text=Electronic+Dance",
    songs: []
  },
  {
    id: 8,
    name: "Hip Hop Essentials",
    description: "Must-have hip hop tracks",
    coverImage: "https://via.placeholder.com/300x300/fd79a8/ffffff?text=Hip+Hop+Essentials",
    songs: []
  },
  {
    id: 9,
    name: "Classical Masterpieces",
    description: "The greatest classical compositions",
    coverImage: "https://via.placeholder.com/300x300/fdcb6e/ffffff?text=Classical+Masterpieces",
    songs: []
  },
  {
    id: 10,
    name: "R&B Soul",
    description: "Smooth R&B and soul tracks",
    coverImage: "https://via.placeholder.com/300x300/e17055/ffffff?text=R%26B+Soul",
    songs: []
  },
  {
    id: 11,
    name: "Country Roads",
    description: "The best country music hits",
    coverImage: "https://via.placeholder.com/300x300/00b894/ffffff?text=Country+Roads",
    songs: []
  },
  {
    id: 12,
    name: "Reggae Vibes",
    description: "Laid-back reggae rhythms",
    coverImage: "https://via.placeholder.com/300x300/0984e3/ffffff?text=Reggae+Vibes",
    songs: []
  },
  {
    id: 13,
    name: "Metal Thunder",
    description: "Heavy metal classics",
    coverImage: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Metal+Thunder",
    songs: []
  },
  {
    id: 14,
    name: "Folk Stories",
    description: "Traditional and contemporary folk",
    coverImage: "https://via.placeholder.com/300x300/ffeaa7/ffffff?text=Folk+Stories",
    songs: []
  },
  {
    id: 15,
    name: "Blues Expressions",
    description: "Deep blues emotions",
    coverImage: "https://via.placeholder.com/300x300/74b9ff/ffffff?text=Blues+Expressions",
    songs: []
  },
  {
    id: 16,
    name: "Latin Rhythms",
    description: "Salsa, reggaeton, and more",
    coverImage: "https://via.placeholder.com/300x300/e17055/ffffff?text=Latin+Rhythms",
    songs: []
  },
  {
    id: 17,
    name: "K-Pop Sensations",
    description: "The hottest K-pop tracks",
    coverImage: "https://via.placeholder.com/300x300/fd79a8/ffffff?text=K-Pop+Sensations",
    songs: []
  },
  {
    id: 18,
    name: "Retro Rewind",
    description: "Classic hits from the 70s, 80s, and 90s",
    coverImage: "https://via.placeholder.com/300x300/fdcb6e/ffffff?text=Retro+Rewind",
    songs: []
  },
  {
    id: 19,
    name: "Acoustic Sessions",
    description: "Unplugged and intimate performances",
    coverImage: "https://via.placeholder.com/300x300/00b894/ffffff?text=Acoustic+Sessions",
    songs: []
  },
  {
    id: 20,
    name: "Focus Flow",
    description: "Instrumental tracks for concentration",
    coverImage: "https://via.placeholder.com/300x300/74b9ff/ffffff?text=Focus+Flow",
    songs: []
  }
];

const mockSongs = [
  {
    id: 1,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    coverImage: "https://via.placeholder.com/300x300/ff6b6b/ffffff?text=Blinding+Lights",
    audioUrl: "/audio/blinding-lights.mp3"
  },
  {
    id: 2,
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    duration: "2:54",
    coverImage: "https://via.placeholder.com/300x300/4ecdc4/ffffff?text=Watermelon+Sugar",
    audioUrl: "/audio/watermelon-sugar.mp3"
  },
  {
    id: 3,
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: "3:23",
    coverImage: "https://via.placeholder.com/300x300/45b7d1/ffffff?text=Levitating",
    audioUrl: "/audio/levitating.mp3"
  },
  {
    id: 4,
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    duration: "2:58",
    coverImage: "https://via.placeholder.com/300x300/f9ca24/ffffff?text=Good+4+U",
    audioUrl: "/audio/good-4-u.mp3"
  },
  {
    id: 5,
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    album: "F*CK LOVE 3",
    duration: "2:21",
    coverImage: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Stay",
    audioUrl: "/audio/stay.mp3"
  },
  {
    id: 6,
    title: "Peaches",
    artist: "Justin Bieber",
    album: "Justice",
    duration: "3:18",
    coverImage: "https://via.placeholder.com/300x300/a55eea/ffffff?text=Peaches",
    audioUrl: "/audio/peaches.mp3"
  },
  {
    id: 7,
    title: "Montero",
    artist: "Lil Nas X",
    album: "Montero",
    duration: "2:17",
    coverImage: "https://via.placeholder.com/300x300/26de81/ffffff?text=Montero",
    audioUrl: "/audio/montero.mp3"
  },
  {
    id: 8,
    title: "Kiss Me More",
    artist: "Doja Cat ft. SZA",
    album: "Planet Her",
    duration: "3:28",
    coverImage: "https://via.placeholder.com/300x300/fd79a8/ffffff?text=Kiss+Me+More",
    audioUrl: "/audio/kiss-me-more.mp3"
  },
  {
    id: 9,
    title: "Butter",
    artist: "BTS",
    album: "Butter",
    duration: "2:42",
    coverImage: "https://via.placeholder.com/300x300/fdcb6e/ffffff?text=Butter",
    audioUrl: "/audio/butter.mp3"
  },
  {
    id: 10,
    title: "Deja Vu",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    duration: "3:35",
    coverImage: "https://via.placeholder.com/300x300/e17055/ffffff?text=Deja+Vu",
    audioUrl: "/audio/deja-vu.mp3"
  },
  {
    id: 11,
    title: "Heat Waves",
    artist: "Glass Animals",
    album: "Dreamland",
    duration: "3:58",
    coverImage: "https://via.placeholder.com/300x300/00b894/ffffff?text=Heat+Waves",
    audioUrl: "/audio/heat-waves.mp3"
  },
  {
    id: 12,
    title: "Industry Baby",
    artist: "Lil Nas X & Jack Harlow",
    album: "Montero",
    duration: "3:32",
    coverImage: "https://via.placeholder.com/300x300/0984e3/ffffff?text=Industry+Baby",
    audioUrl: "/audio/industry-baby.mp3"
  },
  {
    id: 13,
    title: "Take My Breath",
    artist: "The Weeknd",
    album: "Dawn FM",
    duration: "3:42",
    coverImage: "https://via.placeholder.com/300x300/6c5ce7/ffffff?text=Take+My+Breath",
    audioUrl: "/audio/take-my-breath.mp3"
  },
  {
    id: 14,
    title: "Fancy Like",
    artist: "Walker Hayes",
    album: "Fancy Like",
    duration: "2:34",
    coverImage: "https://via.placeholder.com/300x300/ffeaa7/ffffff?text=Fancy+Like",
    audioUrl: "/audio/fancy-like.mp3"
  },
  {
    id: 15,
    title: "Shivers",
    artist: "Ed Sheeran",
    album: "=",
    duration: "3:28",
    coverImage: "https://via.placeholder.com/300x300/74b9ff/ffffff?text=Shivers",
    audioUrl: "/audio/shivers.mp3"
  }
];

// Assign random songs to each playlist
mockPlaylists.forEach(playlist => {
  // Each playlist gets between 3-8 random songs
  const songCount = Math.floor(Math.random() * 6) + 3;
  const shuffledSongs = [...mockSongs].sort(() => 0.5 - Math.random());
  playlist.songs = shuffledSongs.slice(0, songCount);
});

export { mockPlaylists, mockSongs };
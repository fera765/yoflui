import React from 'react';

interface CardProps {
  title: string;
  subtitle: string;
  image: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, image }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition cursor-pointer min-w-[180px]">
      <img src={image} alt={title} className="w-full aspect-square object-cover rounded-md mb-4" />
      <h3 className="font-semibold text-white truncate">{title}</h3>
      <p className="text-gray-400 text-sm truncate">{subtitle}</p>
    </div>
  );
};

const MainContent: React.FC = () => {
  // Mock data for featured content
  const featuredPlaylists = [
    { id: 1, title: 'Today\'s Top Hits', subtitle: 'The most played songs right now', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Top+Hits' },
    { id: 2, title: 'RapCaviar', subtitle: 'New music from Drake, Travis Scott and more', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=RapCaviar' },
    { id: 3, title: 'All Out 2010s', subtitle: 'The biggest songs of the 2010s', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=2010s' },
    { id: 4, title: 'Rock Classics', subtitle: 'Rock legends & epic songs', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Rock' },
    { id: 5, title: 'Chill Hits', subtitle: 'Kick back to the best new and recent chill hits', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Chill' },
    { id: 6, title: 'Viva Latino', subtitle: 'Today\'s top Latin hits', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Latino' },
  ];

  const recentlyPlayed = [
    { id: 1, title: 'Liked Songs', subtitle: 'Your favorite songs', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Liked' },
    { id: 2, title: 'Discover Weekly', subtitle: 'Your weekly mixtape of fresh music', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Discover' },
    { id: 3, title: 'Release Radar', subtitle: 'Catch all the latest music', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Releases' },
    { id: 4, title: 'Daily Mix 1', subtitle: 'A mix of songs you love', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Mix+1' },
  ];

  const artists = [
    { id: 1, title: 'Taylor Swift', subtitle: 'Artist', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Taylor' },
    { id: 2, title: 'Drake', subtitle: 'Artist', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Drake' },
    { id: 3, title: 'Billie Eilish', subtitle: 'Artist', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Billie' },
    { id: 4, title: 'Ed Sheeran', subtitle: 'Artist', image: 'https://placehold.co/300x300/1DB954/FFFFFF?text=Ed' },
  ];

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto">
      <div className="p-6">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Good evening</h1>
          
          {/* Featured playlists horizontal scroll */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Made for you</h2>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {featuredPlaylists.map(playlist => (
                <Card 
                  key={playlist.id} 
                  title={playlist.title} 
                  subtitle={playlist.subtitle} 
                  image={playlist.image} 
                />
              ))}
            </div>
          </div>
          
          {/* Recently played */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recently played</h2>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {recentlyPlayed.map(item => (
                <Card 
                  key={item.id} 
                  title={item.title} 
                  subtitle={item.subtitle} 
                  image={item.image} 
                />
              ))}
            </div>
          </div>
          
          {/* Popular artists */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Popular artists</h2>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {artists.map(artist => (
                <Card 
                  key={artist.id} 
                  title={artist.title} 
                  subtitle={artist.subtitle} 
                  image={artist.image} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
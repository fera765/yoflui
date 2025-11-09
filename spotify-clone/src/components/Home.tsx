import React from 'react';
import PlaylistCard from '../components/PlaylistCard';

const Home = () => {
  // Mock data for playlists
  const playlists = [
    { id: 1, title: 'Pop Hits', description: 'The latest pop hits' },
    { id: 2, title: 'Rock Classics', description: 'Timeless rock songs' },
    { id: 3, title: 'Jazz Lounge', description: 'Smooth jazz for relaxing' },
    { id: 4, title: 'Workout Mix', description: 'High energy tracks' },
  ];

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Good afternoon</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {playlists.map(playlist => (
          <PlaylistCard 
            key={playlist.id} 
            title={playlist.title} 
            description={playlist.description} 
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
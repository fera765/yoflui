import React from 'react';
import { useUser } from '../contexts/UserContext';
import PlaylistCard from '../components/PlaylistCard';

const Home: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Good evening</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Made for you</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {user?.playlists.slice(0, 5).map(playlist => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Recently played</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {user?.playlists.slice(5, 10).map(playlist => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
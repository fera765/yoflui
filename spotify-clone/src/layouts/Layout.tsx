import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Player from '../components/Player';
import PlaylistCard from '../components/PlaylistCard';
import { mockPlaylists } from '../__mocks__/mockData';
import '../styles/globals.css';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Your Library</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  title={playlist.title}
                  description={playlist.description}
                  image={playlist.image}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
      <Player />
    </div>
  );
};

export default Layout;
import React from 'react';
import mockPlaylists from '../data/mockData';

const PlaylistCards = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Your Playlists</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {mockPlaylists.map((playlist) => (
          <div 
            key={playlist.id} 
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition cursor-pointer group"
          >
            <div className="relative mb-4">
              <img 
                src={playlist.image} 
                alt={playlist.name} 
                className="w-full aspect-square object-cover rounded"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded flex items-center justify-center transition">
                <button className="w-12 h-12 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center transform translate-y-2 group-hover:translate-y-0">
                  <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            </div>
            <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
            <p className="text-gray-400 text-sm mt-1 truncate">{playlist.description}</p>
            <p className="text-gray-400 text-xs mt-1">{playlist.owner}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistCards;
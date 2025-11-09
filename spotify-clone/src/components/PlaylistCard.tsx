import React from 'react';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
      style={{ minHeight: '200px' }}
    >
      <div className="relative overflow-hidden rounded-md mb-3">
        <img 
          src={playlist.image} 
          alt={playlist.name} 
          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button className="bg-green-500 text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
      <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
      <p className="text-gray-400 text-sm truncate">{playlist.description}</p>
    </div>
  );
};

export default PlaylistCard;
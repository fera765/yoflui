import React from 'react';
import { HomeIcon, SearchIcon, LibraryIcon, PlusCircleIcon, HeartIcon, PlayIcon } from '@heroicons/react/outline';

const Sidebar = () => {
  return (
    <div className="hidden md:flex flex-col space-y-4 p-4 bg-black text-white w-64">
      {/* Logo */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Spotify Clone</h1>
      </div>

      {/* Menu Principal */}
      <div className="space-y-2">
        <button className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <HomeIcon className="h-5 w-5" />
          <span>Início</span>
        </button>
        <button className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <SearchIcon className="h-5 w-5" />
          <span>Buscar</span>
        </button>
        <button className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <LibraryIcon className="h-5 w-5" />
          <span>Sua Biblioteca</span>
        </button>
      </div>

      {/* Playlists */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <button className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <PlusCircleIcon className="h-5 w-5" />
            <span>Criar playlist</span>
          </button>
        </div>
        
        <div className="space-y-1">
          <button className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <HeartIcon className="h-5 w-5" />
            <span>Músicas Curtidas</span>
          </button>
          <button className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <PlayIcon className="h-5 w-5" />
            <span>Músicas Curtidas</span>
          </button>
        </div>
      </div>

      {/* Lista de Playlists */}
      <div className="mt-4 overflow-y-auto flex-grow">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Playlists</h3>
          {[...Array(10)].map((_, i) => (
            <button 
              key={i} 
              className="block w-full text-left p-2 rounded-lg hover:bg-gray-800 transition-colors truncate"
            >
              Playlist {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
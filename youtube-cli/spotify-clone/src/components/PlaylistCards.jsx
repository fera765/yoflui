import React from 'react';
import { playlists } from '../data/mockData';

const PlaylistCards = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Boas vindas</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Crie sua primeira playlist</h3>
        <p className="text-gray-400 mb-6">
          É fácil, vamos te ajudar.
        </p>
        <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-opacity-80">
          Criar playlist
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Músicas Curtidas</h3>
        <p className="text-gray-400 mb-6">
          Clique em "Curtir" nas músicas que você ouvir para adicioná-las aqui.
        </p>
        <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-opacity-80">
          Curtir músicas
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-6">Feito para você</h3>
        <div className="playlist-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {playlists.slice(0, 6).map((playlist, index) => (
            <div 
              key={index} 
              className="bg-gray-800 bg-opacity-60 hover:bg-opacity-70 rounded-lg p-4 cursor-pointer transition-all duration-200 transform hover:scale-105"
            >
              <img 
                src={playlist.image} 
                alt={playlist.name} 
                className="w-full aspect-square object-cover rounded-md mb-4"
              />
              <h4 className="font-semibold text-white mb-2 truncate">{playlist.name}</h4>
              <p className="text-sm text-gray-400 line-clamp-2">{playlist.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-6">Tocadas recentemente</h3>
        <div className="playlist-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {playlists.slice(6, 12).map((playlist, index) => (
            <div 
              key={index} 
              className="bg-gray-800 bg-opacity-60 hover:bg-opacity-70 rounded-lg p-4 cursor-pointer transition-all duration-200 transform hover:scale-105"
            >
              <img 
                src={playlist.image} 
                alt={playlist.name} 
                className="w-full aspect-square object-cover rounded-md mb-4"
              />
              <h4 className="font-semibold text-white mb-2 truncate">{playlist.name}</h4>
              <p className="text-sm text-gray-400 line-clamp-2">{playlist.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistCards;
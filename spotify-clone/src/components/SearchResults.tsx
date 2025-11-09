import React, { useState, useEffect } from 'react';
import { mockData } from '../__mocks__/mockData';
import TrackItem from './TrackItem';

const SearchResults: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('tracks');

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTracks([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = mockData.tracks.filter(track => 
      track.title.toLowerCase().includes(query) || 
      track.artist.toLowerCase().includes(query) ||
      track.album.toLowerCase().includes(query)
    );

    setFilteredTracks(results);
  }, [searchQuery]);

  const handlePlayTrack = (track: any) => {
    // Aqui você pode implementar a lógica para tocar a música
    console.log('Tocando:', track);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Resultados da pesquisa</h1>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="O que você quer ouvir?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md bg-black/20 border border-gray-700 rounded-full px-6 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
        />
      </div>

      {searchQuery && (
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-800">
            <button
              className={`pb-3 px-1 font-semibold ${activeTab === 'tracks' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('tracks')}
            >
              Músicas
            </button>
            <button
              className={`pb-3 px-1 font-semibold ${activeTab === 'artists' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('artists')}
            >
              Artistas
            </button>
            <button
              className={`pb-3 px-1 font-semibold ${activeTab === 'albums' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('albums')}
            >
              Álbuns
            </button>
            <button
              className={`pb-3 px-1 font-semibold ${activeTab === 'playlists' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
              onClick={() => setActiveTab('playlists')}
            >
              Playlists
            </button>
          </div>
        </div>
      )}

      {searchQuery && activeTab === 'tracks' && (
        <div className="space-y-2">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track) => (
              <TrackItem 
                key={track.id} 
                track={track} 
                onPlay={handlePlayTrack} 
              />
            ))
          ) : (
            <p className="text-gray-400">Nenhuma música encontrada para "{searchQuery}"</p>
          )}
        </div>
      )}

      {searchQuery && activeTab === 'artists' && (
        <div>
          <p className="text-gray-400">Funcionalidade de busca por artistas em desenvolvimento</p>
        </div>
      )}

      {searchQuery && activeTab === 'albums' && (
        <div>
          <p className="text-gray-400">Funcionalidade de busca por álbuns em desenvolvimento</p>
        </div>
      )}

      {searchQuery && activeTab === 'playlists' && (
        <div>
          <p className="text-gray-400">Funcionalidade de busca por playlists em desenvolvimento</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
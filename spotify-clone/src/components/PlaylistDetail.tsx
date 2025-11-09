import React from 'react';
import { mockData } from '../__mocks__/mockData';
import TrackItem from './TrackItem';

interface PlaylistDetailProps {
  playlistId: string;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlistId }) => {
  const playlist = mockData.playlists.find(p => p.id === playlistId);
  
  if (!playlist) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white">Playlist não encontrada</h1>
      </div>
    );
  }

  const handlePlayTrack = (track: any) => {
    // Aqui você pode implementar a lógica para tocar a música
    console.log('Tocando:', track);
  };

  return (
    <div className="p-6">
      <div className="flex items-end space-x-4 mb-8">
        <img 
          src={playlist.cover} 
          alt={playlist.name} 
          className="w-48 h-48 rounded-lg shadow-lg"
        />
        <div>
          <p className="text-gray-400 uppercase text-sm">Playlist</p>
          <h1 className="text-5xl font-bold text-white mb-4">{playlist.name}</h1>
          <p className="text-gray-300">{playlist.description}</p>
          <p className="text-gray-400 text-sm mt-2">Por {playlist.owner}</p>
        </div>
      </div>

      <div className="space-y-2">
        {playlist.tracks.map((trackId) => {
          const track = mockData.tracks.find(t => t.id === trackId);
          return track ? (
            <TrackItem 
              key={track.id} 
              track={track} 
              onPlay={handlePlayTrack} 
            />
          ) : null;
        })}
      </div>
    </div>
  );
};

export default PlaylistDetail;
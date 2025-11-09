import React, { useState, useEffect } from 'react';
import { mockData } from '../__mocks__/mockData';
import TrackItem from './TrackItem';

const LikedSongs: React.FC = () => {
  const [likedTracks, setLikedTracks] = useState<any[]>([]);

  useEffect(() => {
    // Carrega as músicas curtidas do localStorage
    const likedTracksIds = JSON.parse(localStorage.getItem('likedTracks') || '{}');
    const likedSongs = mockData.tracks.filter(track => likedTracksIds[track.id]);
    setLikedTracks(likedSongs);
  }, []);

  const handlePlayTrack = (track: any) => {
    // Aqui você pode implementar a lógica para tocar a música
    console.log('Tocando:', track);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Músicas Curtidas</h1>
        <p className="text-gray-400">{likedTracks.length} curtidas</p>
      </div>

      <div className="space-y-2">
        {likedTracks.length > 0 ? (
          likedTracks.map((track) => (
            <TrackItem 
              key={track.id} 
              track={track} 
              onPlay={handlePlayTrack} 
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma música curtida</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Quando você curtir músicas, elas aparecerão aqui. Comece a explorar e curtir suas músicas favoritas!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
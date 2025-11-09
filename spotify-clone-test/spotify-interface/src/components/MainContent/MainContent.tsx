import React from 'react';
import MusicCard from '../MusicCard/MusicCard';

const MainContent = () => {
  const mockMusicData = [
    { id: 1, title: 'Música 1', artist: 'Artista 1', album: 'Álbum 1', duration: '3:45' },
    { id: 2, title: 'Música 2', artist: 'Artista 2', album: 'Álbum 2', duration: '4:20' },
    { id: 3, title: 'Música 3', artist: 'Artista 3', album: 'Álbum 3', duration: '2:58' },
    { id: 4, title: 'Música 4', artist: 'Artista 4', album: 'Álbum 4', duration: '3:33' },
    { id: 5, title: 'Música 5', artist: 'Artista 5', album: 'Álbum 5', duration: '5:12' },
  ];

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6">Boa tarde</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {mockMusicData.map((music) => (
          <MusicCard
            key={music.id}
            title={music.title}
            artist={music.artist}
            album={music.album}
            duration={music.duration}
          />
        ))}
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Seu Daily Mix</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mockMusicData.map((music) => (
            <MusicCard
              key={`mix-${music.id}`}
              title={music.title}
              artist={music.artist}
              album={music.album}
              duration={music.duration}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
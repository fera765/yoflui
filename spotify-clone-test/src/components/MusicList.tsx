import React, { useState } from 'react';

interface Music {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
}

interface MusicListProps {
  musics: Music[];
  onMusicSelect: (music: Music) => void;
}

const MusicList: React.FC<MusicListProps> = ({ musics, onMusicSelect }) => {
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);

  const handleMusicClick = (music: Music) => {
    setSelectedMusic(music.id);
    onMusicSelect(music);
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_80px] bg-gray-900 text-gray-400 text-sm font-semibold px-4 py-2">
        <div className="text-center">#</div>
        <div>Title</div>
        <div>Album</div>
        <div>Artist</div>
        <div className="text-right pr-4">Duration</div>
      </div>
      
      <div className="divide-y divide-gray-700">
        {musics.map((music, index) => (
          <div 
            key={music.id}
            className={`grid grid-cols-[40px_1fr_1fr_1fr_80px] items-center px-4 py-2 hover:bg-gray-700 cursor-pointer transition-colors ${
              selectedMusic === music.id ? 'bg-gray-700' : ''
            }`}
            onClick={() => handleMusicClick(music)}
          >
            <div className="text-center text-gray-400">{index + 1}</div>
            <div className="flex items-center">
              <img 
                src={music.cover} 
                alt={music.title} 
                className="w-10 h-10 mr-3 rounded"
              />
              <div>
                <div className="font-medium text-white">{music.title}</div>
              </div>
            </div>
            <div className="text-gray-300">{music.album}</div>
            <div className="text-gray-300">{music.artist}</div>
            <div className="text-gray-400 text-right pr-4">{music.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicList;
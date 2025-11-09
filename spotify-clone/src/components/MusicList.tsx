import { useState } from 'react';
import { Music } from '../types/music';
import MusicItem from './MusicItem';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

interface MusicListProps {
  musics: Music[];
}

const MusicList = ({ musics }: MusicListProps) => {
  const { playMusic } = useMusicPlayer();
  
  // Estado para armazenar as músicas com possibilidade de like
  const [musicsState, setMusicsState] = useState<Music[]>(musics);

  const handleLikeToggle = (id: string) => {
    setMusicsState(prevMusics => 
      prevMusics.map(music => 
        music.id === id ? { ...music, liked: !music.liked } : music
      )
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-xl font-bold text-white mb-4">Músicas</h3>
      <div className="space-y-2">
        {musicsState.map(music => (
          <MusicItem 
            key={music.id} 
            music={music} 
            onLikeToggle={handleLikeToggle}
            onPlay={playMusic}
          />
        ))}
      </div>
    </div>
  );
};

export default MusicList;
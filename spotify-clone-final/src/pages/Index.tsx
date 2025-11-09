import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Player from '../components/Player';
import PlaylistCard from '../components/PlaylistCard';
import { mockPlaylists, mockSongs, Song } from '../mocks/playlists.mock';

const Index = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(mockSongs[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  
  const handleNext = () => {
    const currentIndex = mockSongs.findIndex(s => s.id === currentSong?.id);
    const nextIndex = (currentIndex + 1) % mockSongs.length;
    setCurrentSong(mockSongs[nextIndex]);
  };
  
  const handlePrevious = () => {
    const currentIndex = mockSongs.findIndex(s => s.id === currentSong?.id);
    const prevIndex = currentIndex === 0 ? mockSongs.length - 1 : currentIndex - 1;
    setCurrentSong(mockSongs[prevIndex]);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-8 pb-32">
          <h2 className="text-3xl font-bold mb-6">Playlists em Destaque</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mockPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPlay={() => {
                  if (playlist.songs.length > 0) {
                    setCurrentSong(playlist.songs[0]);
                    setIsPlaying(true);
                  }
                }}
              />
            ))}
          </div>
        </main>
        
        <Player
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    </div>
  );
};

export default Index;

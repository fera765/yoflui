import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import MusicPlayer from '../components/MusicPlayer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black p-6">
          {children}
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
};

export default Layout;import React, { ReactNode } from 'react';
import Header from './Header';
import Sidebar from '../components/Sidebar';
import Player from '../components/Player';
import { mockData } from '../__mocks__/mockData';

// Simular estado de reprodução
let currentTrackState = mockData.tracks[0];
let isPlayingState = false;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = React.useState(currentTrackState);
  const [isPlaying, setIsPlaying] = React.useState(isPlayingState);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(180); // 3 minutos padrão
  const [volume, setVolume] = React.useState(0.7);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const currentIndex = mockData.tracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % mockData.tracks.length;
    setCurrentTrack(mockData.tracks[nextIndex]);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    const currentIndex = mockData.tracks.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + mockData.tracks.length) % mockData.tracks.length;
    setCurrentTrack(mockData.tracks[prevIndex]);
    setCurrentTime(0);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Simular progresso da música quando está tocando
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime >= duration) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prevTime + 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black p-6">
          {children}
        </main>
      </div>
      <Player 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
      />
    </div>
  );
};

interface LayoutProps {
  children: ReactNode;
}

export default Layout;
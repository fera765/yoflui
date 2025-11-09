import { createContext, useContext, useState } from 'react';
import { Music } from '../types/music';

interface MusicPlayerContextType {
  currentMusic: Music | null;
  isPlaying: boolean;
  playMusic: (music: Music) => void;
  togglePlayPause: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const playMusic = (music: Music) => {
    setCurrentMusic(music);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentMusic,
        isPlaying,
        playMusic,
        togglePlayPause,
        setCurrentTime,
        setVolume,
        currentTime,
        duration,
        volume,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
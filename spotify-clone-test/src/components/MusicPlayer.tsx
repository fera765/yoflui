import React, { useState, useEffect, useRef } from 'react';

interface MusicPlayerProps {
  currentSong?: {
    title: string;
    artist: string;
    albumCover: string;
  };
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ currentSong = {
  title: 'Song Title',
  artist: 'Artist Name',
  albumCover: 'https://placehold.co/60x60'
} }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [duration, setDuration] = useState(180); // 3 minutos em segundos
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Simular progresso da música
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          const newProgress = (newTime / duration) * 100;
          setProgress(newProgress);
          
          if (newTime >= duration) {
            setIsPlaying(false);
            setCurrentTime(0);
            setProgress(0);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 z-50">
      <div className="flex items-center justify-between">
        {/* Informações da música */}
        <div className="flex items-center space-x-4 w-1/4">
          <img 
            src={currentSong.albumCover} 
            alt="Album cover" 
            className="w-14 h-14 rounded shadow-lg"
          />
          <div>
            <div className="font-semibold text-sm truncate max-w-[120px]">{currentSong.title}</div>
            <div className="text-xs text-gray-400 truncate max-w-[120px]">{currentSong.artist}</div>
          </div>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        
        {/* Controles de reprodução */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6 mb-2">
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.5 4l-6 6 6 6 1.5-1.5-4.5-4.5 4.5-4.5-1.5-1.5z"/>
              </svg>
            </button>
            <button 
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.5 4l6 6-6 6-1.5-1.5 4.5-4.5-4.5-4.5 1.5-1.5z"/>
              </svg>
            </button>
          </div>
          
          {/* Barra de progresso */}
          <div className="flex items-center w-full space-x-2">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
            <div 
              className="flex-1 bg-gray-600 h-1 rounded cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div 
                className="bg-white h-1 rounded group-hover:h-1.5 transition-all duration-100"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Controles de volume */}
        <div className="flex items-center space-x-4 w-1/4 justify-end">
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4h2v12H4V4zm6 0h2v12h-2V4z"/>
            </svg>
          </button>
          <div className="flex items-center space-x-2 w-32">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.824a1 1 0 011.617.824zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.728 2.757 1 1 0 01-1.415-1.415A3.987 3.987 0 0013 12a3.987 3.987 0 00-.146-1.086 1 1 0 010-1.415z" clipRule="evenodd"/>
            </svg>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Audio element para controle real de áudio (oculto) */}
      <audio ref={audioRef} />
    </div>
  );
};

// Função auxiliar para formatar tempo (MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default MusicPlayer;
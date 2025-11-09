import React, { useState, useEffect } from 'react';
import { Song } from '../mocks/playlists.mock';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Player: React.FC<PlayerProps> = ({
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}) => {
  const [progress, setProgress] = useState(0);

  // Simula o progresso da música
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 0;
          }
          return prev + 0.5; // Ajuste a velocidade conforme necessário
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1DB954] text-white h-20 flex items-center px-4 z-50">
      <div className="flex items-center w-full max-w-7xl mx-auto">
        {/* Informações da música */}
        <div className="flex items-center w-1/4">
          <img 
            src={currentSong.albumArt} 
            alt={currentSong.title} 
            className="w-14 h-14 rounded mr-3"
          />
          <div>
            <div className="font-semibold truncate max-w-[120px]">{currentSong.title}</div>
            <div className="text-sm opacity-80 truncate max-w-[120px]">{currentSong.artist}</div>
          </div>
        </div>

        {/* Controles centrais */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6 mb-2">
            <button 
              onClick={onPrevious}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <line x1="5" y1="19" x2="5" y2="5"></line>
              </svg>
            </button>
            
            <button 
              onClick={onPlayPause}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
            
            <button 
              onClick={onNext}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19"></line>
              </svg>
            </button>
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full flex items-center">
            <span className="text-xs mr-2">{formatTime((progress / 100) * (currentSong.duration || 180))}</span>
            <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs ml-2">{formatTime(currentSong.duration || 180)}</span>
          </div>
        </div>

        {/* Volume (lado direito) */}
        <div className="flex items-center justify-end w-1/4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            <div className="w-24 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
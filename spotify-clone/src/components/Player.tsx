import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  volume: number;
  progress: number;
  onLike: (trackId: string) => void;
}

const Player: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onSeek,
  volume,
  progress,
  onLike
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Simular progresso da música quando está tocando
  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressInterval.current = setInterval(() => {
        // Simula o progresso da música
      }, 1000);
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentTrack]);

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const volumeBar = e.currentTarget;
    const rect = volumeBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, pos));
    onVolumeChange(newVolume);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newProgress = Math.max(0, Math.min(100, pos * 100));
    onSeek(newProgress);
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 flex items-center justify-center">
        <p className="text-gray-400">Nenhuma música selecionada</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 transition-all duration-300 ease-in-out transform translate-y-0 hover:translate-y-0">
      {/* Barra de progresso */}
      <div 
        className="h-1 bg-gray-700 w-full mb-4 cursor-pointer transition-all duration-200 hover:h-1.5"
        onClick={handleProgressClick}
      >
        <div 
          className="h-full bg-green-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 w-1/4">
          {/* Imagem da música */}
          <img 
            src={currentTrack.albumArt} 
            alt={currentTrack.title} 
            className="w-14 h-14 rounded-md transition-transform duration-300 hover:scale-105"
          />
          
          {/* Informações da música */}
          <div className="min-w-0">
            <h4 className="text-white font-medium truncate transition-all duration-300 hover:text-green-400">
              {currentTrack.title}
            </h4>
            <p className="text-gray-400 text-sm truncate">
              {currentTrack.artist}
            </p>
          </div>
          
          {/* Botão de like */}
          <button 
            onClick={() => onLike(currentTrack.id)}
            className={`p-1 rounded-full transition-all duration-300 ${currentTrack.liked ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 ${currentTrack.liked ? 'fill-current' : ''}`} 
              viewBox="0 0 20 20" 
              fill={currentTrack.liked ? "currentColor" : "none"}
              stroke="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center w-2/4">
          {/* Controles de reprodução */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={onPrevious}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </button>
            
            <button 
              onClick={onPlayPause}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform duration-300"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
          
          {/* Informações de tempo */}
          <div className="flex items-center mt-2 w-full max-w-md">
            <span className="text-xs text-gray-400 w-10">
              {Math.floor(progress / 100 * currentTrack.duration / 60)}:{Math.floor(progress / 100 * currentTrack.duration % 60).toString().padStart(2, '0')}
            </span>
            <div className="flex-1 mx-2">
              <div className="text-xs text-gray-400 text-center">
                {currentTrack.album}
              </div>
            </div>
            <span className="text-xs text-gray-400 w-10 text-right">
              {Math.floor(currentTrack.duration / 60)}:{(currentTrack.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 w-1/4">
          {/* Controle de volume */}
          <div className="relative">
            <button 
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m-4.5-9.5L12 3l4.5 4.5M12 2v20" />
              </svg>
            </button>
            
            {showVolumeSlider && (
              <div 
                className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-md p-2 w-24 transition-all duration-300 ease-in-out transform origin-bottom-right"
                style={{ transform: 'scaleY(1)' }}
              >
                <div 
                  className="h-1 bg-gray-600 w-full cursor-pointer"
                  onClick={handleVolumeClick}
                >
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${volume * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
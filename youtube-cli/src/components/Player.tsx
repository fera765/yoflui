import React, { useState, useEffect } from 'react';
import { Track } from '../types';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
}

const Player: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onSeek,
  currentTime,
  duration,
  volume
}) => {
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
    const progressBarWidth = progressBar.clientWidth;
    const percentage = clickPosition / progressBarWidth;
    onSeek(percentage * duration);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 transition-all duration-300 ease-in-out transform">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Informações da faixa */}
          <div className="flex items-center space-x-4 w-1/4 animate-slideInLeft">
            {currentTrack && (
              <>
                <img 
                  src={currentTrack.image} 
                  alt={currentTrack.title} 
                  className={`w-14 h-14 rounded-md transition-transform duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                />
                <div>
                  <h4 className="text-white font-medium truncate max-w-[120px] hover:text-green-400 transition-colors duration-200">{currentTrack.title}</h4>
                  <p className="text-gray-400 text-sm truncate max-w-[120px]">{currentTrack.artist}</p>
                </div>
              </>
            )}
          </div>

          {/* Controles de reprodução */}
          <div className="flex flex-col items-center w-2/4 animate-fadeIn">
            <div className="flex items-center space-x-6">
              <button 
                onClick={onPrevious}
                className="text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.4 4L7 5.4v11.2L8.4 15V4z" />
                  <path d="M13 4v11.2l1.4-1.4V5.4L13 4z" />
                </svg>
              </button>
              
              <button 
                onClick={onPlayPause}
                className="bg-white text-black rounded-full p-2 hover:scale-110 transition-transform duration-200 transform active:scale-95"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={onNext}
                className="text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.4 4L3 5.4v11.2L4.4 15V4z" />
                  <path d="M9 4v11.2l1.4-1.4V5.4L9 4z" />
                </svg>
              </button>
            </div>
            
            {/* Barra de progresso */}
            <div className="flex items-center space-x-2 w-full max-w-md mt-2">
              <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-200 group-hover:h-1.5 relative overflow-hidden"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-30 animate-pulse"></div>
                </div>
              </div>
              <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controle de volume */}
          <div className="flex items-center space-x-4 w-1/4 justify-end relative animate-slideInRight">
            <div className="relative">
              <button 
                onClick={() => setIsVolumeVisible(!isVolumeVisible)}
                className="text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </button>
              
              {isVolumeVisible && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg p-2 w-24 transition-all duration-200 transform origin-bottom-right scale-100 opacity-100 animate-fadeIn">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
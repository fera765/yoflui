import React from 'react';
import { usePlayer } from '../hooks/usePlayer';

const Player: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    volume,
    isShuffle,
    isRepeat,
    togglePlayPause,
    nextSong,
    prevSong,
    seekTo,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calcular duração total da música em segundos (simulada como 240 segundos = 4 minutos)
  const totalDuration = 240;
  const currentTime = (progress / 100) * totalDuration;

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      <div className="flex items-center justify-between">
        {/* Informações da música atual */}
        <div className="flex items-center space-x-3 w-1/4">
          {currentSong && (
            <>
              <img 
                src={currentSong.cover} 
                alt={currentSong.title} 
                className="w-14 h-14 object-cover"
              />
              <div>
                <div className="text-white font-medium truncate max-w-[120px]">{currentSong.title}</div>
                <div className="text-gray-400 text-sm truncate max-w-[120px]">{currentSong.artist}</div>
              </div>
            </>
          )}
        </div>

        {/* Controles de reprodução */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6 mb-3">
            <button 
              onClick={toggleShuffle}
              className={`text-gray-400 hover:text-white transition-colors ${isShuffle ? 'text-green-500' : ''}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
              </svg>
            </button>
            
            <button 
              onClick={prevSong}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>
            
            <button 
              onClick={togglePlayPause}
              className="bg-white rounded-full p-2 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={nextSong}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
              </svg>
            </button>
            
            <button 
              onClick={toggleRepeat}
              className={`text-gray-400 hover:text-white transition-colors ${isRepeat ? 'text-green-500' : ''}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101A7.002 7.002 0 015.56 10.67a1 1 0 01.61-1.276z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center w-full max-w-md space-x-2">
            <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
            <div 
              className="h-1 bg-gray-600 rounded-full flex-grow cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seekTo(pos * 100);
              }}
            >
              <div 
                className="h-1 bg-gray-300 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="w-3 h-3 bg-white rounded-full absolute right-0 top-1/2 transform -translate-y-1/2"></div>
              </div>
            </div>
            <span className="text-xs text-gray-400 w-10">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Controle de volume e outros */}
        <div className="flex items-center space-x-3 w-1/4 justify-end">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            
            <div 
              className="h-1 bg-gray-600 rounded-full w-24 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                changeVolume(Math.round(pos * 100));
              }}
            >
              <div 
                className="h-1 bg-gray-300 rounded-full relative"
                style={{ width: `${volume}%` }}
              >
                <div className="w-3 h-3 bg-white rounded-full absolute right-0 top-1/2 transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
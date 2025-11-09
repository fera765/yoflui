import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, MoreHorizontal } from 'lucide-react';

const Player = ({ currentSong = null }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Simular progresso da música
  useEffect(() => {
    let interval;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 0;
          }
          return prev + 0.5;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * 180; // 3 minutos de duração simulada
  const duration = 180;

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50">
      <div className="max-w-screen-xl mx-auto">
        {/* Barra de progresso */}
        <div className="w-full h-1 bg-gray-700 rounded-full mb-4 cursor-pointer relative">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-3 h-3 bg-white rounded-full shadow-lg transform -translate-x-1/2"
              style={{ left: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Informações da música */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium text-sm truncate">{currentSong.title}</h3>
              <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Heart size={16} />
            </button>
          </div>

          {/* Controles principais */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors">
                <SkipBack size={20} />
              </button>
              <button 
                onClick={handlePlayPause}
                className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}  
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <SkipForward size={20} />
              </button>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controles de volume e mais */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <div className="flex items-center space-x-2 relative">
              <button 
                className="text-gray-400 hover:text-white transition-colors relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <Volume2 size={16} />
              </button>
              <div 
                className={`absolute bottom-full mb-2 right-0 w-24 h-24 bg-gray-800 rounded-lg p-2 transition-opacity duration-200 ${
                  showVolumeSlider ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #22c55e 0%, #22c55e ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                  }}
                />
              </div>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
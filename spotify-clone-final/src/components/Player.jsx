import React, { useState, useEffect } from 'react';

const Player = ({ currentSong }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  // Mock data for current song if not provided
  const song = currentSong || {
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 354, // 5:54 in seconds
    cover: 'https://placehold.co/60x60/1db954/ffffff?text=♪'
  };

  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate progress when playing
  useEffect(() => {
    let interval = null;
    if (isPlaying && currentTime < song.duration) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (currentTime >= song.duration) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, song.duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * song.duration;
    setCurrentTime(Math.floor(newTime));
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePrevious = () => {
    // Logic for previous song
    setCurrentTime(0);
  };

  const handleNext = () => {
    // Logic for next song
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Left section - Current song info */}
        <div className="flex items-center space-x-3 w-1/4">
          <img 
            src={song.cover} 
            alt={song.title} 
            className="w-14 h-14 rounded object-cover"
          />
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium truncate max-w-[120px]">
              {song.title}
            </span>
            <span className="text-gray-400 text-xs truncate max-w-[120px]">
              {song.artist}
            </span>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Center section - Player controls */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6 mb-2">
            <button 
              onClick={handlePrevious}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>
            
            <button 
              onClick={handlePlayPause}
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
              onClick={handleNext}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.554 5.168A1 1 0 0010 6v2.798l-5.445-3.63A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div 
              className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-gray-300 rounded-full group-hover:bg-white transition-colors relative"
                style={{ width: `${(currentTime / song.duration) * 100}%` }}
              >
                <div className="w-3 h-3 bg-white rounded-full absolute -top-1 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <span className="text-xs text-gray-400 w-10">
              {formatTime(song.duration)}
            </span>
          </div>
        </div>

        {/* Right section - Volume control */}
        <div className="flex items-center space-x-3 justify-end w-1/4">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
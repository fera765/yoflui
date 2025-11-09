import React, { useState, useRef, useEffect } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
}

const Player: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Mock song data
  const mockSong: Song = {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: '5:55',
    cover: 'https://placehold.co/300x300/1db954/white?text=♪'
  };

  useEffect(() => {
    setCurrentSong(mockSong);
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Song Info */}
        <div className="flex items-center space-x-3 w-1/4">
          {currentSong && (
            <>
              <img 
                src={currentSong.cover} 
                alt={currentSong.title} 
                className="w-14 h-14 rounded"
              />
              <div>
                <div className="text-white font-medium text-sm">{currentSong.title}</div>
                <div className="text-gray-400 text-xs">{currentSong.artist}</div>
              </div>
            </>
          )}
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6 mb-2">
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.5 4l-6 6 6 6V4z" />
              </svg>
            </button>
            <button 
              onClick={togglePlay}
              className="bg-white rounded-full p-2 hover:scale-105 transition-transform"
            >
              <svg 
                className="w-6 h-6 text-black" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                {isPlaying ? (
                  <path d="M5 4h3v12H5V4m5 0h3v12h-3V4" />
                ) : (
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L9.94 12l-4.72 5.72a.75.75 0 101.12.96l4.78-5.8a.75.75 0 000-.96L6.28 5.22z" />
                )}
              </svg>
            </button>
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.5 4l6 6-6 6V4z" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center w-full max-w-md space-x-2">
            <span className="text-xs text-gray-400 w-10">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-10">
              {currentSong?.duration || formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-end space-x-2 w-1/4">
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
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default Player;
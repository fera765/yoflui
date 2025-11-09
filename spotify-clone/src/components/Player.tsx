import React, { useState } from 'react';

interface PlayerProps {
  songTitle?: string;
  artist?: string;
  albumCover?: string;
}

const Player: React.FC<PlayerProps> = ({
  songTitle = 'Song Title',
  artist = 'Artist Name',
  albumCover = 'https://placehold.co/60x60'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Song Info */}
        <div className="flex items-center space-x-3 w-1/4">
          <img 
            src={albumCover} 
            alt="Album cover" 
            className="w-14 h-14 rounded-md"
          />
          <div>
            <div className="text-white text-sm font-medium">{songTitle}</div>
            <div className="text-gray-400 text-xs">{artist}</div>
          </div>
        </div>

        {/* Player Controls - Center */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6">
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 5h2v10H4V5zm12 0h2v10h-2V5zM8 5h5v10H8V5z" />
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
            
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 5h2v10H4V5zm12 0h2v10h-2V5zM8 5h5v10H8V5z" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center mt-2 w-full max-w-md">
            <span className="text-xs text-gray-400 mr-2">1:23</span>
            <div className="flex-1 h-1 bg-gray-600 rounded-full">
              <div className="h-1 bg-gray-300 rounded-full w-1/3"></div>
            </div>
            <span className="text-xs text-gray-400 ml-2">3:45</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center justify-end space-x-4 w-1/4">
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-xs text-white">50</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
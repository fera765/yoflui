import React from 'react';

interface MusicCardProps {
  title: string;
  artist: string;
  album: string;
  duration: string;
}

const MusicCard = ({ title, artist, album, duration }: MusicCardProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200">
      <div className="flex items-center space-x-4">
        <div className="bg-gray-600 rounded-md w-16 h-16 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{title}</h3>
          <p className="text-gray-400 text-sm truncate">{artist}</p>
          <p className="text-gray-500 text-xs">{album}</p>
        </div>
        <div className="text-gray-400 text-sm">{duration}</div>
      </div>
    </div>
  );
};

export default MusicCard;
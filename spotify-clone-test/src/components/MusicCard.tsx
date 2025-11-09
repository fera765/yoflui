import React from 'react';

interface MusicCardProps {
  title: string;
  artist: string;
  album: string;
  duration: string;
  imageUrl: string;
  onPlay?: () => void;
}

const MusicCard: React.FC<MusicCardProps> = ({ 
  title, 
  artist, 
  album, 
  duration, 
  imageUrl, 
  onPlay 
}) => {
  return (
    <div className="flex items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer group">
      <div className="relative w-12 h-12 mr-4 flex-shrink-0">
        <img 
          src={imageUrl} 
          alt={`${title} album cover`} 
          className="w-full h-full object-cover rounded"
        />
        <button 
          onClick={onPlay}
          className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <svg 
            className="w-6 h-6 text-white" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium truncate">{title}</h3>
        <p className="text-gray-400 text-sm truncate">{artist}</p>
      </div>
      <div className="ml-4 text-right text-gray-400 text-sm hidden md:block">
        <p className="truncate">{album}</p>
        <p>{duration}</p>
      </div>
    </div>
  );
};

export default MusicCard;
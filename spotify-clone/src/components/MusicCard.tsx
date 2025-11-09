import React from 'react';

interface MusicCardProps {
  title: string;
  artist: string;
  album: string;
  duration: string;
  imageUrl: string;
  onPlay?: () => void;
  onLike?: () => void;
  liked?: boolean;
}

const MusicCard: React.FC<MusicCardProps> = ({ 
  title, 
  artist, 
  album, 
  duration, 
  imageUrl, 
  onPlay, 
  onLike, 
  liked = false 
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4 transition-all duration-300 hover:bg-gray-700 hover:shadow-lg">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-16 h-16 object-cover rounded-md transition-transform duration-300 hover:scale-105"
        />
        <button 
          onClick={onPlay}
          className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
        >
          <svg 
            className="w-8 h-8 text-white" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{title}</h4>
        <p className="text-gray-400 text-sm truncate">{artist}</p>
      </div>
      <div className="hidden md:block text-gray-400 text-sm">
        {album}
      </div>
      <div className="text-gray-400 text-sm">
        {duration}
      </div>
      <button 
        onClick={onLike}
        className="ml-2 text-gray-400 hover:text-green-500 transition-colors duration-300"
      >
        <svg 
          className={`w-5 h-5 ${liked ? 'text-green-500 fill-current' : 'stroke-current'}`} 
          viewBox="0 0 24 24"
          fill={liked ? 'currentColor' : 'none'}
          strokeWidth={liked ? '0' : '2'}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
    </div>
  );
};

export default MusicCard;
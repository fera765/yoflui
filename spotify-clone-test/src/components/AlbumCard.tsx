import React from 'react';

interface AlbumCardProps {
  title: string;
  artist: string;
  imageUrl: string;
  year: string;
  onClick?: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ 
  title, 
  artist, 
  imageUrl, 
  year,
  onClick 
}) => {
  return (
    <div 
      className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative mb-4">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full aspect-square object-cover rounded-md"
        />
        <button className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg">
          <svg 
            className="w-6 h-6 text-black" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </div>
      
      <h3 className="text-white font-semibold truncate">{title}</h3>
      <p className="text-gray-400 text-sm mt-1 truncate">{artist}</p>
      <p className="text-gray-400 text-xs mt-1">{year}</p>
    </div>
  );
};

export default AlbumCard;
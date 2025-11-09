import React from 'react';

interface AlbumCardProps {
  title: string;
  artist: string;
  imageUrl: string;
  year: string;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ title, artist, imageUrl, year }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-700 group">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="bg-green-500 rounded-full p-3 hover:bg-green-400 transition-colors duration-300 transform scale-0 group-hover:scale-100">
            <svg 
              className="w-6 h-6 text-black" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold truncate">{title}</h3>
        <p className="text-gray-400 text-sm truncate">{artist}</p>
        <p className="text-gray-500 text-xs">{year}</p>
      </div>
    </div>
  );
};

export default AlbumCard;
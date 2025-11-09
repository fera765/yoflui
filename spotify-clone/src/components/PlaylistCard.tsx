import React from 'react';

interface PlaylistCardProps {
  title: string;
  artist: string;
  coverImage: string;
  onClick?: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  title, 
  artist, 
  coverImage, 
  onClick 
}) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer transform hover:scale-105"
      onClick={onClick}
    >
      <div className="aspect-square w-full relative">
        <img 
          src={coverImage} 
          alt={title} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="text-white font-semibold truncate">{title}</h3>
        <p className="text-gray-400 text-sm truncate">{artist}</p>
      </div>
    </div>
  );
};

export default PlaylistCard;
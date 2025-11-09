import React from 'react';

interface PlaylistCardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  onClick?: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  title, 
  subtitle, 
  imageUrl, 
  onClick 
}) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
        />
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold truncate">{title}</h3>
        <p className="text-gray-400 text-sm truncate">{subtitle}</p>
      </div>
    </div>
  );
};

export default PlaylistCard;
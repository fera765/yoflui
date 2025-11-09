import React from 'react';

interface PlaylistCardProps {
  title: string;
  artist: string;
  coverImage: string;
  onClick: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  title, 
  artist, 
  coverImage, 
  onClick 
}) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative pb-[100%]"> {/* Square aspect ratio */}
        <img 
          src={coverImage} 
          alt={title}
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-2 group-hover:translate-y-0">
            <svg 
              className="w-12 h-12 text-white drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-white font-semibold truncate">{title}</h3>
        <p className="text-gray-400 text-sm truncate">{artist}</p>
      </div>
    </div>
  );
};

export default PlaylistCard;import React from 'react';

interface PlaylistCardProps {
  title: string;
  description: string;
  image: string;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ title, description, image }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition cursor-pointer">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-44 object-cover"
      />
      <div className="p-4">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
      </div>
    </div>
  );
};

export default PlaylistCard;
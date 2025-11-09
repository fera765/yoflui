import React from 'react';
import { Playlist } from '../mocks/playlists.mock';

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPlay }) => {
  return (
    <div 
      className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all cursor-pointer group"
      onClick={onPlay}
    >
      <div className="relative mb-4">
        <img 
          src={playlist.coverImage} 
          alt={playlist.name}
          className="w-full aspect-square object-cover rounded-md shadow-lg"
        />
        <button 
          className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>
      <h3 className="font-bold text-white truncate mb-1">{playlist.name}</h3>
      <p className="text-sm text-gray-400 line-clamp-2">{playlist.description}</p>
    </div>
  );
};

export default PlaylistCard;
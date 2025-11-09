import React from 'react';

interface PlaylistCardProps {
  title: string;
  description: string;
  songCount: number;
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    duration: string;
  }>;
  playlistId: string;
  onLike: (playlistId: string, songId: string) => void;
  isLiked: (playlistId: string, songId: string) => boolean;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  title, 
  description, 
  songCount,
  songs,
  playlistId,
  onLike,
  isLiked
}) => {
  return (
    <div className="playlist-card bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105 transition-transform">
      <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
        <div className="bg-gray-600 border-2 border-dashed rounded-xl w-16 h-16" />
      </div>
      <h3 className="font-semibold text-white truncate">{title}</h3>
      <p className="text-sm text-gray-400 truncate">{description}</p>
      <p className="text-xs text-gray-500 mt-1">{songCount} songs</p>
      
      {/* Song list preview */}
      <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
        {songs.slice(0, 3).map((song, index) => (
          <div key={song.id} className="flex justify-between items-center text-xs">
            <span className="text-gray-300 truncate flex-1 mr-2">{index + 1}. {song.title}</span>
            <div className="flex items-center space-x-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(playlistId, song.id);
                }}
                className="text-lg focus:outline-none"
              >
                {isLiked(playlistId, song.id) ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        ))}
        {songs.length > 3 && (
          <div className="text-xs text-gray-500 text-center pt-1">
            +{songs.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistCard;
// src/components/PlaylistCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  userId: string;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, userId }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{playlist.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {playlist.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {playlist.tracks.length} tracks
          </span>
          <div className="flex items-center space-x-2">
            <LikeButton
              itemId={playlist.id}
              itemType="playlist"
              userId={userId}
              initialLikes={playlist.likes || 0}
            />
            <Link
              to={`/playlist/${playlist.id}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
            >
              Play
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
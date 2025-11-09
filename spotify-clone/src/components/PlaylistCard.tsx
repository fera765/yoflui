import React from 'react';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-4">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{playlist.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{playlist.songCount} songs</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{playlist.description}</p>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Created by {playlist.createdBy}
          </span>
          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
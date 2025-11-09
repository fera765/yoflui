import React from 'react';
import { FaPlay, FaEllipsisH } from 'react-icons/fa';

interface PlaylistCardProps {
  title: string;
  description: string;
  songCount: number;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  title, 
  description, 
  songCount 
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
      <div className="relative mb-4">
        <div className="bg-gradient-to-br from-purple-500 to-blue-500 h-32 rounded-lg flex items-center justify-center">
          <button className="bg-green-500 text-white rounded-full p-3 hover:bg-green-400 transition-colors duration-200 opacity-0 hover:opacity-100 transition-opacity">
            <FaPlay />
          </button>
        </div>
        <button className="absolute top-2 right-2 text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors duration-200">
          <FaEllipsisH />
        </button>
      </div>
      <h3 className="text-white font-semibold truncate hover:text-green-400 transition-colors duration-200">{title}</h3>
      <p className="text-gray-400 text-sm mt-1 truncate">{description}</p>
      <p className="text-gray-500 text-xs mt-2">{songCount} songs</p>
    </div>
  );
};

export default PlaylistCard;
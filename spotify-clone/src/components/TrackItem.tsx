import React from 'react';
import LikeButton from './LikeButton';

interface TrackItemProps {
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: string;
    cover: string;
  };
  onPlay: (track: any) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay }) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors duration-200 group">
      <div className="flex items-center space-x-4 flex-1">
        <img 
          src={track.cover} 
          alt={track.title} 
          className="w-10 h-10 rounded-md object-cover"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">{track.title}</h4>
          <p className="text-gray-400 text-sm truncate">{track.artist}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-gray-400 text-sm hidden md:block">{track.album}</span>
        <span className="text-gray-400 text-sm">{track.duration}</span>
        <LikeButton trackId={track.id} />
        <button 
          onClick={() => onPlay(track)}
          className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TrackItem;
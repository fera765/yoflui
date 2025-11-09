import React from 'react';
import { useLike } from '../contexts/LikeContext';
import LikeButton from '../components/LikeButton';

interface LikeableItemProps {
  id: string;
  name: string;
  initialLiked?: boolean;
  initialCount?: number;
}

const LikeableItem: React.FC<LikeableItemProps> = ({ 
  id, 
  name, 
  initialLiked = false, 
  initialCount = 0 
}) => {
  const { isLiked, getCount, toggleLike } = useLike();
  
  const liked = isLiked(id);
  const count = getCount(id);
  
  const handleLike = () => {
    toggleLike(id, initialLiked, initialCount);
  };

  return (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{name}</h3>
      </div>
      <div className="flex items-center space-x-2">
        <LikeButton 
          initialLiked={liked} 
          initialCount={count} 
          onLikeChange={handleLike} 
        />
      </div>
    </div>
  );
};

export default LikeableItem;
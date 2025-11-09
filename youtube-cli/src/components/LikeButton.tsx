import React from 'react';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/outline';
import { useLike } from '../hooks/useLike';

interface LikeButtonProps {
  itemId: string;
  itemType: 'product' | 'playlist' | 'track';
  initialLikes?: number;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const LikeButton: React.FC<LikeButtonProps> = ({
  itemId,
  itemType,
  initialLikes = 0,
  onLikeChange,
  size = 'md'
}) => {
  const { isLiked, getLikesCount, toggleLike } = useLike(itemType);
  const [currentCount, setCurrentCount] = React.useState(initialLikes);

  React.useEffect(() => {
    setCurrentCount(getLikesCount(itemId));
  }, [itemId, getLikesCount]);

  const handleClick = () => {
    const result = toggleLike(itemId, currentCount);
    setCurrentCount(result.likesCount);
    
    if (onLikeChange) {
      onLikeChange(result.isLiked, result.likesCount);
    }
  };

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const currentIsLiked = isLiked(itemId);

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center space-x-1 transition-colors duration-200
        ${currentIsLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}
      `}
      aria-label={currentIsLiked ? 'Descurtir' : 'Curtir'}
    >
      {currentIsLiked ? (
        <HeartIconSolid className={sizeClasses[size]} />
      ) : (
        <HeartIconOutline className={sizeClasses[size]} />
      )}
      {size !== 'sm' && <span className="text-sm">{currentCount}</span>}
    </button>
  );
};

export default LikeButton;
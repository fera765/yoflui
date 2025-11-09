import React, { useState, useEffect } from 'react';

interface LikeButtonProps {
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const LikeButton: React.FC<LikeButtonProps> = ({
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = 'md'
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLike = () => {
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    
    setLiked(newLiked);
    setCount(newCount);
    
    if (onLikeChange) {
      onLikeChange(newLiked, newCount);
    }
  };

  // Determinar classes de tamanho
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <button
      onClick={handleLike}
      className={`
        flex items-center justify-center rounded-full transition-all duration-200
        ${liked 
          ? 'text-red-500 bg-red-50 hover:bg-red-100' 
          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        }
        ${sizeClasses[size]}
      `}
      aria-pressed={liked}
      aria-label={liked ? 'Descurtir' : 'Curtir'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`${
          size === 'sm' ? 'w-4 h-4' : 
          size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        } ${liked ? 'fill-current' : 'stroke-current fill-transparent'}`}
        viewBox="0 0 24 24"
        strokeWidth={liked ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {count > 0 && (
        <span className={`ml-1 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-sm'}`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default LikeButton;
import React, { useState, useEffect } from 'react';

interface LikeButtonProps {
  trackId: string;
  initialLiked?: boolean;
  onLikeChange?: (liked: boolean) => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  trackId, 
  initialLiked = false, 
  onLikeChange 
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);

  // Atualiza o estado quando a propriedade initialLiked mudar
  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Armazena o estado de like no localStorage
    const likedTracks = JSON.parse(localStorage.getItem('likedTracks') || '{}');
    if (newLikedState) {
      likedTracks[trackId] = true;
    } else {
      delete likedTracks[trackId];
    }
    localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
    
    // Chama a função de callback se fornecida
    if (onLikeChange) {
      onLikeChange(newLikedState);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${
        isLiked 
          ? 'text-red-500 hover:bg-red-500/10' 
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
      aria-label={isLiked ? 'Descurtir música' : 'Curtir música'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="cursor-pointer"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};

export default LikeButton;
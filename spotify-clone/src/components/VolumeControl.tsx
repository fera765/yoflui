import React, { useState, useRef, useEffect } from 'react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ volume, onVolumeChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateVolume(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateVolume(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateVolume = (e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const position = e.clientY - rect.top;
    const height = rect.height;
    let newVolume = 1 - position / height;

    // Limitar volume entre 0 e 1
    newVolume = Math.max(0, Math.min(1, newVolume));

    onVolumeChange(newVolume);
  };

  // Adicionar listeners de mouse globalmente quando estiver arrastando
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Fechar o slider quando clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sliderRef.current && !(sliderRef.current as HTMLElement).contains(e.target as HTMLElement)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determinar o ícone de volume com base no nível
  const getVolumeIcon = () => {
    if (volume === 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      );
    } else if (volume < 0.5) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l4 4h2a2 2 0 012 2v4a2 2 0 01-2 2h-2l-4 4V6z" />
        </svg>
      );
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setShowVolumeSlider(!showVolumeSlider)}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 focus:outline-none"
        aria-label="Controle de volume"
      >
        {getVolumeIcon()}
      </button>

      {showVolumeSlider && (
        <div 
          ref={sliderRef}
          className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-8 h-24 bg-gray-800 rounded-full p-1 flex items-center justify-center cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          <div className="w-2 h-full bg-gray-600 rounded-full relative">
            <div 
              className="absolute bottom-0 w-full bg-blue-500 rounded-full transition-all duration-150"
              style={{ height: `${volume * 100}%` }}
            ></div>
            <div 
              className="absolute w-4 h-4 bg-white rounded-full shadow-md transform -translate-x-1/2 cursor-pointer"
              style={{ 
                bottom: `${volume * 100}%`,
                left: '50%',
                transform: 'translate(-50%, 50%)'
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolumeControl;
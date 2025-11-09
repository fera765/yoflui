import React, { useEffect, useState } from 'react';
import './AnimatedProgressBar.css';

interface AnimatedProgressBarProps {
  progress: number; // Valor de 0 a 100
  duration?: number; // Duração da animação em milissegundos
  color?: string; // Cor da barra de progresso
  height?: number; // Altura da barra em pixels
  className?: string; // Classe CSS adicional
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  duration = 300,
  color = '#4CAF50',
  height = 8,
  className = ''
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    // Animação suave para o novo valor de progresso
    const timer = setTimeout(() => {
      setCurrentProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`progress-container ${className}`}>
      <div 
        className="progress-bar"
        style={{
          height: `${height}px`,
          backgroundColor: '#e0e0e0',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden'
        }}
      >
        <div 
          className="progress-fill"
          style={{
            height: '100%',
            width: `${currentProgress}%`,
            backgroundColor: color,
            borderRadius: `${height / 2}px`,
            transition: `width ${duration}ms ease-in-out`,
            minWidth: '0%'
          }}
        />
      </div>
      <div className="progress-text">
        {Math.round(currentProgress)}%
      </div>
    </div>
  );
};

export default AnimatedProgressBar;
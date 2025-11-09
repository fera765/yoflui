import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  progress: number; // Valor entre 0 e 100
  duration?: number; // Duração da animação em milissegundos
  color?: string; // Cor da barra de progresso
  height?: string; // Altura da barra
  className?: string; // Classes adicionais
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration = 300,
  color = 'bg-blue-500',
  height = 'h-2',
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} ${className}`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-${duration} ease-out`}
        style={{ width: `${animatedProgress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
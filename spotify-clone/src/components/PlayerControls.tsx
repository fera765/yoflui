import React, { useState, useEffect } from 'react';
import AnimatedProgressBar from './AnimatedProgressBar';
import './PlayerControls.css';

const PlayerControls: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutos em segundos
  const [currentTime, setCurrentTime] = useState(0);

  // Simular progresso da música
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  // Atualizar progresso percentual
  useEffect(() => {
    if (duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      setProgress(progressPercent);
    }
  }, [currentTime, duration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (newProgress: number) => {
    const newTime = (newProgress / 100) * duration;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="player-controls">
      <div className="progress-section">
        <span className="time-display">{formatTime(currentTime)}</span>
        <AnimatedProgressBar 
          progress={progress}
          duration={300}
          color="#1DB954"
          height={6}
          className="progress-bar-component"
        />
        <span className="time-display">{formatTime(duration)}</span>
      </div>
      
      <div className="playback-controls">
        <button 
          className="play-pause-button"
          onClick={togglePlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>
    </div>
  );
};

export default PlayerControls;
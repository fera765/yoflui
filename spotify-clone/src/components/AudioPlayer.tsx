import { useEffect } from 'react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

const AudioPlayer = () => {
  const {
    currentMusic,
    isPlaying,
    currentTime,
    duration,
    setCurrentTime,
    setDuration,
  } = useMusicPlayer();

  useEffect(() => {
    if (currentMusic) {
      // Simular definição da duração da música
      setDuration(180); // 3 minutos em segundos
    }
  }, [currentMusic, setDuration]);

  // Simular atualização do tempo de reprodução quando está tocando
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, setCurrentTime]);

  if (!currentMusic) return null;

  return (
    <div className="hidden">
      {/* Componente de áudio real seria implementado aqui */}
      <audio 
        src={currentMusic.audioSrc} 
        // controls
      />
    </div>
  );
};

export default AudioPlayer;
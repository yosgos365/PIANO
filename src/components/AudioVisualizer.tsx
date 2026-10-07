import React, { useEffect, useState } from 'react';
import { subscribeAudioPlayback } from '../utils/audio';

interface AudioVisualizerProps {
  color?: string;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  color = 'bg-amber-400',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return subscribeAudioPlayback(setIsPlaying);
  }, []);

  return (
    <div
      className={`flex items-center justify-center gap-1 h-8 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 backdrop-blur-sm transition-opacity duration-300 ${
        isPlaying ? 'opacity-100' : 'opacity-40'
      } ${className}`}
      title={isPlaying ? 'משמיע צליל...' : 'מוכן להשמעה'}
      aria-hidden="true"
    >
      {[0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.35].map((scale, i) => (
        <span
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${color} ${
            isPlaying ? 'wave-bar' : 'h-1'
          }`}
          style={{
            height: isPlaying ? `${Math.round(scale * 22)}px` : '4px',
            animationDelay: `${(i % 4) * 0.15}s`,
            animationDuration: `${0.6 + (i % 3) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
};

import React from 'react';

interface NumberAxisProps {
  currentStreak: number;
  maxStreak?: number; // default 10
}

export const NumberAxis: React.FC<NumberAxisProps> = ({
  currentStreak,
  maxStreak = 10,
}) => {
  const clampedStreak = Math.min(Math.max(0, currentStreak), maxStreak);

  return (
    <div className="w-full max-w-xs mx-auto py-1 px-1">
      {/* Visual Number Line Axis from 1 to 10 */}
      <div className="relative flex items-center justify-between">
        {/* Background track line */}
        <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
        
        {/* Active colored track line */}
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 h-0.5 bg-amber-500 transition-all duration-300 -z-0"
          style={{
            width: clampedStreak > 1 ? `${((clampedStreak - 1) / (maxStreak - 1)) * 100}%` : '0%',
          }}
        />

        {/* Numbers 1..10 */}
        {Array.from({ length: maxStreak }, (_, i) => {
          const num = i + 1;
          const isCompleted = num <= clampedStreak;
          const isCurrent = num === clampedStreak && clampedStreak > 0;

          return (
            <div
              key={num}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 scale-105'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 animate-pulse' : ''}`}
              >
                {num}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

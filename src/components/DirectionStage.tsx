import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PitchDirection } from '../types';

interface DirectionStageProps {
  onChooseDirection: (dir: PitchDirection) => void;
  disabled?: boolean;
  isAnswerSubmitted: boolean;
  isCorrect: boolean;
  chosenDirection: PitchDirection | null;
  targetDirection: PitchDirection | null;
}

export const DirectionStage: React.FC<DirectionStageProps> = ({
  onChooseDirection,
  disabled = false,
  isAnswerSubmitted,
  isCorrect,
  chosenDirection,
  targetDirection,
}) => {
  const options: Array<{ id: PitchDirection; label: string; icon: React.ReactNode }> = [
    {
      id: 'up',
      label: 'עלייה',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'same',
      label: 'אותו תו',
      icon: <Minus className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'down',
      label: 'ירידה',
      icon: <TrendingDown className="w-5 h-5 text-rose-400" />,
    },
  ];

  return (
    <div className="w-full max-w-sm mx-auto px-2">
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isChosen = chosenDirection === opt.id;
          const isThisCorrect = isAnswerSubmitted && isCorrect && isChosen;
          const isThisIncorrect = isAnswerSubmitted && !isCorrect && isChosen;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled || isCorrect}
              onClick={() => onChooseDirection(opt.id)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                isThisCorrect
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500'
                  : isThisIncorrect
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500'
                  : isChosen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="mb-1">{opt.icon}</div>
              <span className="text-xs font-bold">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Volume2 } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface ListeningStageProps {
  onPlayTarget: () => void;
  onSubmitGuess: () => void;
  onNext: () => void;
  isAnswerSubmitted: boolean;
  isCorrect: boolean;
  canSubmit: boolean;
  justUnlockedNextStage: boolean;
  isDirectionStage?: boolean;
}

export const ListeningStage: React.FC<ListeningStageProps> = ({
  onPlayTarget,
  onSubmitGuess,
  onNext,
  isAnswerSubmitted,
  isCorrect,
  canSubmit,
  justUnlockedNextStage,
  isDirectionStage = false,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center my-auto py-1">
      {/* Sound button: ONLY icon of sound */}
      <div className="relative flex flex-col items-center">
        <button
          type="button"
          onClick={onPlayTarget}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 active:scale-90 transition-transform cursor-pointer"
          aria-label="השמעת צלילים"
        >
          <Volume2 className="w-8 h-8 stroke-[2.2]" />
        </button>

        <div className="mt-2">
          <AudioVisualizer color={isCorrect ? 'bg-emerald-400' : 'bg-amber-400'} />
        </div>
      </div>

      {/* Feedback (Minimum text) */}
      <div className="h-7 flex flex-col items-center justify-center mt-1">
        {isAnswerSubmitted && !isCorrect && (
          <span className="text-rose-500 font-extrabold text-sm tracking-wide">
            טעות
          </span>
        )}
        {isCorrect && (
          <span className="text-emerald-400 font-extrabold text-sm tracking-wide">
            {justUnlockedNextStage ? 'נכון! שלב חדש נפתח 🔓' : 'נכון!'}
          </span>
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-1">
        {isCorrect ? (
          <button
            type="button"
            onClick={onNext}
            className="px-7 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            הבא
          </button>
        ) : isDirectionStage ? (
          // In Direction stage: "אין צורך בהגש תו בשלב זיהוי ירידה או עליה"
          <div className="h-8" />
        ) : (
          <button
            type="button"
            onClick={onSubmitGuess}
            disabled={!canSubmit}
            className={`px-7 py-2 rounded-xl font-bold text-xs transition-all ${
              canSubmit
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            הגש תו
          </button>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { X, Lock, CheckCircle2, ChevronLeft, Music2 } from 'lucide-react';
import { StageId, StageDefinition, UserProgress } from '../types';
import { STAGES_LIST } from '../utils/notes';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentStageId: StageId;
  onSelectStage: (stageId: StageId) => void;
  userProgress: UserProgress;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  currentStageId,
  onSelectStage,
  userProgress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col justify-between p-4 z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100">שלבי אימון</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="סגור תפריט"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            רצף של 10 הצלחות ללא שגיאות פותח את השלב הבא.
          </p>

          {/* Stages List */}
          <div className="mt-4 space-y-2">
            {STAGES_LIST.map((stage: StageDefinition) => {
              const progress = userProgress[stage.id] || {
                currentStreak: 0,
                isUnlocked: stage.order === 1,
                bestStreak: 0,
                totalSolved: 0,
              };

              const isCurrent = currentStageId === stage.id;
              const isUnlocked = progress.isUnlocked;

              return (
                <button
                  key={stage.id}
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectStage(stage.id);
                      onClose();
                    }
                  }}
                  className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm'
                      : isUnlocked
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                      : 'bg-slate-950/30 border-slate-900 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex flex-col flex-1 truncate">
                    <span className="font-bold truncate text-slate-100">
                      {stage.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {isUnlocked
                        ? `רצף נוכחי: ${progress.currentStreak}/10 ${
                            progress.bestStreak >= 10 ? '✓ הושלם' : ''
                          }`
                        : '🔒 דרוש רצף 10 בשלב הקודם'}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    ) : !isUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    ) : progress.bestStreak >= 10 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500">
          פיתוח שמיעה מוזיקלית · מובייל
        </div>
      </div>
    </div>
  );
};

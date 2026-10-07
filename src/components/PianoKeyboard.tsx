import React, { useState } from 'react';
import { NoteInfo } from '../types';
import { PIANO_NOTES_OCTAVE_4, PIANO_NOTES_OCTAVE_5 } from '../utils/notes';
import { playPianoNote } from '../utils/audio';
import { RotateCcw } from 'lucide-react';

interface PianoKeyboardProps {
  requiredNoteCount: number; // 1, 2, or 3
  selectedNotes: NoteInfo[];
  onSelectNote: (note: NoteInfo) => void;
  onClearNotes?: () => void;
  targetNotes: NoteInfo[];
  isAnswerSubmitted: boolean;
  isCorrect: boolean;
  octaveCount: number; // 1 or 2
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  requiredNoteCount,
  selectedNotes,
  onSelectNote,
  onClearNotes,
  targetNotes,
  isAnswerSubmitted,
  isCorrect,
  octaveCount,
}) => {
  const [activeOctave, setActiveOctave] = useState<4 | 5>(4);
  const [activePressedKey, setActivePressedKey] = useState<string | null>(null);

  const currentNotes = octaveCount === 2
    ? (activeOctave === 4 ? PIANO_NOTES_OCTAVE_4 : PIANO_NOTES_OCTAVE_5)
    : PIANO_NOTES_OCTAVE_4;

  const whiteNotes = currentNotes.filter((n) => n.keyType === 'white');
  const blackNotes = currentNotes.filter((n) => n.keyType === 'black');

  const handleKeyPress = (note: NoteInfo) => {
    playPianoNote(note.pitch, 1.8);
    setActivePressedKey(note.id);
    setTimeout(() => {
      setActivePressedKey(null);
    }, 180);

    onSelectNote(note);
  };

  const getBlackKeyStyle = (noteId: string) => {
    const keyWidth = 9.4; // %
    let leftOffset = 0;
    const baseId = noteId.replace(/[45]/, '');

    switch (baseId) {
      case 'Cs':
        leftOffset = 14.2857 - keyWidth / 2;
        break;
      case 'Ds':
        leftOffset = 28.5714 - keyWidth / 2;
        break;
      case 'Fs':
        leftOffset = 57.1428 - keyWidth / 2;
        break;
      case 'Gs':
        leftOffset = 71.4285 - keyWidth / 2;
        break;
      case 'As':
        leftOffset = 85.7142 - keyWidth / 2;
        break;
    }

    return {
      left: `${leftOffset}%`,
      width: `${keyWidth}%`,
    };
  };

  const isNoteInTarget = (noteId: string) => targetNotes.some((n) => n.id === noteId);
  const isNoteSelected = (noteId: string) => selectedNotes.some((n) => n.id === noteId);

  return (
    <div className="w-full flex flex-col items-center select-none touch-manipulation">
      {/* Top Bar for Sequence Slots or Octave Switcher */}
      <div className="w-full flex items-center justify-between mb-1.5 px-1 text-xs">
        {/* Sequence slots if requiredNoteCount > 1 */}
        {requiredNoteCount > 1 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">רצף:</span>
            {Array.from({ length: requiredNoteCount }).map((_, i) => {
              const note = selectedNotes[i];
              return (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold border ${
                    note
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  {note ? i + 1 : '—'}
                </span>
              );
            })}
            {selectedNotes.length > 0 && onClearNotes && (
              <button
                type="button"
                onClick={onClearNotes}
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
                title="איפוס בחירה"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Octave switcher if 2 octaves */}
        {octaveCount === 2 && (
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setActiveOctave(4)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                activeOctave === 4
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400'
              }`}
            >
              אוקטבה 4
            </button>
            <button
              type="button"
              onClick={() => setActiveOctave(5)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                activeOctave === 5
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400'
              }`}
            >
              אוקטבה 5
            </button>
          </div>
        )}
      </div>

      {/* Piano Case & Red Felt */}
      <div className="w-full bg-stone-900 p-1.5 sm:p-2.5 rounded-2xl shadow-xl border border-stone-800 relative">
        <div className="h-1.5 w-full bg-red-900 rounded-t-sm shadow-inner mb-0.5" />

        {/* Piano Keys Container (Strict LTR for musical order) */}
        <div
          dir="ltr"
          className="relative h-44 sm:h-52 w-full flex bg-stone-950 rounded-b-lg overflow-hidden border border-stone-800"
        >
          {/* White Keys */}
          {whiteNotes.map((note) => {
            const isSelected = isNoteSelected(note.id);
            const isPressed = activePressedKey === note.id;
            const isTarget = isNoteInTarget(note.id);

            const isThisCorrect = isAnswerSubmitted && isCorrect && isTarget;
            const isThisIncorrect = isAnswerSubmitted && !isCorrect && isSelected;

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => handleKeyPress(note)}
                className={`piano-white-key relative flex-1 h-full rounded-b-md flex flex-col justify-end items-center pb-3 cursor-pointer focus:outline-none z-10 transition-all ${
                  isPressed ? 'is-pressed' : ''
                } ${
                  isThisCorrect
                    ? '!bg-emerald-200 ring-4 ring-emerald-500 ring-inset'
                    : isThisIncorrect
                    ? '!bg-rose-200 ring-4 ring-rose-500 ring-inset'
                    : isSelected
                    ? 'ring-4 ring-amber-500 ring-inset !bg-amber-100'
                    : ''
                }`}
                aria-label={note.nameHebrew}
              >
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                )}
                {isThisCorrect && (
                  <span className="w-3 h-3 rounded-full bg-emerald-600 shadow-sm" />
                )}
                {isThisIncorrect && (
                  <span className="w-3 h-3 rounded-full bg-rose-600 shadow-sm" />
                )}
              </button>
            );
          })}

          {/* Black Keys */}
          {blackNotes.map((note) => {
            const isSelected = isNoteSelected(note.id);
            const isPressed = activePressedKey === note.id;
            const isTarget = isNoteInTarget(note.id);

            const isThisCorrect = isAnswerSubmitted && isCorrect && isTarget;
            const isThisIncorrect = isAnswerSubmitted && !isCorrect && isSelected;

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => handleKeyPress(note)}
                style={getBlackKeyStyle(note.id)}
                className={`piano-black-key absolute top-0 h-[62%] rounded-b-md flex flex-col justify-end items-center pb-2 z-20 cursor-pointer focus:outline-none transition-all ${
                  isPressed ? 'is-pressed' : ''
                } ${
                  isThisCorrect
                    ? '!bg-emerald-700 ring-3 ring-emerald-400'
                    : isThisIncorrect
                    ? '!bg-rose-800 ring-3 ring-rose-500'
                    : isSelected
                    ? 'ring-3 ring-amber-400 !bg-stone-800'
                    : ''
                }`}
                aria-label={note.nameHebrew}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                )}
                {isThisCorrect && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                )}
                {isThisIncorrect && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

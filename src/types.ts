export type KeyType = 'white' | 'black';

export interface NoteInfo {
  id: string; // e.g. 'C4', 'Cs4', 'D4', 'C5', etc.
  nameEnglish: string;
  nameHebrew: string;
  pitch: number;
  octave: number; // 4 or 5
  semitoneIndex: number;
  keyType: KeyType;
}

export type StageId =
  | 'direction'
  | 'single_1_octave'
  | 'sequence_2_1_octave'
  | 'single_2_octaves'
  | 'last_note_3'
  | 'last_note_4'
  | 'last_note_5'
  | 'sequence_3_1_octave'
  | 'sequence_2_2_octaves';

export interface StageDefinition {
  id: StageId;
  order: number;
  name: string;
  shortName: string;
  playedNoteCount: number;
  requiredAnswerCount: number;
  octaveCount: number;
  isDirectionOnly?: boolean;
  isLastNoteOnly?: boolean;
}

export type PitchDirection = 'up' | 'down' | 'same';

export interface StageProgress {
  currentStreak: number;
  isUnlocked: boolean;
  bestStreak: number;
  totalSolved: number;
}

export type UserProgress = Record<StageId, StageProgress>;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu, LogOut, KeyRound, ShieldCheck, MessageSquare, X } from 'lucide-react';
import {
  NoteInfo,
  StageId,
  PitchDirection,
  UserProgress,
  StageDefinition,
} from './types';
import {
  PIANO_NOTES_OCTAVE_4,
  PIANO_NOTES_2_OCTAVES,
  STAGES_LIST,
} from './utils/notes';
import {
  playPitchSequence,
  playSuccessChime,
  playLevelUnlockedFanfare,
  playErrorBuzz,
} from './utils/audio';
import {
  registerUser,
  loginUser,
  changePassword,
  saveUserProgress,
  testFirestoreConnection,
  getDefaultProgress,
  ADMIN_USERNAME,
} from './utils/firebase';
import { HamburgerMenu } from './components/HamburgerMenu';
import { ListeningStage } from './components/ListeningStage';
import { DirectionStage } from './components/DirectionStage';
import { PianoKeyboard } from './components/PianoKeyboard';
import { NumberAxis } from './components/NumberAxis';
import { AuthModal } from './components/AuthModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AdminDashboard } from './components/AdminDashboard';

const CURRENT_USER_KEY = 'ear_trainer_active_user_v4';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_USER_KEY);
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved === ADMIN_USERNAME;
  });

  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [showNoteBanner, setShowNoteBanner] = useState<boolean>(true);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // User progress strictly isolated
  const [userProgress, setUserProgress] = useState<UserProgress>(getDefaultProgress());

  // Current active stage
  const [currentStageId, setCurrentStageId] = useState<StageId>('direction');

  const currentStage: StageDefinition = useMemo(() => {
    return STAGES_LIST.find((s) => s.id === currentStageId) || STAGES_LIST[0];
  }, [currentStageId]);

  // Round state
  const [targetNotes, setTargetNotes] = useState<NoteInfo[]>([]);
  const [targetDirection, setTargetDirection] = useState<PitchDirection | null>(null);

  const [selectedNotes, setSelectedNotes] = useState<NoteInfo[]>([]);
  const [chosenDirection, setChosenDirection] = useState<PitchDirection | null>(null);

  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [justUnlockedNextStage, setJustUnlockedNextStage] = useState(false);

  // Test Firestore on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Save progress changes to Firebase & localStorage
  const syncProgress = useCallback(
    (newProgress: UserProgress) => {
      setUserProgress(newProgress);
      if (currentUser) {
        saveUserProgress(currentUser, newProgress);
      }
    },
    [currentUser]
  );

  // Handle Login
  const handleLogin = async (username: string, pass: string): Promise<boolean | string> => {
    const res = await loginUser(username, pass);
    if (!res.success) {
      return res.error || 'שגיאה בהתחברות';
    }

    const name = res.displayName || username;
    const isUserAdmin = Boolean(res.isAdmin || name === ADMIN_USERNAME);

    setIsAdmin(isUserAdmin);
    setAdminNote(res.adminNote || null);
    setShowNoteBanner(Boolean(res.adminNote));
    setUserProgress(res.progress ? { ...res.progress } : getDefaultProgress());
    setCurrentUser(name);
    localStorage.setItem(CURRENT_USER_KEY, name);

    return true;
  };

  // Handle Register
  const handleRegister = async (username: string, pass: string): Promise<boolean | string> => {
    const res = await registerUser(username, pass);
    if (!res.success) {
      return res.error || 'שגיאה ביצירת חשבון';
    }

    setIsAdmin(username === ADMIN_USERNAME);
    setAdminNote(null);
    setUserProgress(getDefaultProgress());
    setCurrentUser(username);
    localStorage.setItem(CURRENT_USER_KEY, username);

    return true;
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setAdminNote(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    setUserProgress(getDefaultProgress());
    setCurrentStageId('direction');
  };

  // Handle Change Password
  const handleChangePassword = async (oldPass: string, newPass: string) => {
    if (!currentUser) return { success: false, error: 'לא מחובר' };
    return await changePassword(currentUser, oldPass, newPass);
  };

  // Generate a new round for the given stage
  const generateNewRound = useCallback(
    (stageId: StageId = currentStageId, autoPlay = true) => {
      const stage = STAGES_LIST.find((s) => s.id === stageId) || STAGES_LIST[0];

      setIsAnswerSubmitted(false);
      setIsCorrect(false);
      setJustUnlockedNextStage(false);
      setSelectedNotes([]);
      setChosenDirection(null);

      const pool =
        stage.octaveCount === 2 ? PIANO_NOTES_2_OCTAVES : PIANO_NOTES_OCTAVE_4;

      if (stage.id === 'direction') {
        const randType = Math.random();
        let n1: NoteInfo;
        let n2: NoteInfo;
        let dir: PitchDirection;

        if (randType < 0.3) {
          n1 = pool[Math.floor(Math.random() * pool.length)];
          n2 = n1;
          dir = 'same';
        } else if (randType < 0.65) {
          const idx1 = Math.floor(Math.random() * (pool.length - 2));
          const idx2 = idx1 + 1 + Math.floor(Math.random() * (pool.length - 1 - idx1));
          n1 = pool[idx1];
          n2 = pool[idx2];
          dir = 'up';
        } else {
          const idx1 = 1 + Math.floor(Math.random() * (pool.length - 1));
          const idx2 = Math.floor(Math.random() * idx1);
          n1 = pool[idx1];
          n2 = pool[idx2];
          dir = 'down';
        }

        setTargetNotes([n1, n2]);
        setTargetDirection(dir);

        if (autoPlay) {
          setTimeout(() => {
            playPitchSequence([n1.pitch, n2.pitch], 580);
          }, 150);
        }
      } else {
        // Stages with played notes (1, 2, 3, 4, 5 notes)
        const count = stage.playedNoteCount;
        const chosen: NoteInfo[] = [];

        for (let i = 0; i < count; i++) {
          const note = pool[Math.floor(Math.random() * pool.length)];
          chosen.push(note);
        }

        setTargetNotes(chosen);
        setTargetDirection(null);

        if (autoPlay) {
          setTimeout(() => {
            playPitchSequence(
              chosen.map((n) => n.pitch),
              550
            );
          }, 150);
        }
      }
    },
    [currentStageId]
  );

  // Initialize round on stage change
  useEffect(() => {
    if (currentUser) {
      generateNewRound(currentStageId, true);
    }
  }, [currentStageId, currentUser, generateNewRound]);

  // Play target notes
  const handlePlayTarget = useCallback(() => {
    if (targetNotes.length > 0) {
      playPitchSequence(
        targetNotes.map((n) => n.pitch),
        550
      );
    }
  }, [targetNotes]);

  // Evaluate result
  const evaluateAnswer = (isMatch: boolean) => {
    if (isMatch) {
      setIsCorrect(true);
      setIsAnswerSubmitted(true);

      const stageProg = userProgress[currentStageId] || {
        currentStreak: 0,
        isUnlocked: currentStage.order === 1,
        bestStreak: 0,
        totalSolved: 0,
      };
      const newStreak = stageProg.currentStreak + 1;
      const willUnlockNext = newStreak >= 10;

      const nextProg: UserProgress = {
        ...userProgress,
        [currentStageId]: {
          ...stageProg,
          currentStreak: newStreak,
          bestStreak: Math.max(stageProg.bestStreak, newStreak),
          totalSolved: stageProg.totalSolved + 1,
        },
      };

      if (willUnlockNext) {
        const nextStageDef = STAGES_LIST.find((s) => s.order === currentStage.order + 1);
        if (nextStageDef && !nextProg[nextStageDef.id].isUnlocked) {
          nextProg[nextStageDef.id] = {
            ...nextProg[nextStageDef.id],
            isUnlocked: true,
          };
        }
      }

      syncProgress(nextProg);

      if (willUnlockNext && currentStage.order < STAGES_LIST.length) {
        setJustUnlockedNextStage(true);
        playLevelUnlockedFanfare();
      } else {
        playSuccessChime();
      }
    } else {
      setIsCorrect(false);
      setIsAnswerSubmitted(true);
      playErrorBuzz();

      const stageProg = userProgress[currentStageId] || {
        currentStreak: 0,
        isUnlocked: currentStage.order === 1,
        bestStreak: 0,
        totalSolved: 0,
      };
      const nextProg: UserProgress = {
        ...userProgress,
        [currentStageId]: {
          ...stageProg,
          currentStreak: 0,
        },
      };
      syncProgress(nextProg);
    }
  };

  // Immediate choice for Direction Stage (Stage 1)
  const handleChooseDirection = (dir: PitchDirection) => {
    setChosenDirection(dir);
    const isMatch = dir === targetDirection;
    evaluateAnswer(isMatch);
  };

  // Note selection for Piano Stages
  const handleSelectNote = (note: NoteInfo) => {
    if (isAnswerSubmitted && !isCorrect) {
      setIsAnswerSubmitted(false);
    }

    if (currentStage.requiredAnswerCount === 1) {
      setSelectedNotes([note]);
    } else {
      setSelectedNotes((prev) => {
        if (prev.length < currentStage.requiredAnswerCount) {
          return [...prev, note];
        }
        return [...prev.slice(1), note];
      });
    }
  };

  const handleClearNotes = () => {
    setSelectedNotes([]);
    if (isAnswerSubmitted && !isCorrect) {
      setIsAnswerSubmitted(false);
    }
  };

  const canSubmit = selectedNotes.length === currentStage.requiredAnswerCount;

  // Submit guess for Piano Stages
  const handleSubmitPianoGuess = () => {
    if (!canSubmit || isCorrect) return;

    let isMatch = false;

    if (currentStage.isLastNoteOnly) {
      // Last note in sequence
      const expectedLastNote = targetNotes[targetNotes.length - 1];
      isMatch = selectedNotes.length === 1 && selectedNotes[0].id === expectedLastNote.id;
    } else {
      // Sequence match
      isMatch =
        selectedNotes.length === targetNotes.length &&
        selectedNotes.every((n, i) => n.id === targetNotes[i].id);
    }

    evaluateAnswer(isMatch);
  };

  const currentStreak = userProgress[currentStageId]?.currentStreak || 0;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 p-2.5 sm:p-4 select-none">
      {/* Top Bar: Username on right, Number Axis in center, Clean Hamburger on left */}
      <header className="flex flex-col gap-1 shrink-0 pb-1.5 border-b border-slate-900">
        <div className="flex items-center justify-between px-1">
          {/* Right corner (RTL): שלום [שם המשתמש] + שינוי סיסמה + (אם מנהל: כפתור לוח מנהל) + התנתקות */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
              שלום {currentUser || ''}
            </span>

            {/* Admin Dashboard shortcut if admin */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAdminDashboardOpen(true)}
                className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-900 rounded transition-colors"
                title="לוח מנהל"
                aria-label="לוח מנהל"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Change Password icon */}
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
              title="שינוי סיסמה"
              aria-label="שינוי סיסמה"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            {/* Logout icon */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
              title="התנתק"
              aria-label="התנתק מהחשבון"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Left corner (RTL): Hamburger button ONLY (no text) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 text-amber-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            aria-label="תפריט שלבים"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Number Axis (ציר מספרים 1..10) */}
        <NumberAxis currentStreak={currentStreak} maxStreak={10} />
      </header>

      {/* Teacher Note Banner for Student if present */}
      {adminNote && showNoteBanner && (
        <div className="mt-1 mx-1 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-1.5 truncate">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300 shrink-0">הערת מורה:</span>
            <span className="truncate">{adminNote}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowNoteBanner(false)}
            className="text-amber-400/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Center Zone: Sound Button + Minimal Feedback + CTA */}
      <main className="flex-1 flex flex-col justify-center items-center overflow-hidden my-auto">
        {/* Subtle Stage Hint for Last Note recognition */}
        {currentStage.isLastNoteOnly && (
          <div className="text-[11px] text-amber-300/80 mb-1 font-medium">
            האזן לרצף וזהה את התו האחרון ({currentStage.playedNoteCount})
          </div>
        )}

        <ListeningStage
          onPlayTarget={handlePlayTarget}
          onSubmitGuess={handleSubmitPianoGuess}
          onNext={() => generateNewRound(currentStageId, true)}
          isAnswerSubmitted={isAnswerSubmitted}
          isCorrect={isCorrect}
          canSubmit={canSubmit}
          justUnlockedNextStage={justUnlockedNextStage}
          isDirectionStage={currentStage.id === 'direction'}
        />
      </main>

      {/* Bottom Zone: Stage Interface */}
      <footer className="w-full max-w-2xl mx-auto shrink-0 pb-1">
        {currentStage.id === 'direction' ? (
          <DirectionStage
            onChooseDirection={handleChooseDirection}
            disabled={isCorrect}
            isAnswerSubmitted={isAnswerSubmitted}
            isCorrect={isCorrect}
            chosenDirection={chosenDirection}
            targetDirection={targetDirection}
          />
        ) : (
          <PianoKeyboard
            requiredNoteCount={currentStage.requiredAnswerCount}
            selectedNotes={selectedNotes}
            onSelectNote={handleSelectNote}
            onClearNotes={handleClearNotes}
            targetNotes={targetNotes}
            isAnswerSubmitted={isAnswerSubmitted}
            isCorrect={isCorrect}
            octaveCount={currentStage.octaveCount}
          />
        )}
      </footer>

      {/* Hamburger Stages Menu */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentStageId={currentStageId}
        onSelectStage={(id) => setCurrentStageId(id)}
        userProgress={userProgress}
      />

      {/* Auth Modal for login / register */}
      <AuthModal
        isOpen={!currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onChangePassword={handleChangePassword}
      />

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />
    </div>
  );
}

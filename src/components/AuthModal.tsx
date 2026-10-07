import React, { useState } from 'react';
import { User, Lock, Music, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (username: string, pass: string) => Promise<boolean | string>;
  onRegister: (username: string, pass: string) => Promise<boolean | string>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLogin,
  onRegister,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMsg('נא להזין שם משתמש');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }

    setIsLoading(true);
    try {
      const res = isRegisterMode
        ? await onRegister(cleanUser, password)
        : await onLogin(cleanUser, password);

      if (typeof res === 'string') {
        setErrorMsg(res);
      }
    } catch {
      setErrorMsg('אירעה שגיאה, נא לנסות שוב');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-200">
        {/* Header Icon */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
            <Music className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">
            {isRegisterMode ? 'יצירת חשבון תלמיד' : 'התחברות לאימון שמיעה'}
          </h2>
        </div>

        {/* Toggle Mode */}
        <div className="flex p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              !isRegisterMode
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            התחברות
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              isRegisterMode
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            הרשמה חדשה
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              שם משתמש
            </label>
            <div className="relative">
              <input
                type="text"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="לדוגמה: יונתן"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-9"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              סיסמה
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-9 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px] text-center font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isRegisterMode ? (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>יצירת חשבון והתחלת אימון</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>כניסה לחשבון</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

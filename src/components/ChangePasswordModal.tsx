import React, { useState } from 'react';
import { X, KeyRound, Check, Lock } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onChangePassword,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!oldPassword) {
      setErrorMsg('נא להזין את הסיסמה הנוכחית');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('הסיסמה החדשה חייבת להכיל לפחות 4 תווים');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('אימות הסיסמה אינו תואם');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onChangePassword(oldPassword, newPassword);
      if (res.success) {
        setSuccessMsg('הסיסמה שונתה בהצלחה!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'שגיאה בשינוי הסיסמה');
      }
    } catch {
      setErrorMsg('אירעה שגיאה, נא לנסות שוב');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">שינוי סיסמה</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              סיסמה נוכחית
            </label>
            <div className="relative">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-8 font-mono"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              סיסמה חדשה
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-8 font-mono"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              אימות סיסמה חדשה
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 pr-8 font-mono"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px] text-center font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[11px] text-center font-medium flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            {isLoading ? 'מעדכן...' : 'עדכן סיסמה'}
          </button>
        </form>
      </div>
    </div>
  );
};

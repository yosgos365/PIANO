import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Search,
  Trash2,
  MessageSquarePlus,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  getAllUsersForAdmin,
  deleteUserByAdmin,
  sendAdminNoteToUser,
  AdminUserRecord,
  ADMIN_USERNAME,
} from '../utils/firebase';
import { STAGES_LIST } from '../utils/notes';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Note dialog state
  const [noteUser, setNoteUser] = useState<AdminUserRecord | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSendingNote, setIsSendingNote] = useState(false);

  // Delete confirm state
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const records = await getAllUsersForAdmin();
      setUsers(records);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (username: string) => {
    if (username === ADMIN_USERNAME) return;
    const ok = await deleteUserByAdmin(username);
    if (ok) {
      setUserToDelete(null);
      setUsers((prev) => prev.filter((u) => u.username !== username));
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteUser) return;
    setIsSendingNote(true);
    try {
      await sendAdminNoteToUser(noteUser.username, noteText.trim());
      setUsers((prev) =>
        prev.map((u) =>
          u.username === noteUser.username
            ? { ...u, adminNote: noteText.trim(), adminNoteDate: new Date().toISOString() }
            : u
        )
      );
      setNoteUser(null);
      setNoteText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingNote(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                לוח מנהל · מעקב והנחיית תלמידים
              </h2>
              <span className="text-[11px] text-slate-400">
                סה"כ {users.length} משתמשים רשומים
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="רענן נתונים"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/30 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם תלמיד..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-8"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2" />
              <span>טוען נתוני תלמידים...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500">
              לא נמצאו תלמידים
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isUserSelf = user.username === ADMIN_USERNAME;
              const unlockedStages = STAGES_LIST.filter(
                (s) => user.progress[s.id]?.isUnlocked
              );
              const highestStage =
                unlockedStages[unlockedStages.length - 1]?.shortName || 'שלב 1';

              return (
                <div
                  key={user.username}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] flex items-center justify-center">
                        {user.displayName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {user.displayName} {isUserSelf ? '(מנהל)' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50">
                        {highestStage}
                      </span>

                      {!isUserSelf && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setNoteUser(user);
                              setNoteText(user.adminNote || '');
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              user.adminNote
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="שלח / ערוך הערת מורה לתלמיד"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserToDelete(user.username)}
                            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-800 rounded-lg transition-colors"
                            title="מחק משתמש"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Active Admin Note Banner if exists */}
                  {user.adminNote && (
                    <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-200">הערה שנשלחה: </strong>
                        <span>{user.adminNote}</span>
                      </div>
                    </div>
                  )}

                  {/* Stages Progress Grid (all 9 stages) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                    {STAGES_LIST.map((stage) => {
                      const prog = user.progress[stage.id];
                      const isUnlocked = prog?.isUnlocked;
                      const streak = prog?.currentStreak || 0;
                      const best = prog?.bestStreak || 0;

                      return (
                        <div
                          key={stage.id}
                          className={`p-1.5 rounded-lg border flex items-center justify-between ${
                            isUnlocked
                              ? best >= 10
                                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                              : 'bg-slate-950 border-slate-900 text-slate-600'
                          }`}
                        >
                          <span className="truncate max-w-[85px]">
                            {stage.shortName}
                          </span>
                          <span className="font-mono tabular-nums shrink-0">
                            {isUnlocked ? (
                              best >= 10 ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                              ) : (
                                `${streak}/10`
                              )
                            ) : (
                              <Lock className="w-2.5 h-2.5 text-slate-600 inline" />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <div className="absolute inset-0 bg-slate-950/90 z-20 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs text-center space-y-3">
              <h3 className="text-sm font-bold text-white">מחיקת משתמש</h3>
              <p className="text-xs text-slate-400">
                האם אתה בטוח שברצונך למחוק את המשתמש <strong>{userToDelete}</strong>? פעולה זו תמחק את כל התקדמותו.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(userToDelete)}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                >
                  מחק
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Note Modal */}
        {noteUser && (
          <div className="absolute inset-0 bg-slate-950/90 z-20 flex items-center justify-center p-4">
            <form
              onSubmit={handleSendNote}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MessageSquarePlus className="w-4 h-4 text-amber-400" />
                  הערת מורה ל{noteUser.displayName}
                </h3>
                <button
                  type="button"
                  onClick={() => setNoteUser(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="כתוב כאן משוב או הנחיות לתלמיד..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />

              <div className="flex justify-between items-center">
                {noteUser.adminNote && (
                  <button
                    type="button"
                    onClick={() => {
                      setNoteText('');
                      sendAdminNoteToUser(noteUser.username, '');
                      setNoteUser(null);
                    }}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    מחק הערה קיימת
                  </button>
                )}
                <div className="flex gap-2 mr-auto">
                  <button
                    type="button"
                    onClick={() => setNoteUser(null)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingNote}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    שלח
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center text-[10px] text-slate-500 shrink-0">
          כל נתוני ההתקדמות מסונכרנים בזמן אמת מול הענן
        </div>
      </div>
    </div>
  );
};

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProgress, StageId } from '../types';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const ADMIN_USERNAME = 'יוסי';
export const ADMIN_PASSWORD = '213223';

// Brand new deep copy of progress
export function getDefaultProgress(): UserProgress {
  return {
    direction: { currentStreak: 0, isUnlocked: true, bestStreak: 0, totalSolved: 0 },
    single_1_octave: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
    sequence_2_1_octave: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
    single_2_octaves: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
    last_note_3: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
    last_note_4: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
    last_note_5: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
    sequence_3_1_octave: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
    sequence_2_2_octaves: { currentStreak: 0, isUnlocked: false, bestStreak: 0, totalSolved: 0 },
  };
}

export function mergeWithDefaultProgress(saved: Partial<UserProgress> | null | undefined): UserProgress {
  const def = getDefaultProgress();
  if (!saved) return def;
  const result: UserProgress = { ...def };
  (Object.keys(def) as StageId[]).forEach((stageId) => {
    if (saved[stageId]) {
      result[stageId] = {
        ...def[stageId],
        ...saved[stageId],
      };
    }
  });
  return result;
}

// Clean normalize username (trim, preserve unicode/Hebrew safely)
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// Secure SHA-256 password hashing via Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`salt_ear_trainer_${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const LOCAL_ACCOUNTS_KEY = 'ear_trainer_local_accounts_v4';

interface LocalAccountRecord {
  displayName: string;
  passwordHash: string;
  progress: UserProgress;
  adminNote?: string;
  adminNoteDate?: string;
  updatedAt?: string;
}

function getLocalAccounts(): Record<string, LocalAccountRecord> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccounts(accs: Record<string, LocalAccountRecord>) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accs));
  } catch {
    // ignore
  }
}

// Seed admin account if needed
export async function ensureAdminAccount() {
  const normAdmin = normalizeUsername(ADMIN_USERNAME);
  const adminHash = await hashPassword(ADMIN_PASSWORD);
  const localAccs = getLocalAccounts();

  localAccs[normAdmin] = {
    displayName: ADMIN_USERNAME,
    passwordHash: adminHash,
    progress: getDefaultProgress(),
    updatedAt: new Date().toISOString(),
  };
  saveLocalAccounts(localAccs);

  try {
    const ref = doc(db, 'users', normAdmin);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        username: normAdmin,
        displayName: ADMIN_USERNAME,
        passwordHash: adminHash,
        progress: getDefaultProgress(),
        isAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not seed admin in Firestore:', err);
  }
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is connecting or offline.');
    }
  }
  ensureAdminAccount().catch(() => {});
}

// Register user in Firestore (and local backup)
export async function registerUser(
  rawUsername: string,
  rawPassword: string
): Promise<{ success: boolean; progress?: UserProgress; error?: string }> {
  const normUser = normalizeUsername(rawUsername);
  if (!normUser) {
    return { success: false, error: 'נא להזין שם משתמש' };
  }
  if (rawPassword.length < 4) {
    return { success: false, error: 'הסיסמה חייבת להכיל לפחות 4 תווים' };
  }

  const passHash = await hashPassword(rawPassword);
  const initialProg = getDefaultProgress();

  // 1. Check local cache first
  const localAccs = getLocalAccounts();
  if (localAccs[normUser]) {
    return { success: false, error: 'שם משתמש זה כבר קיים, נא להתחבר' };
  }

  // 2. Check Firestore
  try {
    const userDocRef = doc(db, 'users', normUser);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return { success: false, error: 'שם משתמש זה כבר קיים, נא להתחבר' };
    }

    const newUserData = {
      username: normUser,
      displayName: rawUsername.trim(),
      passwordHash: passHash,
      progress: initialProg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, newUserData);

    localAccs[normUser] = {
      displayName: rawUsername.trim(),
      passwordHash: passHash,
      progress: initialProg,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAccounts(localAccs);

    return { success: true, progress: initialProg };
  } catch (err) {
    console.error('Firestore register error, using local fallback:', err);
    localAccs[normUser] = {
      displayName: rawUsername.trim(),
      passwordHash: passHash,
      progress: initialProg,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAccounts(localAccs);
    return { success: true, progress: initialProg };
  }
}

// Login user from Firestore (with local fallback)
export async function loginUser(
  rawUsername: string,
  rawPassword: string
): Promise<{
  success: boolean;
  displayName?: string;
  progress?: UserProgress;
  adminNote?: string;
  isAdmin?: boolean;
  error?: string;
}> {
  const normUser = normalizeUsername(rawUsername);
  const passHash = await hashPassword(rawPassword);

  // Check admin shortcut
  if (normUser === normalizeUsername(ADMIN_USERNAME) && rawPassword === ADMIN_PASSWORD) {
    return {
      success: true,
      displayName: ADMIN_USERNAME,
      progress: getDefaultProgress(),
      isAdmin: true,
    };
  }

  const localAccs = getLocalAccounts();

  try {
    const userDocRef = doc(db, 'users', normUser);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.passwordHash !== passHash) {
        return { success: false, error: 'סיסמה שגויה' };
      }

      const mergedProgress = mergeWithDefaultProgress(data.progress);

      // Save strictly to local cache for this specific user
      localAccs[normUser] = {
        displayName: data.displayName || rawUsername.trim(),
        passwordHash: data.passwordHash,
        progress: mergedProgress,
        adminNote: data.adminNote,
        adminNoteDate: data.adminNoteDate,
        updatedAt: data.updatedAt,
      };
      saveLocalAccounts(localAccs);

      return {
        success: true,
        displayName: data.displayName || rawUsername.trim(),
        progress: mergedProgress,
        adminNote: data.adminNote,
        isAdmin: Boolean(data.isAdmin || normUser === normalizeUsername(ADMIN_USERNAME)),
      };
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking local:', err);
  }

  // Check local fallback
  if (localAccs[normUser]) {
    if (localAccs[normUser].passwordHash === passHash) {
      const mergedProgress = mergeWithDefaultProgress(localAccs[normUser].progress);

      return {
        success: true,
        displayName: localAccs[normUser].displayName,
        progress: mergedProgress,
        adminNote: localAccs[normUser].adminNote,
        isAdmin: normUser === normalizeUsername(ADMIN_USERNAME),
      };
    }
    return { success: false, error: 'סיסמה שגויה' };
  }

  return { success: false, error: 'משתמש זה אינו קיים, ניתן להירשם' };
}

// Change Password
export async function changePassword(
  rawUsername: string,
  oldPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  if (newPass.length < 4) {
    return { success: false, error: 'הסיסמה החדשה חייבת להכיל לפחות 4 תווים' };
  }

  const normUser = normalizeUsername(rawUsername);
  const oldHash = await hashPassword(oldPass);
  const newHash = await hashPassword(newPass);

  const localAccs = getLocalAccounts();

  try {
    const userDocRef = doc(db, 'users', normUser);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.passwordHash !== oldHash) {
        return { success: false, error: 'הסיסמה הנוכחית שגויה' };
      }

      await updateDoc(userDocRef, {
        passwordHash: newHash,
        updatedAt: new Date().toISOString(),
      });
    } else if (localAccs[normUser]) {
      if (localAccs[normUser].passwordHash !== oldHash) {
        return { success: false, error: 'הסיסמה הנוכחית שגויה' };
      }
    } else {
      return { success: false, error: 'משתמש לא נמצא' };
    }

    if (localAccs[normUser]) {
      localAccs[normUser].passwordHash = newHash;
      saveLocalAccounts(localAccs);
    }

    return { success: true };
  } catch (err) {
    console.error('Password change error:', err);
    if (localAccs[normUser] && localAccs[normUser].passwordHash === oldHash) {
      localAccs[normUser].passwordHash = newHash;
      saveLocalAccounts(localAccs);
      return { success: true };
    }
    return { success: false, error: 'שגיאה בעדכון הסיסמה' };
  }
}

// Save Progress strictly for a specific user
export async function saveUserProgress(
  rawUsername: string,
  progress: UserProgress
) {
  const normUser = normalizeUsername(rawUsername);
  if (!normUser) return;

  const now = new Date().toISOString();

  const localAccs = getLocalAccounts();
  if (localAccs[normUser]) {
    localAccs[normUser].progress = progress;
    localAccs[normUser].updatedAt = now;
    saveLocalAccounts(localAccs);
  }

  try {
    const userDocRef = doc(db, 'users', normUser);
    await setDoc(
      userDocRef,
      {
        progress,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Background Firestore progress sync failed:', err);
  }
}

// Delete user by admin
export async function deleteUserByAdmin(rawUsername: string): Promise<boolean> {
  const normUser = normalizeUsername(rawUsername);
  if (normUser === normalizeUsername(ADMIN_USERNAME)) {
    return false; // Cannot delete admin
  }

  // Remove local
  const localAccs = getLocalAccounts();
  delete localAccs[normUser];
  saveLocalAccounts(localAccs);

  // Remove Firestore
  try {
    await deleteDoc(doc(db, 'users', normUser));
    return true;
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
    return true;
  }
}

// Send admin note/comment to student
export async function sendAdminNoteToUser(
  rawUsername: string,
  noteText: string
): Promise<boolean> {
  const normUser = normalizeUsername(rawUsername);
  const now = new Date().toISOString();

  // Local update
  const localAccs = getLocalAccounts();
  if (localAccs[normUser]) {
    localAccs[normUser].adminNote = noteText;
    localAccs[normUser].adminNoteDate = now;
    saveLocalAccounts(localAccs);
  }

  // Firestore update
  try {
    await updateDoc(doc(db, 'users', normUser), {
      adminNote: noteText,
      adminNoteDate: now,
    });
    return true;
  } catch (err) {
    console.error('Error sending admin note:', err);
    return false;
  }
}

// Fetch all registered users for Admin panel
export interface AdminUserRecord {
  username: string;
  displayName: string;
  progress: UserProgress;
  adminNote?: string;
  adminNoteDate?: string;
  updatedAt?: string;
  createdAt?: string;
}

export async function getAllUsersForAdmin(): Promise<AdminUserRecord[]> {
  try {
    const colSnap = await getDocs(collection(db, 'users'));
    const list: AdminUserRecord[] = [];
    colSnap.forEach((d) => {
      const data = d.data();
      list.push({
        username: data.username || d.id,
        displayName: data.displayName || data.username || d.id,
        progress: mergeWithDefaultProgress(data.progress),
        adminNote: data.adminNote,
        adminNoteDate: data.adminNoteDate,
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
      });
    });

    if (list.length > 0) {
      return list;
    }
  } catch (err) {
    console.error('Error fetching users from Firestore for admin:', err);
  }

  // Fallback to local accounts
  const local = getLocalAccounts();
  return Object.values(local).map((acc) => ({
    username: acc.displayName,
    displayName: acc.displayName,
    progress: mergeWithDefaultProgress(acc.progress),
    adminNote: acc.adminNote,
    adminNoteDate: acc.adminNoteDate,
    updatedAt: acc.updatedAt,
  }));
}

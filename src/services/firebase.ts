import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { AdminUser } from '../types';

// Firebase configuration loaded safely from environment variables (client or node)
function getEnvVar(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return undefined;
}

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || getEnvVar('FIREBASE_API_KEY') || (typeof process !== 'undefined' && process.env?.FIRESTORE_EMULATOR_HOST ? 'test-api-key' : ''),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || '',
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || getEnvVar('FIREBASE_PROJECT_ID') || (typeof process !== 'undefined' && process.env?.FIRESTORE_EMULATOR_HOST ? 'test-project' : ''),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || '',
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || '',
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || '',
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID') || ''
};

// Check if Firebase environment variables are provided
export function isFirebaseConfigured(): boolean {
  if (typeof process !== 'undefined' && process.env?.FIRESTORE_EMULATOR_HOST) {
    return true;
  }
  const apiKey = getEnvVar('VITE_FIREBASE_API_KEY') || getEnvVar('FIREBASE_API_KEY');
  const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID') || getEnvVar('FIREBASE_PROJECT_ID');
  return Boolean(apiKey && apiKey.length > 5 && projectId && projectId.length > 2);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.error("Firebase initialization error:", err);
  }
}

export function setCustomFirestore(customDb: Firestore) {
  db = customDb;
}

export { app, auth, db, storage };

const STORAGE_KEY_ADMIN_SESSION = 'dona_berenjena_admin_session_v1';

export function getStoredAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.baseRole === 'simple') {
        parsed.role = 'simple';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading admin session', e);
  }
  return null;
}

export function saveStoredAdminSession(user: AdminUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    }
  } catch (e) {
    console.error('Error saving admin session', e);
  }
}

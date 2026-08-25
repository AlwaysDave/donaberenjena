import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { AdminUser } from '../types';

// Firebase configuration loaded directly from environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase environment variables are provided
export function isFirebaseConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
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

export { app, auth, db, storage };

const STORAGE_KEY_ADMIN_SESSION = 'dona_berenjena_admin_session_v1';

export function getStoredAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (raw) {
      return JSON.parse(raw);
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

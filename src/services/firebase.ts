import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { Activity, AdminUser, WebMetric } from '../types';
import { INITIAL_CATAS, INITIAL_CURSOS, INITIAL_VIAJES, INITIAL_WEB_METRICS } from '../data/mockData';

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

if (isFirebaseConfigured()) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn("Firebase initialization warning (falling back to demo storage):", err);
  }
}

export { app, auth, db };

// LocalStorage Persistence Keys
const STORAGE_KEY_ACTIVITIES = 'dona_berenjena_activities_v1';
const STORAGE_KEY_METRICS = 'dona_berenjena_metrics_v1';
const STORAGE_KEY_ADMIN_SESSION = 'dona_berenjena_admin_session_v1';

export function getStoredActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading activities from storage', e);
  }
  const defaultList: Activity[] = [...INITIAL_CATAS, ...INITIAL_CURSOS, ...INITIAL_VIAJES];
  saveStoredActivities(defaultList);
  return defaultList;
}

export function saveStoredActivities(activities: Activity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  } catch (e) {
    console.error('Error saving activities to storage', e);
  }
}

export function getStoredMetrics(): WebMetric {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_METRICS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading metrics from storage', e);
  }
  saveStoredMetrics(INITIAL_WEB_METRICS);
  return INITIAL_WEB_METRICS;
}

export function saveStoredMetrics(metrics: WebMetric): void {
  try {
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(metrics));
  } catch (e) {
    console.error('Error saving metrics to storage', e);
  }
}

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

export function saveStoredAdminSession(admin: AdminUser | null): void {
  try {
    if (admin) {
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    }
  } catch (e) {
    console.error('Error saving admin session', e);
  }
}

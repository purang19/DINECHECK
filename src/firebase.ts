import { initializeApp } from 'firebase/app';
import { addDoc, collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import type { SurveyData, StoredSurvey } from './types';

// Firebase config is read from Vite env vars (VITE_*) when provided, and falls
// back to the shared demo project so the app works out of the box. Firebase web
// API keys are not secrets — access is governed by Firestore security rules.
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'gen-lang-client-0340282009',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:137743321901:web:66fed4aeb2644be6ada1a4',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'REDACTED-DEMO-FIREBASE-KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'gen-lang-client-0340282009.firebaseapp.com',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'gen-lang-client-0340282009.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '137743321901',
};

const FIRESTORE_DATABASE_ID =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ?? 'ai-studio-cd655b96-5899-4380-883e-6fb0443311e9';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

export async function submitSurvey(data: SurveyData) {
  const surveysRef = collection(db, 'surveys');
  return addDoc(surveysRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function getSurveysByDate(startDate: string, endDate: string): Promise<StoredSurvey[]> {
  const surveysRef = collection(db, 'surveys');
  const q = query(surveysRef, where('date', '>=', startDate), where('date', '<=', endDate));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<StoredSurvey, 'id'>) }));
}

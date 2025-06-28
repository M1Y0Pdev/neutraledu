import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBpUGDa-HNj5U2tCiqt1BQiCai5XQT7-xQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "neutraledumain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "neutraledumain",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "neutraledumain.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "721523329830",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:721523329830:web:b5339e7a1df59db0250fe7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LQYC0X8TZD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
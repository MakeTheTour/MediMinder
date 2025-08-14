
// src/lib/firebase.ts - SERVER-SIDE ADMIN USE ONLY
import { initializeApp, getApps, getApp, App } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA2KHvo4yu7WkroavIUbmitH3YxqebXzlU",
  authDomain: "mediminder-50jgi.firebaseapp.com",
  projectId: "mediminder-50jgi",
  storageBucket: "mediminder-50jgi.firebasestorage.app",
  messagingSenderId: "811154320643",
  appId: "1:811154320643:web:42107016d08f6bcc568d36",
};

// This is for server-side use (e.g., Genkit flows)
const app: App = getApps().find(app => app.name === 'server') || initializeApp(firebaseConfig, "server");
const db: Firestore = getFirestore(app);

export { db };

// src/lib/firebase.ts - SERVER-SIDE ADMIN USE ONLY
import { initializeApp, getApps, getApp, App } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAiVdC8RuN8ooQ4gGEBZgC5y_8jWoH5Aos",
  authDomain: "mediminder-50jgi.firebaseapp.com",
  projectId: "mediminder-50jgi",
  storageBucket: "mediminder-50jgi.appspot.com",
  messagingSenderId: "811154320643",
  appId: "1:811154320643:web:42107016d08f6bcc568d36",
};

// This is for server-side use (e.g., Genkit flows)
// Using a unique name ensures it doesn't conflict with the client-side app
const app: App = getApps().find(app => app.name === 'server') || initializeApp(firebaseConfig, "server");
const db: Firestore = getFirestore(app);

export { db };

// src/lib/firebase-client.ts - CLIENT-SIDE USE ONLY
import { initializeApp, getApps, getApp, App } from 'firebase/app';
import { getAuth, Auth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAiVdC8RuN8ooQ4gGEBZgC5y_8jWoH5Aos",
  authDomain: "mediminder-50jgi.firebaseapp.com",
  projectId: "mediminder-50jgi",
  storageBucket: "mediminder-50jgi.appspot.com",
  messagingSenderId: "811154320643",
  appId: "1:811154320643:web:42107016d08f6bcc568d36",
};

// Initialize Firebase for client-side usage
// This pattern prevents re-initializing the app on every render
const app: App = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, indexedDBLocalPersistence, browserSessionPersistence]
});
const db: Firestore = getFirestore(app);

export { app, auth, db };
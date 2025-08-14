
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnSjiOBYUbovMxm3yMCD8O8ol8ibr9Y-0",
  authDomain: "mediminder-50jgi.firebaseapp.com",
  projectId: "mediminder-50jgi",
  storageBucket: "mediminder-50jgi.firebasestorage.app",
  messagingSenderId: "811154320643",
  appId: "1:811154320643:web:42107016d08f6bcc568d36",
  measurementId: "",
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

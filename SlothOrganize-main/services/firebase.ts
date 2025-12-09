
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase configuration
// You can get this from the Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD-placeholder",
  authDomain: "sloth-organize.firebaseapp.com",
  projectId: "sloth-organize",
  storageBucket: "sloth-organize.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
// Note: In this demo environment, these might not connect to a real backend unless configured.
// The financeService handles the fallback to local storage if Firebase fails.
let app;
let db: any;
let functions: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  functions = getFunctions(app);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase initialization failed (expected in demo without keys). Falling back to local mode.");
}

export { db, functions, auth };

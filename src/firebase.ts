import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth setup
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID from config
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

// Authorized Admin Email - Replace with your authorized Gmail if needed
// Defaults to the current user email if provided, or replace "ADMIN_EMAIL_HERE"
export const AUTHORIZED_ADMIN_EMAILS = [
  'sramamando@gmail.com', // Active owner email
  'ADMIN_EMAIL_HERE'     // Placeholder for secondary admin
];

export const isAuthorizedAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.some(adminEmail => 
    adminEmail !== 'ADMIN_EMAIL_HERE' && adminEmail.toLowerCase() === email.toLowerCase()
  );
};

export default app;

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth setup
export const auth = getAuth(app);

/**
 * Standard User Google Auth Provider:
 * Configured with prompt: 'select_account' so that any user can select their own Google account
 * without forcing or defaulting to any previously cached admin Google account in the browser.
 */
export const createUserGoogleProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ 
    prompt: 'select_account',
    // Do not set login_hint so it never defaults to the admin email
  });
  return provider;
};

export const googleProvider = createUserGoogleProvider();

// Initialize Firestore with custom database ID from config
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

// Authorized Admin Email - Kept intact as required
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

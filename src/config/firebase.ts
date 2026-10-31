import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

// The Firebase web config is public by design; access control lives in database.rules.json
// and the Cloud Functions. Never add private API keys here or in VITE_* variables.
const firebaseConfig = {
  apiKey: "AIzaSyD3yA24fYoIjcpU7KUmrCF4Z2-rwGwlPFU",
  authDomain: "gen-lang-client-0732239431.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0732239431-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0732239431",
  storageBucket: "gen-lang-client-0732239431.firebasestorage.app",
  messagingSenderId: "655228352742",
  appId: "1:655228352742:web:9cdb90cc296b62df8c6327"
}

// Local testing against the Firebase emulators: set VITE_USE_FIREBASE_EMULATORS=true.
// Emulator mode uses the isolated demo-intensia project so nothing can reach production.
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const emulatorConfig = { ...firebaseConfig, projectId: 'demo-intensia', databaseURL: 'http://127.0.0.1:9000?ns=demo-intensia' };

const app = getApps().length > 0 ? getApp() : initializeApp(useEmulators ? emulatorConfig : firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
// Same region as the Realtime Database and the deployed functions.
export const functions = getFunctions(app, 'asia-southeast1');
export const googleProvider = new GoogleAuthProvider();

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  // Emulator-only helper for automated UI tests (pop-ups can't be driven there). The Auth
  // emulator accepts unsigned test credentials; production builds drop this block.
  (window as any).__emulatorGoogleSignIn = async (email: string, name = email) => {
    const { signInWithCredential } = await import('firebase/auth');
    const idToken = JSON.stringify({ sub: `google-${email}`, email, name, email_verified: true });
    return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  };
}
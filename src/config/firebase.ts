import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD3yA24fYoIjcpU7KUmrCF4Z2-rwGwlPFU",
  authDomain: "gen-lang-client-0732239431.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0732239431-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0732239431",
  storageBucket: "gen-lang-client-0732239431.firebasestorage.app",
  messagingSenderId: "655228352742",
  appId: "1:655228352742:web:9cdb90cc296b62df8c6327"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
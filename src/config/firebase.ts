import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBEOlH6Rt2m5I1aQxH_0KwAbcQZ_JLVv8s",
    authDomain: "intentia-b42c0.firebaseapp.com",
    projectId: "intentia-b42c0",
    storageBucket: "intentia-b42c0.firebasestorage.app",
    messagingSenderId: "62611070672",
    appId: "1:62611070672:web:e6ebdaac1d51ce849348d5",
    measurementId: "G-DRZ9C9JEMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export { analytics };
export default app;

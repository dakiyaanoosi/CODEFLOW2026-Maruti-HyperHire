import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if variables are valid and not placeholders
const isValidConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your_project_id";

let app;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
const googleProvider = new GoogleAuthProvider();

if (isValidConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  if (typeof window !== "undefined") {
    console.warn(
      "HyperHire: Firebase environment variables are missing or default placeholders. " +
        "The application will run in local simulated authentication mode. " +
        "Create a .env.local file with your Firebase credentials to enable cloud persistence."
    );
  }
}

export { auth, db, googleProvider, isValidConfig as isFirebaseConfigured };

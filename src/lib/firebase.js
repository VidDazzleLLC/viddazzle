import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... other config from Firebase console
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { GoogleAuthProvider, signInWithEmailAndPassword };
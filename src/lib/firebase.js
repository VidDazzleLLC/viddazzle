import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBNI2zsHo5i4dNTW-o8BU7R_Xkv8oo_RE4",
  authDomain: "autopilot-auth-48b6e.firebaseapp.com",
  projectId: "autopilot-auth-48b6e",
  storageBucket: "autopilot-auth-48b6e.appspot.com",
  messagingSenderId: "123456789", // Replace with your sender ID from Firebase console
  appId: "1:123456789:web:abcdef1234567890" // Replace with your app ID from Firebase console
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { GoogleAuthProvider, signInWithEmailAndPassword };
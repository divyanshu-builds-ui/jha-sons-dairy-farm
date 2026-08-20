import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY            || 'demo-key',
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN        || 'demo.firebaseapp.com',
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID         || 'demo-project',
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     || 'demo.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId:             process.env.REACT_APP_FIREBASE_APP_ID             || '1:000000000000:web:demo',
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID     || '',
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup };

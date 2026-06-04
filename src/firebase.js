import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBCF7rWVvbLZAB4_RrS8-U3UTMM11g_2TY",
  authDomain: "jacob-rudger.firebaseapp.com",
  databaseURL: "https://jacob-rudger-default-rtdb.firebaseio.com",
  projectId: "jacob-rudger",
  storageBucket: "jacob-rudger.firebasestorage.app",
  messagingSenderId: "326025135655",
  appId: "1:326025135655:web:abe97ec4000b4f74f3b002",
  measurementId: "G-D1KC6WK4KC"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

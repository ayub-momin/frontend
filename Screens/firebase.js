// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA2YyXfQwSnY6kTBCgDsfFZwXU_8CBNWbI",
  authDomain: "attendence-system-abf3f.firebaseapp.com",
  databaseURL: "https://attendence-system-abf3f-default-rtdb.firebaseio.com",
  projectId: "attendence-system-abf3f",
  storageBucket: "attendence-system-abf3f.firebasestorage.app",
  messagingSenderId: "43802258266",
  appId: "1:43802258266:android:01738afae48c209f996163"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Realtime Database
export const db = getDatabase(app);

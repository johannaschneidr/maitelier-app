import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB0MEr32SbIvVS-9fp34jads2OynRBijPc",
    authDomain: "craftpass-f2322.firebaseapp.com",
    projectId: "craftpass-f2322",
    storageBucket: "craftpass-f2322.firebasestorage.app",
    messagingSenderId: "698998504530",
    appId: "1:698998504530:web:12dfdf5a14beec4e82b38b",
    measurementId: "G-G4LPRE6QGR"
  };

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

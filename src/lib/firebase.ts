// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBzcKy97b_Nv20RSrB4HzuI-38A5MnR0GQ",
  authDomain: "the-nook-51fad.firebaseapp.com",
  projectId: "the-nook-51fad",
  storageBucket: "the-nook-51fad.appspot.com",
  messagingSenderId: "1003089859994",
  appId: "1:1003089859994:web:67ec730833043192129623",
  measurementId: "G-TNMQEL95NS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

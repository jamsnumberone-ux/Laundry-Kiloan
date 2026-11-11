// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCG_b0ROQpqAoBYOTTH27LoUIf_tCzuAmk",
  authDomain: "laundry-kiloan-aee8f.firebaseapp.com",
  projectId: "laundry-kiloan-aee8f",
  storageBucket: "laundry-kiloan-aee8f.firebasestorage.app",
  messagingSenderId: "476305452999",
  appId: "1:476305452999:web:68109620fe2d79a589f3e2",
  measurementId: "G-0VHZP7LCEH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

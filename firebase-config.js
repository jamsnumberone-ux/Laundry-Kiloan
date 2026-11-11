// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG_b0ROQpqAoBYOTTH27LoUIf_tCzuAmk",
  authDomain: "laundry-kiloan-aee8f.firebaseapp.com",
  projectId: "laundry-kiloan-aee8f",
  storageBucket: "laundry-kiloan-aee8f.firebasestorage.app",
  messagingSenderId: "476305452999",
  appId: "1:476305452999:web:68109620fe2d79a589f3e2",
  measurementId: "G-0VHZP7LCEH"
};

// Cek apakah file ini jalan
console.log("Firebase config loaded!"); 

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// firebase-config.js

// PERBAIKAN: Import wajib pakai link URL (CDN), bukan "firebase/app"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Hapus getAnalytics kalau nggak dipake buat ngurangin beban loading
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js"; 

const firebaseConfig = {
  apiKey: "AIzaSyCG_b0ROQpqAoBYOTTH27LoUIf_tCzuAmk",
  authDomain: "laundry-kiloan-aee8f.firebaseapp.com",
  projectId: "laundry-kiloan-aee8f",
  storageBucket: "laundry-kiloan-aee8f.firebasestorage.app",
  messagingSenderId: "476305452999",
  appId: "1:476305452999:web:68109620fe2d79a589f3e2",
  measurementId: "G-0VHZP7LCEH"
};

// Initialize Firebase & export Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

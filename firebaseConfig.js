// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// UBAH 1: Import initializeAuth dan getReactNativePersistence
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// UBAH 2: Import AsyncStorage
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6qx0e1h7i515xoizJ2gEVoX6VsgAKPoE",
  authDomain: "autodidak-firebase-8b787.firebaseapp.com",
  projectId: "autodidak-firebase-8b787",
  storageBucket: "autodidak-firebase-8b787.firebasestorage.app",
  messagingSenderId: "541812902041",
  appId: "1:541812902041:web:8344ad20ca83b24c405008"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// UBAH 3: Inisialisasi Auth dengan Persistence (Penyimpanan Permanen)
// Kita gunakan try-catch atau logika sederhana agar aman di berbagai platform
let auth;

try {
  // Coba inisialisasi dengan AsyncStorage (untuk React Native/Expo)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  // Jika gagal (misal karena sudah terinisialisasi sebelumnya), gunakan getAuth biasa
  auth = getAuth(app);
}

// Ekspor layanan
// Halaman lain tetap mengimport 'auth' seperti biasa tanpa tahu bedanya
export { auth }; 
export const db = getFirestore(app);
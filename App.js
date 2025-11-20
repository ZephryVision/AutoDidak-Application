import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Impor listener auth dari Firebase
import { onAuthStateChanged } from 'firebase/auth';
// Impor auth dari file config kita
import { auth } from './firebaseConfig';

// Impor semua Screen
import LoginScreen from './Screen/LoginScreen';
import RegisterScreen from './Screen/RegisterScreen';
import HomeScreen from './Screen/HomeScreen';
import SkillTree from './Screen/SkillTree';

// Buat "Stack" navigasi
const Stack = createNativeStackNavigator();

export default function App() {
  // State untuk menyimpan data user yang sedang login
  // null = tidak ada user, object = ada user
  const [currentUser, setCurrentUser] = useState(null);

  // State untuk mengecek status loading
  const [isLoading, setIsLoading] = useState(true);

  // useEffect akan berjalan SEKALI saat aplikasi pertama dimuat
  useEffect(() => {
    // onAuthStateChanged adalah "pendengar"
    // Dia akan otomatis mengecek apakah ada user
    // yang sesi login-nya tersimpan di HP
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Jika 'user' ada, masukkan ke state. Jika tidak, 'user' akan 'null'
      setCurrentUser(user);
      setIsLoading(false); // Selesai loading
    });

    // Membersihkan listener saat komponen tidak lagi dipakai
    return () => unsubscribe();
  }, []);

  // Tampilkan layar loading jika listener belum selesai mengecek
  if (isLoading) {
    // Anda bisa membuat komponen loading yang lebih bagus nanti
    return null;
  }

  // Ini adalah "Penjaga Gerbang" utama
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {currentUser ? (
          // === JIKA SUDAH LOGIN ===
          // Hanya tampilkan HomeScreen
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Daftar Tugas Anda' }} // Judul di header
            />
            <Stack.Screen
              name="SkillTree"
              component={SkillTree}
              options={{ title: 'Visualisasi Graph Level' }}
            />
          </>
        ) : (
          // === JIKA BELUM LOGIN ===
          // Tampilkan layar Login dan Register
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }} // Sembunyikan header
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Daftar Akun' }} // Judul di header
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
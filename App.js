import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Impor listener auth dari Firebase
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

// Impor semua Screen
import LoginScreen from './Screen/LoginScreen';
import RegisterScreen from './Screen/RegisterScreen';
import HomeScreen from './Screen/HomeScreen';
import SkillTree from './Screen/SkillTree';
import AskPage from './Screen/AskPage'; // <--- Halaman Tambahan

// Impor Custom Splash buatan kita
import CustomSplash from './Screen/CustomSplash';

// Buat "Stack" navigasi
const Stack = createNativeStackNavigator();

export default function App() {

  // State untuk menyimpan data user yang sedang login
  const [currentUser, setCurrentUser] = useState(null);

  // State untuk mengecek status loading awal
  const [isLoading, setIsLoading] = useState(true);

  // State untuk splash kedua (splash custom setelah splash bawaan Expo)
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // Gunakan effect untuk menyembunyikan splash custom
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCustomSplash(false);
    }, 2000); // lama splash kedua (2 detik)

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cek apakah user sudah login sebelumnya di memori HP
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false); // Stop loading setelah status didapat
    });

    return () => unsubscribe();
  }, []);

  // ================
  // SPLASH 2: tampilkan splash manual sebelum semuanya
  // (Hooks sudah terpanggil duluan, jadi aman)
  // ================
  if (showCustomSplash) {
    return <CustomSplash />;
  }

  // Tampilkan Loading Spinner saat aplikasi baru dibuka (cek login)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EAFF54" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* screenOptions={{ headerShown: false }} menyembunyikan header default di SEMUA halaman */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {currentUser ? (
          // ==========================================
          // JIKA SUDAH LOGIN (User Masuk ke Sini)
          // ==========================================
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AskPage" component={AskPage} />
            <Stack.Screen name="SkillTree" component={SkillTree} />
          </>
        ) : (
          // ==========================================
          // JIKA BELUM LOGIN (User Masuk ke Sini)
          // ==========================================
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

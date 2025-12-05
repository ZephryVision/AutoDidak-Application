import React, { useState } from 'react';
// Tambahkan 'TouchableOpacity' untuk membuat tombol kustom
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";

import { globalStyles, Colors } from '../Styles/GlobalStyles';

// Terima prop 'navigation'
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Email dan Password tidak boleh kosong!');
      return;
    }
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Berhasil login
        // Kita tidak perlu Alert lagi, karena App.js
        // akan otomatis mendeteksi login dan pindah ke HomeScreen!
        console.log('User berhasil login:', userCredential.user.email);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Error', 'Email atau Password salah.');
      });
  };

  return (
    // --- (GUNAKAN STYLE GLOBAL) ---
    <View style={globalStyles.container}>
      <Text style={[globalStyles.title, { fontSize: 28 }]}>Selamat Datang!</Text>
      <TextInput
        style={globalStyles.input} // <-- Gunakan global
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={globalStyles.input} // <-- Gunakan global
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />
      {/* Gunakan warna global */}
      <Button title="Login" onPress={handleLogin} color={Colors.primary} />

      <TouchableOpacity
        style={localStyles.registerLink} // <-- Gunakan style lokal
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={localStyles.registerText}>
          Belum punya akun?
          <Text style={localStyles.registerButtonText}> Daftar di sini</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- (PERHATIKAN) ---
// StyleSheet lokal sekarang JAUH LEBIH KECIL
// dan hanya berisi style yang spesifik untuk layar ini.
const localStyles = StyleSheet.create({
  registerLink: {
    marginTop: 20,
  },
  registerText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
  },
  registerButtonText: {
    color: Colors.primary, // <-- Gunakan warna global
    fontWeight: 'bold',
  }
});
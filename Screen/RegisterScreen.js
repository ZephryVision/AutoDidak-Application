import React, { useState } from 'react';
// Tambahkan 'TouchableOpacity'
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from "firebase/auth";

import { globalStyles, Colors } from '../Styles/GlobalStyles';


// Terima prop 'navigation'
export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // ... (Fungsi handleRegister tetap sama, tidak perlu diubah) ...
    if (email === '' || password === '') {
      Alert.alert('Error', 'Email dan Password tidak boleh kosong!');
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('User berhasil terdaftar:', user.email);
        Alert.alert('Sukses', 'Akun berhasil didaftarkan! Silakan login.');
        // Setelah daftar, otomatis pindah ke layar Login
        navigation.navigate('Login');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Error [${errorCode}]: ${errorMessage}`);
        if (errorCode === 'auth/email-already-in-use') {
          Alert.alert('Error', 'Email ini sudah terdaftar.');
        } else if (errorCode === 'auth/weak-password') {
          Alert.alert('Error', 'Password terlalu lemah (minimal 6 karakter).');
        } else {
          Alert.alert('Error', errorMessage);
        }
      });
  };

  return (
    // --- (GUNAKAN STYLE GLOBAL) ---
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Daftar Akun Baru</Text>
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
        placeholder="Password (min. 6 karakter)"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />
      {/* Gunakan warna global */}
      <Button title="Daftar" onPress={handleRegister} color={Colors.primary} />

      <TouchableOpacity 
        style={localStyles.loginLink} // <-- Gunakan style lokal
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={localStyles.loginText}>
          Sudah punya akun? <Text style={localStyles.loginButtonText}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- (StyleSheet lokal jadi lebih kecil) ---
const localStyles = StyleSheet.create({
  loginLink: {
    marginTop: 20,
  },
  loginText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
  },
  loginButtonText: {
    color: Colors.primary, // <-- Gunakan warna global
    fontWeight: 'bold',
  }
});
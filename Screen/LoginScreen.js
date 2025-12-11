import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ImageBackground,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Email dan Password tidak boleh kosong!');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login sukses:', userCredential.user.email);
      setLoading(false);
      navigation.replace("Home");
    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert('Gagal Login', 'Email atau password salah.');
    }
  };

  return (
    <ImageBackground
      source={require("../assets/beglon.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* --- PERBAIKAN DI SINI --- */}
        {/* Ganti TouchableWithoutFeedback dengan ScrollView */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overlay}>

            {/* Judul */}
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Masuk</Text>
              <View style={styles.underline} />
            </View>

            {/* Form Login */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Masukkan password"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={22}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tombol Login */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text style={styles.buttonText}>Masuk</Text>
                )}
              </TouchableOpacity>

              {/* Link Daftar */}
              <View style={styles.registerSection}>
                <Text>Belum punya akun?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                  <Text style={styles.registerText}> Daftar</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
        {/* --- AKHIR PERBAIKAN --- */}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', // Pastikan width 100%
    height: '100%',
    alignSelf: 'center'
  },
  overlay: {
    flex: 1,
    paddingTop: 180,
    paddingBottom: 50, // Tambahan padding bawah agar enak di-scroll
  },
  titleWrapper: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  underline: {
    width: 110,
    height: 6,
    backgroundColor: "#d9ff00",
    marginTop: -5,
    borderRadius: 5,
  },
  formContainer: {
    paddingHorizontal: 0,
  },
  inputContainer: {
    marginTop: 20,
    marginHorizontal: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 2,
    borderColor: "black",
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 5,
  },
  eyeIcon: {
    position: "absolute",
    right: 0,
    padding: 10,
  },
  button: {
    marginTop: 50,
    marginHorizontal: 40,
    backgroundColor: "#d9ff00",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  registerSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontWeight: "bold",
    textDecorationLine: 'underline',
  },
});
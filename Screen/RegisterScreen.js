import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from '../firebaseConfig'; // Mundur satu folder
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Email dan Password wajib diisi.');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan Login.');
        navigation.navigate("Login");
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('Gagal', 'Email sudah terdaftar.');
        } else if (error.code === 'auth/weak-password') {
          Alert.alert('Gagal', 'Password terlalu lemah (min 6 karakter).');
        } else {
          Alert.alert('Error', error.message);
        }
      });
  };

  return (
    // FIX: Path gambar harus '../assets/'
    <ImageBackground
      source={require("../assets/beglon2.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Tombol Back */}
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={26} color="black" />
          </TouchableOpacity>

          {/* Judul */}
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>Daftar</Text>
            <View style={styles.underline} />
          </View>

          {/* Form Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput 
              style={styles.input}
              placeholder="Masukkan username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {/* Form Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input}
              placeholder="Masukkan e-mail"
              keyboardType="email-address"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          {/* Form Password */}
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

          {/* Tombol Lanjut */}
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Lanjut</Text>
          </TouchableOpacity>

          {/* Link Masuk */}
          <View style={styles.registerSection}>
            <Text>Sudah punya akun?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.registerText}> Masuk</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingTop: 160,
    paddingBottom: 50,
  },
  backIcon: {
    position: "absolute",
    top: 60,
    left: 25,
    zIndex: 10,
  },
  titleWrapper: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
  },
  underline: {
    width: 110,
    height: 6,
    backgroundColor: "#d9ff00",
    marginTop: -5,
    borderRadius: 5,
  },
  inputContainer: {
    marginTop: 15,
    marginHorizontal: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1.6,
    borderColor: "black",
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Transparan
    paddingHorizontal: 5,
  },
  eyeIcon: {
    position: "absolute",
    right: 0,
    padding: 10,
  },
  button: {
    marginTop: 60,
    marginHorizontal: 40,
    backgroundColor: "#d9ff00",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  registerSection: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    fontWeight: "bold",
    textDecorationLine: 'underline',
  },
});
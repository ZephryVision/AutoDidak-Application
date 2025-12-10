import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, // Komponen utama untuk wallpaper
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from '../firebaseConfig'; // Mundur satu folder untuk cari config
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
      // Pindah ke Home (Daftar Tugas) dan reset history agar tidak bisa back ke login
      navigation.replace("Home");
    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert('Gagal Login', 'Email atau password salah.');
    }
  };

  return (
    // FIX: Gunakan '../assets/' karena file ini ada di dalam folder 'Screen'
    <ImageBackground
      source={require("../assets/beglon.png")} 
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            
            {/* Tombol Kembali (Opsional) */}
            {/* <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={26} color="black" />
            </TouchableOpacity> */}

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
        </TouchableWithoutFeedback>
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
  overlay: {
    flex: 1,
    paddingTop: 180, // Sesuaikan agar pas dengan desain gambar
  },
  backIcon: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
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
    // Container form transparan (polosan)
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
    // Background sedikit putih transparan agar teks terbaca jelas di atas gambar
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
    // Shadow untuk efek timbul
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
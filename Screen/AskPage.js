import React, { useState, useEffect } from "react"; 
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ImageBackground, 
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Dimensions,
  Alert // Import Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function AskPage({ navigation }) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSubmit = () => {
    // 1. Validasi Input Kosong
    if (question.trim() === "") {
      if (Platform.OS === 'web') {
        window.alert("Ups! Tulis pertanyaanmu dulu ya.");
      } else {
        Alert.alert("Ups!", "Tulis pertanyaanmu dulu ya.");
      }
      return;
    }
    
    // 2. Logika Sukses (Dibedakan Web vs Native)
    if (Platform.OS === 'web') {
      // --- KHUSUS WEB ---
      // Web tidak support tombol callback di Alert.alert standar
      // Jadi kita pakai window.alert biasa, lalu langsung navigate
      window.alert("Terkirim! Pertanyaanmu sudah dikirim ke sistem.");
      navigation.navigate("Home");
    } else {
      // --- KHUSUS HP (ANDROID/IOS) ---
      // Bisa pakai Alert cantik dengan tombol OK
      Alert.alert("Terkirim!", "Pertanyaanmu sudah dikirim ke sistem.", [
        { text: "OK", onPress: () => navigation.navigate("Home") }
      ]);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/AskPage.png")}
      style={styles.bg}
      resizeMode="stretch"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContainer, 
              { paddingBottom: isKeyboardVisible ? 20 : 0 } 
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={26} color="black" />
              </TouchableOpacity>
            </View>

            <View style={styles.contentWrapper}>
              <Text style={styles.title}>Mau nanya apa nih?</Text>

              <Image 
                source={require("../assets/robot.png")}
                style={styles.robot}
                resizeMode="contain"
              />

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Pertanyaan</Text>
                <Text style={styles.cardDesc}>
                  Silakan ketik pertanyaanmu di bawah ini:
                </Text>

                <TextInput
                  style={styles.input}
                  multiline
                  placeholder="Ketik sesuatu..."
                  placeholderTextColor="#888"
                  value={question}
                  onChangeText={setQuestion}
                />

                {/* TOMBOL SUBMIT */}
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitText}>Kirim Pertanyaan</Text>
                </TouchableOpacity>

              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { 
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0, top: 0,
  },
  
  scrollContainer: { flexGrow: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10, 
    marginBottom: 10,
  },

  backButton: {
    backgroundColor: 'rgba(255,255,255,0.8)', 
    padding: 8,
    borderRadius: 20,
    elevation: 2,
  },

  contentWrapper: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginVertical: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', 
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
  },

  robot: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "white",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 40,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  cardDesc: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: "#fafafa",
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  submitButton: {
    backgroundColor: "#d9ff00",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  
  submitText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  }
});
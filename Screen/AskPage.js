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
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebaseConfig';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc
} from "firebase/firestore";

const API_KEY = "AIzaSyBQgNxjqDajcSbr-1d6UrtkbtLwTy0QUnM";
const genAI = new GoogleGenerativeAI(API_KEY);


export default function AskPage({ navigation }) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);



  const DEFAULT_SKILL_TREE = [
    { id: 'orientasi', name: 'Orientasi Awal', unlocked: true, children: ['algoritma_dasar', 'pemrograman_dasar'], icon: { lib: 'MCI', name: 'flag-checkered' } },
    { id: 'algoritma_dasar', name: 'Algoritma & Logika', unlocked: false, children: ['representasi_algoritma', 'struktur_dasar_algoritma'], icon: { lib: 'MCI', name: 'brain' } },
    { id: 'representasi_algoritma', name: 'Flowchart', unlocked: false, children: [], icon: { lib: 'MCI', name: 'file-tree' } },
    { id: 'struktur_dasar_algoritma', name: 'Sekuensial', unlocked: false, children: ['struktur_data_fungsi'], icon: { lib: 'MCI', name: 'format-list-numbered' } },
    { id: 'struktur_data_fungsi', name: 'Struktur Data', unlocked: false, children: ['list_array', 'dictionary_map', 'kompleksitas'], icon: { lib: 'MCI', name: 'database' } },
    { id: 'list_array', name: 'List / Array', unlocked: false, children: [], icon: { lib: 'MCI', name: 'code-brackets' } },
    { id: 'dictionary_map', name: 'Dictionary', unlocked: false, children: [], icon: { lib: 'MCI', name: 'book-open-page-variant' } },
    { id: 'kompleksitas', name: 'Kompleksitas', unlocked: false, children: [], icon: { lib: 'MCI', name: 'chart-line' } },
    { id: 'pemrograman_dasar', name: 'Sintaks Python', unlocked: false, children: ['variabel_tipe_data'], icon: { lib: 'MCI', name: 'language-python' } },
    { id: 'variabel_tipe_data', name: 'Variabel', unlocked: false, children: ['operator'], icon: { lib: 'MCI', name: 'variable' } },
    { id: 'operator', name: 'Operator', unlocked: false, children: ['percabangan'], icon: { lib: 'MCI', name: 'calculator' } },
    { id: 'percabangan', name: 'Percabangan', unlocked: false, children: ['perulangan'], icon: { lib: 'MCI', name: 'call-split' } },
    { id: 'perulangan', name: 'Perulangan', unlocked: false, children: ['fungsi'], icon: { lib: 'MCI', name: 'refresh' } },
    { id: 'fungsi', name: 'Fungsi', unlocked: false, children: ['penerapan_algoritma'], icon: { lib: 'MCI', name: 'function' } },
    { id: 'penerapan_algoritma', name: 'Studi Kasus', unlocked: false, children: ['searching', 'sorting'], icon: { lib: 'FA5', name: 'search' } },
    { id: 'searching', name: 'Searching', unlocked: false, children: [], icon: { lib: 'IO', name: 'search-circle' } },
    { id: 'sorting', name: 'Sorting', unlocked: false, children: ['proyek_mini'], icon: { lib: 'MCI', name: 'sort-variant' } },
    { id: 'proyek_mini', name: 'FINAL PROJECT', unlocked: false, children: [], icon: { lib: 'MCI', name: 'trophy-award' } },
  ];

  const handleSubmit = async () => {
    if (question.trim() === "") {
      if (Platform.OS === 'web') {
        window.alert("Ups! Tulis pertanyaanmu dulu ya.");
      } else {
        Alert.alert("Ups!", "Tulis pertanyaanmu dulu ya.");
      }
      return;
    }



    try {
      const user = auth.currentUser;
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const prompt = `
        Anda adalah arsitek kurikulum coding yang ahli. Tugas Anda membuat roadmap belajar (Skill Tree) bertingkat untuk topik: "${question}".
        
        ATURAN STRICT OUTPUT (JANGAN DILANGGAR):
        1. Keluaran HARUS berupa JSON Array murni. Jangan gunakan Markdown (\`\`\`json).
        2. Gunakan Double Quotes (") untuk semua key dan value string. (Contoh: "id": "1").
        3. Struktur Objek Wajib:
          { 
            "id": "string_unik_tanpa_spasi", 
            "name": "Nama Skill (Maks 4 kata)", 
            "unlocked": boolean, 
            "children": ["array_id_node_anak"], 
            "icon": { "lib": "MCI", "name": "string_nama_icon" }
          }

        4. LOGIKA NODE & HIERARKI:
          - Node pertama (Root) harus "unlocked": true. Sisanya false.
          - Field "children" berisi ID dari node yang menjadi turunan materi tersebut.
          - Buat minimal 6-10 node yang tersusun dari Basic -> Intermediate -> Advanced.
          - Pastikan semua node saling terhubung (tidak ada node yatim piatu selain root).

        5. ATURAN ICON (PENTING):
          - Gunakan library "MCI" (MaterialCommunityIcons) saja.
          - Nama icon HANYA BOLEH memilih dari daftar aman ini (pilih yang paling relevan):
            ["flag-checkered", "brain", "sitemap", "format-list-numbered", "database", "code-brackets", "book-open-variant", "chart-line", "language-python", "variable", "calculator", "call-split", "refresh", "function", "search-web", "sort-variant", "trophy", "laptop", "server", "web", "android", "apple", "rocket"]
          - JANGAN MENGARANG nama icon lain (contoh: jangan tulis "flowchart", pakailah "sitemap").

        CONTOH FORMAT YANG BENAR:
        [
          { 
            "id": "root_intro", 
            "name": "Pengenalan", 
            "unlocked": true, 
            "children": ["logic_basic"], 
            "icon": { "lib": "MCI", "name": "flag-checkered" } 
          },
          { 
            "id": "logic_basic", 
            "name": "Logika Dasar", 
            "unlocked": false, 
            "children": ["vars", "loops"], 
            "icon": { "lib": "MCI", "name": "brain" } 
          },
          { 
            "id": "vars", 
            "name": "Variabel", 
            "unlocked": false, 
            "children": [], 
            "icon": { "lib": "MCI", "name": "variable" } 
          },
          { 
            "id": "loops", 
            "name": "Perulangan", 
            "unlocked": false, 
            "children": [], 
            "icon": { "lib": "MCI", "name": "refresh" } 
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const data = JSON.parse(text);


      if (!user) return;
      await addDoc(collection(db, "users", user.uid, "tasks"), {
        name: question,
        completed: false,
        createdAt: new Date(),
        skillTreeData: data,
      });
      if (Platform.OS === 'web') {
        navigation.navigate("Home");
      } else {
        Alert.alert("Terkirim!", "Pertanyaanmu sudah dikirim ke sistem.", [
          { text: "OK", onPress: () => navigation.navigate("Home") }
        ]);
      }
      setQuestion('');
    } catch (e) {
      Alert.alert('Error', 'Gagal menambah data');
      console.log(e);
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

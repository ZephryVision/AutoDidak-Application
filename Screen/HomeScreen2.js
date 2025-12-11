import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { db, auth } from '../firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { signOut } from 'firebase/auth';
import { globalStyles, Colors } from '../Styles/GlobalStyles';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- KONFIGURASI API GEMINI ---
const API_KEY = "AIzaSyCrvWK0dyIXxbPsfIl6wxJSGSnqmTxqPhQ";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Fungsi untuk memanggil Gemini API dan menghasilkan Skill Tree dalam format JSON.
 * @param {string} topic - Topik yang ingin dibuatkan roadmap-nya.
 * @returns {Promise<Array<object>>} 
 */
export const generateSkillTree = async (topic) => {
  if (!topic || topic.trim() === "") {
    console.error("Topik tidak boleh kosong.");
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Anda adalah arsitek kurikulum. Tugas Anda membuat roadmap belajar (Skill Tree) untuk topik: "${topic}".
      
      Aturan Output:
      1. Format WAJIB berupa JSON Array.
      2. Struktur objek harus persis seperti ini:
         { 
           "id": "string unik", 
           "label": "Nama Skill (maks 4 kata)", 
           "parents": ["id node induk"] 
         }
      3. Node pertama (root) parents-nya adalah array kosong [].
      4. Node berikutnya harus punya parent dari node sebelumnya.
      5. Buatlah minimal 6 node yang bertingkat dari Basic -> Advanced.

      Contoh Output (JSON Murni):
      [
        { "id": "step_1", "label": "Dasar Pengenalan", "parents": [] },
        { "id": "step_2", "label": "Instalasi Tools", "parents": ["step_1"] }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const data = JSON.parse(text);
    return data;

  } catch (error) {
    console.error("Error generating skill tree:", error);
    return [];
  }
};


// === TEMPLATE SKILL TREE (Fallback jika Gemini gagal) ===
const DEFAULT_SKILL_TREE = [
  { id: 'orientasi', label: 'Orientasi Awal', parents: [], unlocked: true },
  { id: 'algoritma_dasar', label: 'Algoritma & Logika', parents: ['orientasi'], unlocked: false },
  { id: 'representasi_algoritma', label: 'Flowchart', parents: ['algoritma_dasar'], unlocked: false },
  { id: 'pemrograman_dasar', label: 'Sintaks Python', parents: ['orientasi'], unlocked: false },
  { id: 'variabel_tipe_data', label: 'Variabel', parents: ['pemrograman_dasar'], unlocked: false },
  { id: 'operator', label: 'Operator', parents: ['variabel_tipe_data'], unlocked: false },
];


export default function HomeScreen({ navigation }) {
  const [taskName, setTaskName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false); // State untuk loading Gemini

  const handleLogout = () => {
    signOut(auth).catch(error => console.error('Error logging out: ', error));
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={handleLogout} title="Logout" color={Colors.danger} />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "tasks"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksArray = [];
      querySnapshot.forEach((doc) => {
        tasksArray.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksArray);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNGSI UTAMA: MENAMBAH TUGAS (INTEGRASI GEMINI DI SINI) ---
  const handleAddTask = async () => {
    if (taskName.trim() === '') {
      Alert.alert('Error', 'Nama tugas tidak boleh kosong');
      return;
    }

    setIsGenerating(true);

    let generatedSkillTree = [];

    try {
      console.log("Memanggil Gemini untuk topik:", taskName);

      generatedSkillTree = await generateSkillTree(taskName);

      if (generatedSkillTree.length === 0) {
        console.warn("AI gagal menghasilkan Skill Tree (Output kosong), menggunakan template default.");
        generatedSkillTree = DEFAULT_SKILL_TREE;
      }

    } catch (e) {
      console.error("Kesalahan saat memproses Gemini: ", e);
      Alert.alert('Error AI', 'Gagal membuat kurikulum dari AI. Menggunakan template dasar.');
      generatedSkillTree = DEFAULT_SKILL_TREE; // Fallback jika error
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "users", user.uid, "tasks"), {
        name: taskName,
        completed: false,
        createdAt: new Date(),
        skillTreeData: generatedSkillTree,
      });

      setTaskName('');
    } catch (e) {
      console.error("Error menambah data Firebase: ", e);
      Alert.alert('Error', 'Gagal menambah data ke Firebase');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateTask = async (taskId, currentCompletedStatus) => {
    const user = auth.currentUser;
    if (!user) return;
    const taskRef = doc(db, "users", user.uid, "tasks", taskId);
    try {
      await updateDoc(taskRef, {
        completed: !currentCompletedStatus
      });
    } catch (e) {
      console.error("Error update data: ", e);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const user = auth.currentUser;
    if (!user) return;
    const taskRef = doc(db, "users", user.uid, "tasks", taskId);
    try {
      await deleteDoc(taskRef);
    } catch (e) {
      console.error("Error delete data: ", e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={localStyles.taskItem}>
      {/* 1. JUDUL */}
      <View style={localStyles.headerContainer}>
        <Text style={[
          localStyles.taskText,
          item.completed ? localStyles.taskCompleted : null
        ]}>
          {item.name}
        </Text>
      </View>

      {/* 2. TOMBOL PROGRESS */}
      <TouchableOpacity
        style={localStyles.progressButton}
        onPress={() => navigation.navigate('SkillTree', {
          skillTreeData: item.skillTreeData,
          taskId: item.id
        })}
      >
        <Text style={localStyles.progressButtonText}>
          🚀 LIHAT SKILL TREE
        </Text>
      </TouchableOpacity>

      {/* 3. TOMBOL AKSI */}
      <View style={localStyles.actionContainer}>
        {/* Tombol Kiri (Selesai/Batal) */}
        <TouchableOpacity
          style={[localStyles.actionButton, localStyles.updateButton]}
          onPress={() => handleUpdateTask(item.id, item.completed)}
        >
          <Text style={localStyles.buttonText} numberOfLines={1}>
            {item.completed ? '↩ Batal' : '✓ Selesai'}
          </Text>
        </TouchableOpacity>

        {/* Spacer (Jarak Pengganti Gap) */}
        <View style={{ width: 10 }} />

        {/* Tombol Kanan (Hapus) */}
        <TouchableOpacity
          style={[localStyles.actionButton, localStyles.deleteButton]}
          onPress={() => handleDeleteTask(item.id)}
        >
          <Text style={localStyles.buttonText} numberOfLines={1}>🗑 Hapus</Text>
        </TouchableOpacity>
      </View>

    </View>
  );

  return (
    <View style={localStyles.container}>
      <TextInput
        style={globalStyles.input}
        placeholder="Nama Topik Baru..."
        onChangeText={setTaskName}
        value={taskName}
        editable={!isGenerating}
      />

      {/* Tampilkan tombol HANYA jika ada input */}
      {taskName.trim().length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Button
            title={isGenerating ? "Menciptakan Kurikulum..." : "Buat Kurikulum"}
            onPress={handleAddTask}
            color={Colors.primary}
            disabled={isGenerating} // Disable saat Gemini sedang bekerja
          />
          {isGenerating && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginTop: 5 }}
            />
          )}
        </View>
      )}

      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={localStyles.listContent}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 50,
  },
  taskItem: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  headerContainer: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  taskText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flexWrap: 'wrap',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.grey,
  },
  progressButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  progressButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  }
});
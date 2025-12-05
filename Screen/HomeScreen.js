import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
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

// === TEMPLATE SKILL TREE ===
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

export default function HomeScreen({ navigation }) {
  const [taskName, setTaskName] = useState('');
  const [tasks, setTasks] = useState([]);

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

  const handleAddTask = async () => {
    if (taskName.trim() === '') {
      Alert.alert('Error', 'Nama tugas tidak boleh kosong');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) return;
      await addDoc(collection(db, "users", user.uid, "tasks"), {
        name: taskName,
        completed: false,
        createdAt: new Date(),
        skillTreeData: DEFAULT_SKILL_TREE
      });
      setTaskName('');
    } catch (e) {
      console.error("Error menambah data: ", e);
      Alert.alert('Error', 'Gagal menambah data');
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
      />

      {taskName.trim().length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Button
            title="Buat Kurikulum"
            onPress={handleAddTask}
            color={Colors.primary}
          />
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
    width: '100%', // Pastikan kartu selebar container
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
    flexWrap: 'wrap', // Pastikan teks turun ke bawah jika panjang
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
    width: '100%', // Tombol selebar kartu
  },
  progressButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // PERBAIKAN UTAMA DI SINI
  actionContainer: {
    flexDirection: 'row',
    width: '100%',
    // Saya hapus 'gap' dan 'justifyContent' agar kita atur manual dengan flex
  },
  actionButton: {
    flex: 1, // Ini kuncinya: Memaksa tombol berbagi ruang 50:50
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
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebaseConfig'; // <-- IMPOR 'auth' JUGA
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { signOut } from 'firebase/auth'; // <-- IMPOR FUNGSI SIGNOUT

import { globalStyles, Colors } from '../Styles/GlobalStyles';


// Terima prop 'navigation'
export default function HomeScreen({ navigation }) {
  const [taskName, setTaskName] = useState('');
  const [tasks, setTasks] = useState([]);

  // === FUNGSI LOGOUT BARU ===
  const handleLogout = () => {
    signOut(auth).catch(error => console.error('Error logging out: ', error));
    // Kita tidak perlu pindah layar manual.
    // Listener di App.js akan mendeteksi logout
    // dan otomatis memindahkan user ke LoginScreen.
  };

  // === PASANG TOMBOL LOGOUT DI HEADER ===
  // Kita gunakan 'useLayoutEffect' untuk mengatur tombol di header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        // Gunakan warna global
        <Button onPress={handleLogout} title="Logout" color={Colors.danger} />
      ),
    });
  }, [navigation]);


  // === (SEMUA KODE CRUD ANDA YANG LAIN TETAP SAMA) ===
  useEffect(() => {
    const q = query(collection(db, "tasks"));
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
    if (taskName === '') {
      Alert.alert('Error', 'Nama tugas tidak boleh kosong');
      return;
    }
    try {
      await addDoc(collection(db, "tasks"), {
        name: taskName,
        completed: false,
        createdAt: new Date()
      });
      setTaskName('');
    } catch (e) {
      console.error("Error menambah data: ", e);
      Alert.alert('Error', 'Gagal menambah data');
    }
  };

  const handleUpdateTask = async (taskId, currentCompletedStatus) => {
    const taskRef = doc(db, "tasks", taskId);
    try {
      await updateDoc(taskRef, {
        completed: !currentCompletedStatus
      });
    } catch (e) {
      console.error("Error update data: ", e);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    try {
      await deleteDoc(taskRef);
    } catch (e) {
      console.error("Error delete data: ", e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={localStyles.taskItem}>
      <Text style={[
        localStyles.taskText,
        item.completed ? localStyles.taskCompleted : null
      ]}>
        {item.name}
      </Text>
      <View style={localStyles.buttonContainer}>
        <TouchableOpacity
          style={[localStyles.button, localStyles.updateButton]}
          onPress={() => handleUpdateTask(item.id, item.completed)}
        >
          <Text style={localStyles.buttonText}>{item.completed ? 'Batal' : 'Selesai'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[localStyles.button, localStyles.deleteButton]}
          onPress={() => handleDeleteTask(item.id)}
        >
          <Text style={localStyles.buttonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    // --- (Gunakan style LOKAL untuk container) ---
    <View style={localStyles.container}>
      <View style={{ marginBottom: 20 }}>
        <Button
          title="Lihat Tampilan Graph (Tanpa Duplikat)"
          color="#6200ee"
          onPress={() => navigation.navigate('SkillTree')}
        />
      </View>
      <TextInput
        style={globalStyles.input} // <-- Gunakan global
        placeholder="Nama Tugas Baru"
        onChangeText={setTaskName}
        value={taskName}
      />
      {/* Gunakan warna global */}
      <Button title="Tambah Tugas" onPress={handleAddTask} color={Colors.primary} />

      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={localStyles.list}
      />
    </View>
  );
}

// --- (StyleSheet lokal dirapikan dengan Colors) ---
const localStyles = StyleSheet.create({
  // Container ini LOKAL, khusus untuk HomeScreen
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    marginTop: 20,
  },
  taskItem: {
    backgroundColor: Colors.light, // <-- Gunakan global
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 18,
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.grey, // <-- Gunakan global
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: Colors.white, // <-- Gunakan global
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: Colors.primary, // <-- Gunakan global
  },
  deleteButton: {
    backgroundColor: Colors.danger, // <-- Gunakan global
  }
  // 'input' sudah dihapus dari sini karena sekarang global
});
import React, { useState, useEffect } from 'react';
import {
  View, Image, Text, TextInput, StyleSheet, FlatList,
  Alert, TouchableOpacity, Dimensions, Modal
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import {
  collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { signOut } from 'firebase/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- KONFIGURASI WARNA & DIMENSI ---
const SCREEN_WIDTH = Dimensions.get('window').width;
const COLORS = {
  bg: '#FFFDF5',      // Cream background
  primary: '#EAFF54', // Kuning terang (tombol utama)
  accent1: '#9A89FF', // Ungu (kartu 1)
  accent2: '#89EFFF', // Biru (kartu 2)
  border: '#000000',  // Hitam pekat untuk border
  white: '#FFFFFF',
};

// Data Skill Tree (Tetap sama seperti kodemu)
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
  const [isModalVisible, setModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState('Loading...');
  const handleLogout = () => {
    signOut(auth).catch(error => console.error('Error logging out: ', error));
  };
  useEffect(() => {
    const user = auth.currentUser;

    if (user && user.email) {
      // 1. Ambil bagian depan email (sebelum @)
      const emailName = user.email.split('@')[0];

      // 2. (Opsional) Bikin huruf pertama jadi Kapital agar rapi
      const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

      setDisplayName(formattedName);
    } else {
      setDisplayName('Tamu');
    }
  }, []);
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
      Alert.alert('Error', 'Nama materi tidak boleh kosong');
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
      setModalVisible(false); // Tutup modal setelah add
    } catch (e) {
      Alert.alert('Error', 'Gagal menambah data');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const user = auth.currentUser;
    if (!user) return;
    const taskRef = doc(db, "users", user.uid, "tasks", taskId);
    try { await deleteDoc(taskRef); } catch (e) { console.error(e); }
  };

  // --- KOMPONEN HEADER (Profil, Stats, Tombol) ---
  const ProfileHeader = () => (
    <View style={styles.headerWrapper}>
      {/* 1. BACKGROUND IMAGE */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/images/image.png')} // Pastikan path benar
          style={styles.bannerImage}
        />
        {/* Overlay gradient/shadow jika perlu */}
      </View>

      {/* 2. PROFILE PICTURE & NAME */}
      <View style={styles.profileSection}>

        <View style={styles.avatarContainer}>

          <Image
            source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Ryker' }} // Placeholder Avatar
            style={styles.avatarImage}
          />

        </View>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{displayName}</Text>
          {/* <Ionicons name="checkmark-circle" size={24} color="#C1E14F" style={{ marginLeft: 5 }} /> */}

        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
        {/* 
        <Text style={styles.bioText}>
          Saya memiliki kemampuan dalam pemrograman front-end dan back-end, serta memahami konsep database.
        </Text> */}
      </View>

      {/* 3. STATS BOXES */}
      {/* <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>343</Text>
          <Text style={styles.statLabel}>Koneksi</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{tasks.filter(t => t.completed).length}/{tasks.length}</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>30 Mn</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
      </View> */}

      {/* 4. ACTION BUTTON (Mulai Cari Materimu...) */}

      <View style={styles.listContent}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.yellowButton}onPress={() => navigation.navigate("AskPage")}>
            <Text style={styles.yellowButtonText}>Mulai Cari Materimu</Text>
            <Ionicons name="add" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* 5. SECTION TITLE */}
        <View style={styles.sectionHeader}>
          <View style={styles.highlightUnderline}>
            <Text style={styles.sectionTitle}>Riwayat Aktivitas</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // --- RENDER ITEM (KARTU TUGAS GRID) ---
  const renderCard = ({ item, index }) => {
    const cardColor = index % 2 === 0 ? COLORS.accent1 : COLORS.accent2;

    return (
      // 1. WRAPPER UTAMA (Container Pembungkus)
      <View style={styles.gridItemWrapper}>

        {/* 2. LAPISAN BAYANGAN (Kotak Hitam di Belakang) */}
        <View style={styles.hardShadow} />

        {/* 3. KARTU ASLI (Ditaruh di atas bayangan) */}
        <TouchableOpacity
          style={[styles.cardContainer, { backgroundColor: cardColor }]}
          onPress={() => navigation.navigate('SkillTree', {
            skillTreeData: item.skillTreeData,
            taskId: item.id
          })}
          onLongPress={() => handleDeleteTask(item.id)}
          activeOpacity={0.9} // Efek pencet biar tidak terlalu transparan
        >
          <View style={styles.cardIconContainer}>
            <MaterialCommunityIcons name="code-tags" size={32} color="white" />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardFooter}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
            </View>
          </View>
          <View style={{ height: 200 }} />

        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        numColumns={2} // Grid 2 Kolom
        ListHeaderComponent={ProfileHeader}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
      />



    </View>
  );
}

// --- STYLING NEUBRUTALISM ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,

  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 10, // Tambah padding bawah agar scroll enak

  },
  headerWrapper: {
    marginBottom: 20,

  },
  // 1. BANNER
  bannerContainer: {
    height: 180,
    width: '100%',
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderColor: COLORS.border,
    marginBottom: 30, // Memberi ruang untuk Avatar yang "nongol"
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',

  },
  // 2. PROFILE
  profileSection: {
    alignItems: 'center',
    marginTop: -80, // Menarik ke atas menimpa banner
    marginBottom: 20,

  },
  avatarContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 4,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '900', // Sangat tebal
    color: COLORS.border,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bioText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#444',
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  // 3. STATS
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    width: '31%', // Agar muat 3 kotak
    alignItems: 'center',
    // Shadow keras
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.border,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  // 4. ACTION BUTTONS
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  yellowButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 10,
    // HAPUS SHADOW/ELEVATION BAWAAN
    // GANTI DENGAN BORDER TEBAL DI BAWAH & KANAN (Cara termudah untuk Android)
    borderBottomWidth: 6,
    borderRightWidth: 6,
  },
  yellowButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.border,
  },
  menuButton: {
    width: 50,
    height: 56, // Menyesuaikan tinggi tombol kuning
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  // 5. ACTIVITY SECTION
  sectionHeader: {
    alignItems: 'flex-start',
  },
  highlightUnderline: {
    borderBottomWidth: 8, // Garis bawah tebal kuning
    borderBottomColor: 'rgba(234, 255, 84, 0.6)', // Kuning semi transparan
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.border,
    marginBottom: -4, // Agar teks menimpa garis bawah
  },
  // 6. CARDS (TASKS)
  gridItemWrapper: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 20, // Jarak antar baris
    position: 'relative', // Penting untuk absolute positioning
  },
  hardShadow: {
    position: 'absolute',
    top: 6,   // Geser ke bawah
    left: 6,  // Geser ke kanan
    width: '100%',
    height: '100%',
    backgroundColor: 'black', // Warna bayangan
    borderRadius: 16,
  },

  cardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  cardTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'bold',
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.primary,
  },
  logout: {
    color: 'red',
    fontSize: 12,
    marginTop: 5
  }
});
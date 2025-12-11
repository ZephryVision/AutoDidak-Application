import React, { useState, useEffect } from 'react';
import {
  View, Image, Text, TextInput, StyleSheet, FlatList,
  Alert, TouchableOpacity, Dimensions, Modal, Platform
} from 'react-native';

import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, query, } from "firebase/firestore";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  bg: '#FFFDF5',
  primary: '#EAFF54',
  accent1: '#9A89FF',
  accent2: '#89EFFF',
  border: '#000000',
  white: '#FFFFFF',
};

export default function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
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

  // const handleDeleteTask = async (taskId) => {
  //   const user = auth.currentUser;
  //   if (!user) return;
  //   const taskRef = doc(db, "users", user.uid, "tasks", taskId);
  //   try { await deleteDoc(taskRef); } catch (e) { console.error(e); }
  // };

  // --- KOMPONEN HEADER (Profil, Stats, Tombol) ---
  const ProfileHeader = () => (
    <View style={styles.headerWrapper}>
      {/* 1. BACKGROUND IMAGE */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/images/image.png')} // Pastikan path benar
          style={styles.bannerImage}
        />
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
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContent}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.yellowButton} onPress={() => navigation.navigate("AskPage")}>
            <Text style={styles.yellowButtonText}>Mulai Cari Materimu</Text>
            <Ionicons name="add" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* 3. SECTION TITLE */}
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
        >
          <View style={styles.cardIconContainer}>
            <MaterialCommunityIcons name="code-tags" size={32} color="white" />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardFooter}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
            </View>
          </View>
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
        numColumns={2}
        ListHeaderComponent={ProfileHeader}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
        contentContainerStyle={{
          flexGrow: 1,        // Memaksa list mengisi layar agar trigger scroll aktif
          paddingBottom: 100  // Memberi ruang napas di bawah agar item terakhir tidak kepotong
        }}
        style={{ flex: 1, height: '100%' }} // <--- TAMBAHKAN INI
        scrollEnabled={true}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false} // Opsional: hilangkan bar scroll jelek
      />
    </View>
  );
}

// --- STYLING NEUBRUTALISM ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    ...Platform.select({
      web: {
        height: '100vh',
        // overflow: 'hidden',
      },
      default: {
        // Untuk HP biarkan default
      }
    }),
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerWrapper: {
    marginBottom: 20,
  },
  bannerContainer: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderColor: COLORS.border,
    marginBottom: 30,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -80,
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
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.border,
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
    borderBottomWidth: 6,
    borderRightWidth: 6,
  },
  yellowButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.border,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    marginTop: 20
  },
  highlightUnderline: {
    borderBottomWidth: 8,
    borderBottomColor: 'rgba(234, 255, 84, 0.6)',
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.border,
    marginBottom: -4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 10,
  },
  gridItemWrapper: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 20,
    position: 'relative',
  },
  hardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
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
  logout: {
    color: 'red',
    fontSize: 12,
    marginTop: 5
  }
});
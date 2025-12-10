import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { Ionicons } from "@expo/vector-icons"; 

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Ambil data user saat ini
    setUser(auth.currentUser);
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.replace("Login");
    }).catch((error) => alert(error.message));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* === HEADER === */}
        <View style={styles.header}>
          <Ionicons name="person-circle" size={80} color="#333" />
          <Text style={styles.title}>Halo, Selamat Datang!</Text>
          <Text style={styles.subtitle}>
            {user ? user.email : 'Tamu'}
          </Text>
        </View>

        {/* === MENU UTAMA === */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Menu Pintas</Text>

          {/* 1. TOMBOL KE SKILL TREE */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#00b894' }]} 
            onPress={() => navigation.navigate("SkillTree")}
          >
            <Ionicons name="git-network" size={24} color="white" />
            <Text style={styles.menuText}>Lihat Skill Tree</Text>
            <Ionicons name="chevron-forward" size={24} color="white" style={{marginLeft: 'auto'}}/>
          </TouchableOpacity>

          {/* 2. TOMBOL KE ASK PAGE */}
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: '#0984e3' }]} 
            onPress={() => navigation.navigate("AskPage")}
          >
            <Ionicons name="chatbubbles" size={24} color="white" />
            <Text style={styles.menuText}>Tanya (Ask Page)</Text>
            <Ionicons name="chevron-forward" size={24} color="white" style={{marginLeft: 'auto'}}/>
          </TouchableOpacity>

        </View>

        {/* === TOMBOL LOGOUT === */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" style={{marginRight: 8}}/>
          <Text style={styles.logoutText}>Keluar Aplikasi</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f6', // Abu-abu muda yang bersih
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    marginTop: 4,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    // Shadow agar terlihat timbul
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2d3436',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: '#ff7675',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
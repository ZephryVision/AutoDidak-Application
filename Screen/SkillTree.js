import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Text,
  Animated,
  PanResponder,
  Pressable,
  StatusBar,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
  Entypo,
  MaterialIcons,
  Feather
} from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import * as NavigationBar from 'expo-navigation-bar';
// --- IMPORT UNTUK SAVE PROGRESS ---
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

// --- DATA FALLBACK ---
const DEFAULT_DATA = [
  { id: 'start', name: 'Start', unlocked: true, children: [], icon: { lib: 'MCI', name: 'flag-checkered' } },
];

const IconRenderer = ({ lib, name, size, color }) => {
  switch (lib) {
    case 'MCI': return <MaterialCommunityIcons name={name} size={size} color={color} />;
    case 'FA5': return <FontAwesome5 name={name} size={size - 4} color={color} />;
    case 'IO': return <Ionicons name={name} size={size} color={color} />;
    case 'EN': return <Entypo name={name} size={size} color={color} />;
    default: return <MaterialIcons name="error" size={size} color={color} />;
  }
};

const CONFIG = { nodeRadius: 35, siblingGap: 70, levelGap: 140 };

function layoutAdaptive(flatSkills, rootId) {
  const nodeMap = new Map();
  flatSkills.forEach((skill) => {
    nodeMap.set(skill.id, { ...skill, children: [], position: { x: 0, y: 0 } });
  });

  flatSkills.forEach((skill) => {
    if (skill.children) {
      skill.children.forEach((childId) => {
        const parentNode = nodeMap.get(skill.id);
        const childNode = nodeMap.get(childId);
        if (parentNode && childNode) parentNode.children.push(childNode);
      });
    }
  });

  let currentLeafX = 0;

  function calculatePosition(node, depth) {
    node.position.y = depth * CONFIG.levelGap;
    if (node.children.length === 0) {
      node.position.x = currentLeafX;
      currentLeafX += CONFIG.nodeRadius * 2 + CONFIG.siblingGap;
    } else {
      node.children.forEach((child) => calculatePosition(child, depth + 1));
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.position.x = (firstChild.position.x + lastChild.position.x) / 2;
    }
  }

  const rootNode = nodeMap.get(rootId) || nodeMap.get(flatSkills[0]?.id);
  if (rootNode) calculatePosition(rootNode, 0);

  let maxY = 0;
  nodeMap.forEach((node) => {
    if (node.position.y > maxY) maxY = node.position.y;
  });
  nodeMap.forEach((node) => {
    node.position.y = maxY - node.position.y;
  });

  const result = [];
  function flattenResult(node) {
    if (result.find((n) => n.id === node.id)) return;
    result.push(node);
    node.children.forEach(flattenResult);
  }

  if (rootNode) flattenResult(rootNode);
  return result;
}

function calculateBounds(skills) {
  let minX = Infinity; let maxX = -Infinity;
  let minY = Infinity; let maxY = -Infinity;
  if (skills.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  skills.forEach((s) => {
    if (s.position.x < minX) minX = s.position.x;
    if (s.position.x > maxX) maxX = s.position.x;
    if (s.position.y < minY) minY = s.position.y;
    if (s.position.y > maxY) maxY = s.position.y;
  });
  return { minX, maxX, minY, maxY };
}

// === COMPONENT UTAMA ===
export default function SkillTree({ route, navigation }) {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');
  const { skillTreeData, taskId } = route.params || {};
  const initialRawData = skillTreeData || DEFAULT_DATA;
  const [skills, setSkills] = useState(() =>
    layoutAdaptive(JSON.parse(JSON.stringify(initialRawData)), 'orientasi')
  );

  useEffect(() => {
    const hideNavBar = async () => {
      await NavigationBar.setVisibilityAsync("hidden");
      // 3. (Opsional tapi Penting) Atur agar kalau di-swipe, dia muncul sebentar lalu hilang lagi
      // await NavigationBar.setBehaviorAsync("overlay-swipe");
    };
    hideNavBar();
  }, []);

  const saveProgressToFirestore = async (updatedSkills) => {
    if (!taskId) return;
    try {
      const user = auth.currentUser;
      if (!user) return;

      // === LANGKAH PEMBERSIHAN (SANITIZING) ===
      // Kita ubah kembali struktur data agar sesuai format Firestore
      const cleanData = updatedSkills.map((node) => {

        // 1. Perbaiki array 'children'
        // Jika isinya object (karena layoutAdaptive), ambil ID-nya saja.
        // Jika isinya sudah string, biarkan saja.
        const cleanChildren = node.children
          ? node.children.map(child => (typeof child === 'object' ? child.id : child))
          : [];

        // 2. Return objek bersih
        return {
          id: node.id,
          name: node.name,
          unlocked: node.unlocked,
          children: cleanChildren, // <-- Sekarang isinya hanya ["id1", "id2"]
          icon: node.icon
        };
      });

      const taskDocRef = doc(db, "users", user.uid, "tasks", taskId);

      // Update dokumen
      await updateDoc(taskDocRef, {
        skillTreeData: cleanData
      });

      console.log("Progress berhasil disimpan ke Firestore!");
    } catch (error) {
      console.error("Gagal menyimpan progress:", error);
      Alert.alert("Error Save", "Gagal menyimpan progress ke server.");
    }
  };

  const PADDING = 100;

  const [canvasInfo] = useState(() => {
    const bounds = calculateBounds(skills);
    const w = (bounds.maxX - bounds.minX + PADDING * 2) * 1.2;
    const h = (bounds.maxY - bounds.minY + PADDING * 2) * 1.2;
    return {
      w: Math.max(w, width),
      h: Math.max(h, height),
      offsetX: -bounds.minX + PADDING,
      offsetY: -bounds.minY + PADDING
    };
  });

  const minScrollX = -(canvasInfo.w - width);
  const minScrollY = -(canvasInfo.h - height);
  const maxScrollX = 0;
  const maxScrollY = 0;

  const initialY = minScrollY > 0 ? 0 : minScrollY + 100;
  const clampedInitialY = Math.min(maxScrollY, Math.max(minScrollY, initialY));

  const pan = useRef(new Animated.ValueXY({ x: 0, y: clampedInitialY })).current;
  const lastOffset = useRef({ x: 0, y: clampedInitialY });

  // === PERBAIKAN DI BAGIAN INI (PAN RESPONDER) ===
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => { },
      onPanResponderMove: (_, gestureState) => {
        let newX = lastOffset.current.x + gestureState.dx;
        let newY = lastOffset.current.y + gestureState.dy;

        if (newX > maxScrollX) newX = maxScrollX;
        if (newX < minScrollX) newX = minScrollX;

        if (newY > maxScrollY) newY = maxScrollY;
        if (newY < minScrollY) newY = minScrollY;

        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (_, gestureState) => {
        let finalX = lastOffset.current.x + gestureState.dx;
        let finalY = lastOffset.current.y + gestureState.dy;

        if (finalX > maxScrollX) finalX = maxScrollX;
        if (finalX < minScrollX) finalX = minScrollX;
        if (finalY > maxScrollY) finalY = maxScrollY;
        if (finalY < minScrollY) finalY = minScrollY;

        lastOffset.current = { x: finalX, y: finalY };
      },
    })
  ).current;

  const handleSkillTap = (tappedSkill) => {
    if (tappedSkill.unlocked) {
      Alert.alert('INFO', `Skill "${tappedSkill.name}" sudah dikuasai!`);
      return;
    }
    const parent = skills.find((s) =>
      s.children.some((child) => child.id === tappedSkill.id)
    );

    if (!parent || (parent && parent.unlocked)) {
      const newSkills = skills.map((s) =>
        s.id === tappedSkill.id ? { ...s, unlocked: true } : s
      );
      setSkills(newSkills);
      saveProgressToFirestore(newSkills);
      Alert.alert('SELAMAT!', `Kamu membuka skill: ${tappedSkill.name}`);
    } else {
      Alert.alert('TERKUNCI', 'Selesaikan skill sebelumnya!');
    }
  };

  const THEMES = {
    light: {
      bg: '#F4F3EF', stroke: '#000000', locked: '#fbe145', unlocked: '#4cdd7c',
      iconLocked: '#000000', iconUnlocked: '#000000', shadow: '#000000',
      cardBg: '#FFFFFF', text: '#000000', tagBg: '#000000', tagText: '#FFFFFF'
    },
    dark: {
      bg: '#121212', stroke: '#FFFFFF', locked: '#333333', unlocked: '#00FF9D',
      iconLocked: '#888888', iconUnlocked: '#000000', shadow: '#FFFFFF',
      cardBg: '#000000', text: '#FFFFFF', tagBg: '#FFFFFF', tagText: '#000000'
    }
  };
  const activeColors = isDarkMode ? THEMES.dark : THEMES.light;
  
  return (
    <View style={[styles.container, { backgroundColor: activeColors.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <Animated.View

        style={[
          StyleSheet.absoluteFill, // <--- TAMBAHKAN INI (PENTING!)
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={{ width: canvasInfo.w, height: canvasInfo.h }}>
          <Svg width={canvasInfo.w} height={canvasInfo.h} style={StyleSheet.absoluteFill}>
            {skills.map((s) =>
              s.children.map((child) => (
                <Line
                  key={`${s.id}-${child.id}`}
                  x1={s.position.x + canvasInfo.offsetX}
                  y1={s.position.y + canvasInfo.offsetY}
                  x2={child.position.x + canvasInfo.offsetX}
                  y2={child.position.y + canvasInfo.offsetY}
                  stroke={activeColors.stroke}
                  strokeWidth="4"
                />
              ))
            )}
          </Svg>

          {skills.map((s) => {
            const left = s.position.x + canvasInfo.offsetX - 35;
            const top = s.position.y + canvasInfo.offsetY - 35;
            return (
              <Pressable
                key={s.id}
                style={[styles.nodeContainer, { left, top }]}
                onPress={() => handleSkillTap(s)}
              >
                <View style={[styles.circleBase, styles.shadowCircle, { backgroundColor: activeColors.shadow }]} />
                <View style={[
                  styles.circleBase, styles.mainCircle,
                  { backgroundColor: s.unlocked ? activeColors.unlocked : activeColors.locked, borderColor: activeColors.stroke }
                ]}>
                  <IconRenderer
                    lib={s.icon?.lib} name={s.icon?.name} size={32}
                    color={s.unlocked ? activeColors.iconUnlocked : activeColors.iconLocked}
                  />
                </View>
                <View style={[styles.labelContainer, { backgroundColor: activeColors.tagBg }]}>
                  <Text style={[styles.labelText, { color: activeColors.tagText }]}>
                    {s.name.length > 18 ? s.name.substring(0, 16) + '..' : s.name.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.neoCard, { backgroundColor: activeColors.cardBg, borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]}>
          <TouchableOpacity
            style={[
              styles.returnButton,
              {
                backgroundColor: activeColors.cardBg,
                borderColor: activeColors.stroke,
                shadowColor: activeColors.shadow
              }
            ]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color={activeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.neoText, { color: activeColors.text }]}>{taskId ? "PROGRESS SAVED" : "PREVIEW MODE"}</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: activeColors.cardBg, borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]}
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <Feather name={isDarkMode ? "sun" : "moon"} size={24} color={activeColors.text} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  nodeContainer: { position: 'absolute', width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
  circleBase: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 4 },
  shadowCircle: { top: 6, left: 6 },
  mainCircle: { justifyContent: 'center', alignItems: 'center', top: 0, left: 0 },
  labelContainer: { position: 'absolute', top: 75, paddingHorizontal: 6, paddingVertical: 4, minWidth: 100, alignItems: 'center' },
  labelText: { fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' },
  overlay: { position: 'absolute', bottom: 30, left: 20, flexDirection: 'row', justifyContent: 'space-between', width: "90%" },
  toggleButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  neoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: 220,
    height: 50,
    // Style Neobrutalism
    borderWidth: 3,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },

  neoText: {
    fontWeight: '900',
    fontSize: 16,
  },
});
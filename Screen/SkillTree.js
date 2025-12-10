import React, { useState, useRef } from 'react';
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
  Platform
} from 'react-native';
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
  Entypo,
  MaterialIcons,
  Feather
} from '@expo/vector-icons';
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

// === DATA SKILL ===
const ADAPTED_DATA = [
  { id: '1', name: 'Start', unlocked: true, children: ['2'], icon: { lib: 'MCI', name: 'flag-checkered' } },
  { id: '2', name: 'Logika', unlocked: true, children: ['3', '4'], icon: { lib: 'IO', name: 'git-merge' } },
  { id: '3', name: 'Database', unlocked: false, children: ['5'], icon: { lib: 'IO', name: 'server' } },
  { id: '4', name: 'UI Design', unlocked: false, children: [], icon: { lib: 'IO', name: 'phone-portrait' } },
  { id: '5', name: 'API', unlocked: false, children: ['6'], icon: { lib: 'IO', name: 'cloud-upload' } },
  { id: '6', name: 'Deploy', unlocked: false, children: [], icon: { lib: 'IO', name: 'rocket' } },
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

const CONFIG = { nodeRadius: 35, siblingGap: 80, levelGap: 140 };

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
  if (skills.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  skills.forEach((s) => {
    if (s.position.x < minX) minX = s.position.x;
    if (s.position.x > maxX) maxX = s.position.x;
    if (s.position.y < minY) minY = s.position.y;
    if (s.position.y > maxY) maxY = s.position.y;
  });
  return { minX, maxX, minY, maxY };
}

export default function SkillTree({ route, navigation }) {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');
  const { skillTreeData, taskId } = route.params || {};
  const initialRawData = skillTreeData || ADAPTED_DATA;

  const [skills, setSkills] = useState(() =>
    layoutAdaptive(JSON.parse(JSON.stringify(initialRawData)), '1')
  );

  const saveProgressToFirestore = async (updatedSkills) => {
    if (!taskId) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const cleanData = updatedSkills.map((node) => ({
          id: node.id, name: node.name, unlocked: node.unlocked, 
          children: node.children ? node.children.map(c => c.id) : [], 
          icon: node.icon
      }));
      const taskDocRef = doc(db, "users", user.uid, "tasks", taskId);
      await updateDoc(taskDocRef, { skillTreeData: cleanData });
    } catch (error) { console.error("Gagal simpan:", error); }
  };

  const PADDING = 200; 
  const [canvasInfo] = useState(() => {
    const bounds = calculateBounds(skills);
    const treeWidth = bounds.maxX - bounds.minX;
    const realTreeCenterX = (bounds.minX + bounds.maxX) / 2;
    
    return {
      w: Math.max(treeWidth + PADDING * 2, width * 1.5),
      h: Math.max(bounds.maxY + PADDING * 2, height * 1.5),
      offsetX: PADDING,
      offsetY: 120, 
      realTreeCenterX   
    };
  });

  const initialX = (width / 2) - (canvasInfo.realTreeCenterX + canvasInfo.offsetX);
  
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => { 
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => { pan.flattenOffset(); },
    })
  ).current;

  const handleSkillTap = (tappedSkill) => {
    if (tappedSkill.unlocked) {
      Alert.alert('INFO', `Skill "${tappedSkill.name}" sudah dikuasai!`);
      return;
    }
    const parent = skills.find((s) => s.children.some((child) => child.id === tappedSkill.id));
    if (!parent || (parent && parent.unlocked)) {
      const newSkills = skills.map((s) => s.id === tappedSkill.id ? { ...s, unlocked: true } : s);
      setSkills(newSkills);
      saveProgressToFirestore(newSkills);
      Alert.alert('SELAMAT!', `Kamu membuka skill: ${tappedSkill.name}`);
    } else {
      Alert.alert('TERKUNCI', 'Selesaikan skill sebelumnya!');
    }
  };

  // === TEMA WARNA SESUAI CONTOH ANDA (NEO / CYBER) ===
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
        style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }] }}
        {...panResponder.panHandlers}
      >
        <View style={{ width: canvasInfo.w, height: canvasInfo.h }}>
          
          {/* GARIS PENGHUBUNG (STYLE TEBAL) */}
          {skills.map((s) => {
            const parentX = s.position.x + canvasInfo.offsetX;
            const parentY = s.position.y + canvasInfo.offsetY;

            return s.children.map(child => {
               const childX = child.position.x + canvasInfo.offsetX;
               const childY = child.position.y + canvasInfo.offsetY;
               const deltaX = childX - parentX;
               const deltaY = childY - parentY;
               const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
               const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

               return (
                 <View
                   key={`line-${s.id}-${child.id}`}
                   style={{
                     position: 'absolute',
                     left: (parentX + childX) / 2 - (length / 2),
                     top: (parentY + childY) / 2,
                     width: length,
                     height: 4, // GARIS LEBIH TEBAL
                     backgroundColor: activeColors.stroke,
                     transform: [{ rotate: `${angle}deg` }]
                   }}
                 />
               );
            });
          })}

          {/* NODE LINGKARAN (STYLE NEO) */}
          {skills.map((s) => {
            const left = s.position.x + canvasInfo.offsetX - 35; 
            const top = s.position.y + canvasInfo.offsetY - 35;
            
            return (
              <Pressable
                key={s.id}
                style={[styles.nodeContainer, { left, top }]}
                onPress={() => handleSkillTap(s)}
              >
                {/* Bayangan Kasar (Hard Shadow) */}
                <View style={[styles.circleBase, styles.shadowCircle, { backgroundColor: activeColors.shadow }]} />
                
                {/* Lingkaran Utama dengan Border Tebal */}
                <View style={[
                  styles.circleBase, styles.mainCircle,
                  { 
                    backgroundColor: s.unlocked ? activeColors.unlocked : activeColors.locked, 
                    borderColor: activeColors.stroke 
                  }
                ]}>
                  <IconRenderer
                    lib={s.icon?.lib} name={s.icon?.name} size={30}
                    color={s.unlocked ? activeColors.iconUnlocked : activeColors.iconLocked}
                  />
                </View>

                {/* Label dengan Style Tag */}
                <View style={[styles.labelContainer, { backgroundColor: activeColors.tagBg }]}>
                  <Text style={[styles.labelText, { color: activeColors.tagText }]}>
                    {s.name.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* === UI OVERLAY STYLE NEO === */}

      {/* Tombol Back */}
      <TouchableOpacity 
        style={[styles.neoButton, styles.backButton, { backgroundColor: '#ff4757', borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Info Card */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.neoCard, { backgroundColor: activeColors.cardBg, borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]}>
          <Text style={[styles.neoText, { color: activeColors.text }]}>SKILL TREE</Text>
          <Text style={[styles.neoSubText, { color: activeColors.text }]}>{isDarkMode ? 'Mode: Cyber' : 'Mode: Paper'}</Text>
        </View>
      </View>

      {/* Tombol Toggle Theme */}
      <TouchableOpacity
        style={[styles.neoButton, styles.toggleButton, { backgroundColor: activeColors.cardBg, borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]}
        onPress={() => setIsDarkMode(!isDarkMode)}
      >
        <Feather name={isDarkMode ? "sun" : "moon"} size={24} color={activeColors.text} />
      </TouchableOpacity>
      
      {/* Tombol Reset Center */}
      <TouchableOpacity
        style={[styles.neoButton, styles.resetButton, { backgroundColor: activeColors.cardBg, borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]}
        onPress={() => {
           Animated.spring(pan, { toValue: { x: initialX, y: 0 }, useNativeDriver: false }).start();
        }}
      >
        <MaterialIcons name="center-focus-strong" size={24} color={activeColors.text} />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  
  nodeContainer: { position: 'absolute', width: 70, height: 70, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  
  // Style Lingkaran Neo (Border Tebal)
  circleBase: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 4 }, // Border tebal 4px
  
  // Bayangan Kasar (Hard Shadow)
  shadowCircle: { top: 6, left: 6, opacity: 1 }, // Opacity 1 agar solid (neo style)
  
  mainCircle: { justifyContent: 'center', alignItems: 'center', top: 0, left: 0 },
  
  // Label Style Tag
  labelContainer: { 
    position: 'absolute', top: 75, paddingHorizontal: 6, paddingVertical: 4, 
    minWidth: 80, alignItems: 'center', borderWidth: 0 
  },
  labelText: { fontSize: 11, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  // Overlay UI Styles
  overlay: { position: 'absolute', top: 60, left: 20 },
  
  neoCard: { 
    borderWidth: 3, padding: 10, 
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 
  },
  neoText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  neoSubText: { fontSize: 12, fontWeight: 'bold', marginTop: 4, opacity: 0.7 },

  // Tombol Gaya Neo (Kotak/Bulat dengan Border Tebal & Bayangan Kasar)
  neoButton: {
    position: 'absolute', width: 50, height: 50, 
    justifyContent: 'center', alignItems: 'center', 
    borderRadius: 25, borderWidth: 3,
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0
  },

  toggleButton: { top: 60, right: 20, zIndex: 30 },
  resetButton: { top: 130, right: 20, zIndex: 30 },
  backButton: { bottom: 40, left: 20, zIndex: 30 }
});
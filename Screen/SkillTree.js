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
} from 'react-native';
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
  Entypo,
  MaterialIcons
} from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// --- DATA SKILLS (SAMA) ---
const skillsData = [
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

  const rootNode = nodeMap.get(rootId);
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
  skills.forEach((s) => {
    if (s.position.x < minX) minX = s.position.x;
    if (s.position.x > maxX) maxX = s.position.x;
    if (s.position.y < minY) minY = s.position.y;
    if (s.position.y > maxY) maxY = s.position.y;
  });
  return { minX, maxX, minY, maxY };
}

export default function SkillTree() {
  const [skills, setSkills] = useState(() =>
    layoutAdaptive(JSON.parse(JSON.stringify(skillsData)), 'orientasi')
  );

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

  const initialY = -(canvasInfo.h - height) > 0 ? 0 : -(canvasInfo.h - height) + 100;

  const pan = useRef(new Animated.ValueXY({ x: 0, y: initialY })).current;

  // --- 2. PERBAIKAN LOGIKA PAN RESPONDER ---
  const panResponder = useRef(
    PanResponder.create({
      // HANYA aktifkan drag jika user menggeser lebih dari 5 pixel (Threshold)
      // Ini mencegah drag aktif saat user cuma ingin "Tap/Klik"
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
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
    if (parent && parent.unlocked) {
      setSkills((currentSkills) =>
        currentSkills.map((s) =>
          s.id === tappedSkill.id ? { ...s, unlocked: true } : s
        )
      );
    } else {
      Alert.alert('TERKUNCI', 'Selesaikan skill sebelumnya!');
    }
  };

  const COLORS = {
    bg: '#F4F3EF',
    stroke: '#000000',
    locked: '#fbe145',
    unlocked: '#4cdd7c',
    iconLocked: '#000000',
    iconUnlocked: '#000000',
    shadow: '#000000',
    textBg: '#000000',
    text: '#FFFFFF',
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }] }}
        {...panResponder.panHandlers}
      >
        <View style={{ width: canvasInfo.w, height: canvasInfo.h}}>

          {/* --- 3. PERBAIKAN SVG UNTUK WEB --- */}
          {/* Tambahkan width & height eksplisit agar muncul di web */}
          <Svg 
            width={canvasInfo.w} 
            height={canvasInfo.h} 
            style={StyleSheet.absoluteFill}
          >
            {skills.map((s) =>
              s.children.map((child) => (
                <Line
                  key={`${s.id}-${child.id}`}
                  x1={s.position.x + canvasInfo.offsetX}
                  y1={s.position.y + canvasInfo.offsetY}
                  x2={child.position.x + canvasInfo.offsetX}
                  y2={child.position.y + canvasInfo.offsetY}
                  stroke={COLORS.stroke}
                  strokeWidth="4"
                />
              ))
            )}
          </Svg>

          {/* LAYER 2: NODE */}
          {skills.map((s) => {
            const left = s.position.x + canvasInfo.offsetX - 35;
            const top = s.position.y + canvasInfo.offsetY - 35;

            return (
              // --- 4. GANTI VIEW BIASA JADI PRESSABLE ---
              // Pressable menangani event touch lebih baik daripada View onTouchEnd
              <Pressable
                key={s.id}
                style={[styles.nodeContainer, { left, top }]}
                onPress={() => handleSkillTap(s)}
              >
                {/* A. Hard Shadow View */}
                <View style={[styles.circleBase, styles.shadowCircle]} />

                {/* B. Main Circle View */}
                <View style={[
                  styles.circleBase,
                  styles.mainCircle,
                  { backgroundColor: s.unlocked ? COLORS.unlocked : COLORS.locked }
                ]}>
                  <IconRenderer
                    lib={s.icon?.lib}
                    name={s.icon?.name}
                    size={32}
                    color={s.unlocked ? COLORS.iconUnlocked : COLORS.iconLocked}
                  />
                </View>

                {/* D. Label Text */}
                <View style={styles.labelContainer}>
                  <Text style={styles.labelText}>
                    {s.name.length > 18 ? s.name.substring(0, 16) + '..' : s.name.toUpperCase()}
                  </Text>
                </View>

              </Pressable>
            );
          })}

        </View>
      </Animated.View>

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.neoCard}>
          <Text style={styles.neoText}>SKILL TREE v2.0</Text>
          <Text style={styles.neoSubText}>Drag to Navigate</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3EF',
    overflow: 'hidden', // Penting untuk web agar tidak scroll bar ganda
  },
  nodeContainer: {
    position: 'absolute',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    // cursor: 'pointer', // (Opsional) Jika di web ingin ada kursor tangan
  },
  circleBase: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#000',
  },
  shadowCircle: {
    backgroundColor: '#000',
    top: 6,
    left: 6,
  },
  mainCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
  },
  labelContainer: {
    position: 'absolute',
    top: 75,
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  labelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  neoCard: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  neoText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#000',
  },
  neoSubText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 4
  }
});
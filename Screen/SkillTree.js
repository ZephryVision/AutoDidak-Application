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

const { width, height } = Dimensions.get('window');

// --- DATA SKILLS ---
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
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  const [skills, setSkills] = useState(() =>
    layoutAdaptive(JSON.parse(JSON.stringify(skillsData)), 'orientasi')
  );

  const PADDING = 100;
  
  // --- HITUNG BOUNDARIES ---
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

  // Batas Scroll (Bernilai Negatif)
  // Contoh: Jika konten 1000px dan layar 400px, kita bisa scroll sejauh -600px
  const minScrollX = -(canvasInfo.w - width);
  const minScrollY = -(canvasInfo.h - height);
  const maxScrollX = 0; // Tidak boleh geser lebih dari sisi kiri
  const maxScrollY = 0; // Tidak boleh geser lebih dari sisi atas

  // Posisi awal: Usahakan di bawah, tapi jangan melebihi batas
  const initialY = minScrollY > 0 ? 0 : minScrollY + 100; // +100 biar gak mepet banget bawahnya
  const clampedInitialY = Math.min(maxScrollY, Math.max(minScrollY, initialY));

  // --- LOGIC PAN MANUAL ---
  // Kita gunakan useRef untuk menyimpan posisi terakhir secara manual
  // agar lebih mudah melakukan matematika clamping (pembatasan)
  const pan = useRef(new Animated.ValueXY({ x: 0, y: clampedInitialY })).current;
  const lastOffset = useRef({ x: 0, y: clampedInitialY });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Kita tidak memakai setOffset bawaan animated karena mempersulit clamping manual
        // Cukup biarkan lastOffset menyimpan posisi terakhir
      },
      onPanResponderMove: (_, gestureState) => {
        // 1. Hitung posisi calon baru (Posisi Terakhir + Pergeseran Jari)
        let newX = lastOffset.current.x + gestureState.dx;
        let newY = lastOffset.current.y + gestureState.dy;

        // 2. Lakukan CLAMPING (Pembatasan)
        // Jangan biarkan X lebih besar dari 0 atau lebih kecil dari minScrollX
        if (newX > maxScrollX) newX = maxScrollX; 
        if (newX < minScrollX) newX = minScrollX;
        
        if (newY > maxScrollY) newY = maxScrollY;
        if (newY < minScrollY) newY = minScrollY;

        // 3. Update Animated Value
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (_, gestureState) => {
        // 4. Simpan posisi terakhir yang sudah di-clamp ke variabel ref
        // Kita ambil value langsung dari pan karena itu sudah hasil clamping di onMove
        // Note: _value adalah properti internal, cara paling aman di RN tanpa listener
        // tapi untuk kasus sederhana ini bisa pakai listener atau tracking manual seperti di atas.
        
        // Untuk akurasi, kita hitung ulang clamp di sini untuk disimpan
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

      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.neoCard, { backgroundColor: activeColors.cardBg, borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]}>
          <Text style={[styles.neoText, { color: activeColors.text }]}>SKILL TREE v2.1</Text>
          <Text style={[styles.neoSubText, { color: activeColors.text }]}>{isDarkMode ? 'Cyber Mode' : 'Paper Mode'}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.toggleButton, { backgroundColor: activeColors.cardBg, borderColor: activeColors.stroke, shadowColor: activeColors.shadow }]}
        onPress={() => setIsDarkMode(!isDarkMode)}
      >
        <Feather name={isDarkMode ? "sun" : "moon"} size={24} color={activeColors.text} />
      </TouchableOpacity>
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
  overlay: { position: 'absolute', top: 50, left: 20 },
  toggleButton: { position: 'absolute', top: 50, right: 20, width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  neoCard: { borderWidth: 3, padding: 10, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  neoText: { fontWeight: '900', fontSize: 16 },
  neoSubText: { fontSize: 12, fontWeight: 'bold', marginTop: 4, opacity: 0.7 }
});
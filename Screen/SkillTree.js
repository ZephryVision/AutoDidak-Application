import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Alert, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const skillsData = [
  {
    id: 'orientasi',
    name: 'Orientasi Awal: Algoritma & Pemrograman',
    unlocked: true,
    children: ['algoritma_dasar', 'pemrograman_dasar'],
  },
  {
    id: 'algoritma_dasar',
    name: 'Dasar Pemikiran Algoritmik',
    unlocked: false,
    children: ['representasi_algoritma', 'struktur_dasar_algoritma'],
  },
  {
    id: 'representasi_algoritma',
    name: 'Representasi Algoritma (Flowchart & Pseudocode)',
    unlocked: false,
    children: [],
  },
  {
    id: 'struktur_dasar_algoritma',
    name: 'Struktur Dasar Algoritma (Sequential, Selection, Repetition)',
    unlocked: false,
    children: ['dasar_pemrograman'],
  },
  {
    id: 'pemrograman_dasar',
    name: 'Dasar Pemrograman',
    unlocked: false,
    children: ['variabel_tipe_data', 'percabangan', 'perulangan'],
  },
  {
    id: 'variabel_tipe_data',
    name: 'Variabel dan Tipe Data',
    unlocked: false,
    children: ['operator'],
  },
  {
    id: 'operator',
    name: 'Operator (Aritmetika, Relasional, Logika)',
    unlocked: false,
    children: ['percabangan'],
  },
  {
    id: 'percabangan',
    name: 'Percabangan (If-Else, Elif)',
    unlocked: false,
    children: ['perulangan'],
  },
  {
    id: 'perulangan',
    name: 'Perulangan (For, While)',
    unlocked: false,
    children: ['struktur_data_fungsi'],
  },
  {
    id: 'struktur_data_fungsi',
    name: 'Struktur Data & Fungsi',
    unlocked: false,
    children: ['list_array', 'dictionary_map', 'fungsi'],
  },
  {
    id: 'list_array',
    name: 'List / Array',
    unlocked: false,
    children: [],
  },
  {
    id: 'dictionary_map',
    name: 'Dictionary / Map',
    unlocked: false,
    children: [],
  },
  {
    id: 'fungsi',
    name: 'Fungsi (Parameter & Return)',
    unlocked: false,
    children: ['penerapan_algoritma'],
  },
  {
    id: 'penerapan_algoritma',
    name: 'Penerapan Algoritma',
    unlocked: false,
    children: ['searching', 'sorting', 'kompleksitas'],
  },
  {
    id: 'searching',
    name: 'Algoritma Searching (Linear & Binary)',
    unlocked: false,
    children: [],
  },
  {
    id: 'sorting',
    name: 'Algoritma Sorting (Bubble, Selection, Insertion)',
    unlocked: false,
    children: [],
  },
  {
    id: 'kompleksitas',
    name: 'Analisis Kompleksitas Waktu (O(n), O(log n))',
    unlocked: false,
    children: ['proyek_mini'],
  },
  {
    id: 'proyek_mini',
    name: 'Proyek Mini (Integrasi Konsep)',
    unlocked: false,
    children: [],
  },
];

// ... (fungsi calculateBounds untuk membatasi luas field)
function calculateBounds(skills) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  skills.forEach((s) => {
    if (s.position.x < minX) minX = s.position.x;
    if (s.position.x > maxX) maxX = s.position.x;
    if (s.position.y < minY) minY = s.position.y;
    if (s.position.y > maxY) maxY = s.position.y;
  });

  return { minX, maxX, minY, maxY };
}

// Helper untuk mendapatkan struktur pohon dari array flat
function buildTreeStructure(data, rootId) {
  const nodes = {};
  // Copy data
  data.forEach(d => nodes[d.id] = { ...d, children: [] });
  
  // Re-link children objects berdasarkan array string children
  data.forEach(d => {
    if (nodes[d.id].childrenIDs) { // Asumsi ada field childrenIDs atau gunakan logic kamu
       // Logic kamu menggunakan array string 'children' di data mentah
    }
  });
  
  // Karena data kamu manual (hardcoded children strings), kita traverse dari root saja
  return nodes;
}

// ALGORITMA LAYOUT YANG LEBIH BAIK
function layoutNodesSmart(flatData, rootId, config = { xSpacing: 100, ySpacing: 160 }) {
    // 1. Buat Map untuk akses cepat
    const nodeMap = new Map(flatData.map(node => [node.id, { ...node }]));
    
    // Global counter untuk posisi X daun (leaf)
    let currentLeafX = 0;

    // Fungsi rekursif untuk menghitung posisi
    function assignPosition(nodeId, depth) {
        const node = nodeMap.get(nodeId);
        if (!node) return null;

        // Set Y berdasarkan kedalaman (depth)
        node.position = { y: depth * config.ySpacing, x: 0 };

        if (!node.children || node.children.length === 0) {
            // KASUS 1: DAUN (LEAF)
            // Tempatkan di posisi X berikutnya
            node.position.x = currentLeafX;
            // Geser cursor X untuk daun berikutnya (memberi jarak)
            currentLeafX += config.xSpacing;
        } else {
            // KASUS 2: PARENT
            // Proses semua anak terlebih dahulu (Post-order)
            node.children.forEach(childId => assignPosition(childId, depth + 1));
            
            // Setelah anak-anak punya posisi, tempatkan Parent di tengah-tengah
            const firstChild = nodeMap.get(node.children[0]);
            const lastChild = nodeMap.get(node.children[node.children.length - 1]);
            
            if (firstChild && lastChild) {
                node.position.x = (firstChild.position.x + lastChild.position.x) / 2;
            }
        }
    }

    // Jalankan kalkulasi
    assignPosition(rootId, 0);

    // Kembalikan array nodes yang sudah punya posisi
    // Kita perlu memfilter node yang terjangkau dari root saja
    const result = [];
    
    // Helper untuk mengumpulkan hasil tree yang sudah terproses
    function collectNodes(nodeId) {
        const node = nodeMap.get(nodeId);
        if(node && !result.find(n => n.id === node.id)){
            result.push(node);
            node.children.forEach(collectNodes);
        }
    }
    collectNodes(rootId);
    
    return result;
}

export default function SkillTree() {
  // --- PERBAIKAN 2: Tentukan rootId 'orientasi' ---
  const [skills, setSkills] = useState(() =>
    layoutNodesSmart(skillsData, 'orientasi', { xSpacing: 100, ySpacing: 160 })
  );
  
  const PADDING = 30;

  // Hitung batas dan ukuran kanvas sekali
  const [canvasSize, setCanvasSize] = useState(() => {
    const bounds = calculateBounds(skills);
    const canvasWidth = bounds.maxX - bounds.minX + PADDING * 2;
    const canvasHeight = bounds.maxY - bounds.minY + PADDING * 2;
    const offsetX = -bounds.minX + PADDING;
    const offsetY = -bounds.minY + PADDING;
    return { canvasWidth, canvasHeight, offsetX, offsetY };
  });
  
  // (Ini adalah kode gestur Anda sebelumnya, yang Anda bilang berfungsi)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isPinching = useSharedValue(false);

  const pan = Gesture.Pan()
    .minDistance(5) // <-- Menambahkan minDistance kecil
    .onStart(() => {
      if (isPinching.value) return;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (isPinching.value) return;
      translateX.value = savedTranslateX.value + e.translationX / scale.value;
      translateY.value = savedTranslateY.value + e.translationY / scale.value;
    });

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      isPinching.value = true;
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      const newScale = Math.min(Math.max(savedScale.value * e.scale, 0.5), 2);
      const focalX = e.focalX - width / 2;
      const focalY = e.focalY - height / 2;
      const scaleRatio = newScale / savedScale.value;
      translateX.value = (savedTranslateX.value - focalX) * scaleRatio + focalX;
      translateY.value = (savedTranslateY.value - focalY) * scaleRatio + focalY;
      scale.value = newScale;
    })
    .onEnd(() => {
      isPinching.value = false;
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleSkillTap = (tappedSkill) => {
    if (tappedSkill.unlocked) {
      Alert.alert(tappedSkill.name, 'Skill sudah terbuka.');
      return;
    }
    const parent = skills.find((s) => s.children.includes(tappedSkill.id));
    if (parent && parent.unlocked) {
      setSkills((currentSkills) =>
        currentSkills.map((s) =>
          s.id === tappedSkill.id ? { ...s, unlocked: true } : s
        )
      );
      Alert.alert('Skill Terbuka!', tappedSkill.name);
    } else {
      Alert.alert(
        'Terkunci',
        'Kamu harus membuka skill sebelumnya terlebih dahulu.'
      );
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <GestureDetector gesture={composed}>
          <Animated.View style={styles.gestureArea}>
            <Animated.View style={[styles.canvasWrapper, animatedStyle]}>
              <Svg
                height={canvasSize.canvasHeight}
                width={canvasSize.canvasWidth}
              >
                {/* Garis antar node */}
                {skills.map((s) =>
                  s.children.map((childId) => {
                    const child = skills.find((c) => c.id === childId);
                    if (!child) return null;
                    return (
                      <Line
                        key={`${s.id}-${childId}`}
                        x1={s.position.x + canvasSize.offsetX}
                        y1={s.position.y + canvasSize.offsetY}
                        x2={child.position.x + canvasSize.offsetX}
                        y2={child.position.y + canvasSize.offsetY}
                        stroke={child.unlocked ? '#4CAF50' : '#888'}
                        strokeWidth="2"
                      />
                    );
                  })
                )}

                {/* Node skill */}
                {skills.map((s) => (
                  <G key={s.id} onPress={() => handleSkillTap(s)}>
                    <Circle
                      cx={s.position.x + canvasSize.offsetX}
                      cy={s.position.y + canvasSize.offsetY}
                      r="30"
                      fill={s.unlocked ? '#4CAF50' : '#555'}
                      stroke="#222"
                      strokeWidth="2"
                    />
                    <SvgText
                      x={s.position.x + canvasSize.offsetX}
                      y={s.position.y + canvasSize.offsetY + 5}
                      fontSize="10"
                      fill="#fff"
      
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {s.name}
                    </SvgText>
                  </G>
                ))}
              </Svg>
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        <View style={styles.hint} pointerEvents="none">
          <Text style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>
            🔍 Pinch to zoom • Drag to move • Tap node to unlock
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

// Stylesheet Anda sudah benar (canvasWrapper harus KOSONG)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gestureArea: {
    flex: 1,
    overflow: 'visible',
  },
  canvasWrapper: {
    // KOSONG (tidak ada flex: 1)
  },
  hint: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
});
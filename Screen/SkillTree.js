import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import { collection, onSnapshot, query, writeBatch, doc, getDocs } from "firebase/firestore";

import { db, auth } from '../firebaseConfig';
import { Colors } from '../Styles/GlobalStyles';

// INI ADALAH "BLUEPRINT" SKILL TREE ANDA
// Kita pakai Custom ID (id yang kita tentukan sendiri) supaya mudah relasinya.
// === OPSI 1: SKILL UMUM (Data Lama) ===
const LAYOUT_GENERAL = [
    { id: "node_1", label: "Skill Dasar", parents: [] },
    { id: "node_2", label: "Teori A", parents: ["node_1"] },
    { id: "node_3", label: "Teori B", parents: ["node_1"] },
    { id: "node_4", label: "Praktek Gabungan", parents: ["node_2", "node_3"] },
    { id: "node_5", label: "Proyek Akhir", parents: ["node_4"] },
];

const LAYOUT_ILKOM = [
    // Root
    { id: "ilkom_1", label: "Algoritma Pemrograman", parents: [] },
    { id: "ilkom_2", label: "Struktur Data", parents: ["ilkom_1"] },
    { id: "ilkom_3", label: "Basis Data", parents: ["ilkom_2"] },
    { id: "ilkom_4", label: "Pemrograman Internet", parents: ["ilkom_2"] },
];

export default function GraphScreen() {
    const [nodes, setNodes] = useState([]);
    const [levels, setLevels] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // State untuk interaksi (Highlight)
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [relatedParentIds, setRelatedParentIds] = useState([]);
    const [relatedChildIds, setRelatedChildIds] = useState([]);

    // === FUNGSI SEEDER YANG LEBIH PINTAR ===
    // Menerima parameter 'dataToUpload' (bisa LAYOUT_GENERAL atau LAYOUT_RPG)
    const handleSeedDatabase = async (dataToUpload) => {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        try {
            const batch = writeBatch(db);
            const collectionRef = collection(db, "users", user.uid, "graph_nodes");

            // LANGKAH 1: HAPUS DATA LAMA (CLEAN SLATE)
            // Ambil semua dokumen yang ada sekarang
            const snapshot = await getDocs(collectionRef);
            snapshot.forEach((doc) => {
                batch.delete(doc.ref); // Masukkan perintah hapus ke batch
            });

            // LANGKAH 2: MASUKKAN DATA BARU
            dataToUpload.forEach((item) => {
                const docRef = doc(db, "users", user.uid, "graph_nodes", item.id);
                batch.set(docRef, {
                    label: item.label,
                    parents: item.parents,
                    createdAt: new Date()
                });
            });

            // LANGKAH 3: EKSEKUSI SEMUA (HAPUS + TULIS)
            await batch.commit();
            alert("Layout berhasil diganti!");

        } catch (error) {
            console.error("Error seeding:", error);
            alert("Gagal mengganti layout.");
        } finally {
            setLoading(false);
        }
    };

    // === 1. AMBIL SEMUA DATA ===
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Kita ambil SEMUA node sekaligus untuk dihitung graph-nya
        const q = query(collection(db, "users", user.uid, "graph_nodes"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rawNodes = [];
            snapshot.forEach((doc) => {
                rawNodes.push({ id: doc.id, ...doc.data() });
            });
            setNodes(rawNodes);
            processGraphLevels(rawNodes); // Hitung level
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // === 2. ALGORITMA MENGHITUNG LEVEL (Supaya tidak duplikat) ===
    const processGraphLevels = (allNodes) => {
        // Map untuk menyimpan level setiap node sementara
        // Format: { 'id_node': level_number }
        let nodeLevels = {};

        // Fungsi rekursif untuk mencari level terdalam
        const getLevel = (nodeId, visited = []) => {
            // Cegah infinite loop jika ada cycle (A -> B -> A)
            if (visited.includes(nodeId)) return 0;

            // Jika sudah pernah dihitung, pakai yang tersimpan
            if (nodeLevels[nodeId] !== undefined) return nodeLevels[nodeId];

            const node = allNodes.find(n => n.id === nodeId);
            if (!node) return 0;

            // === BAGIAN INI YANG PERLU DIGANTI ===
            // Cek apakah parents ada, DAN pastikan dia benar-benar Array
            if (!node.parents || !Array.isArray(node.parents) || node.parents.length === 0) {
                nodeLevels[nodeId] = 0;
                return 0;
            }

            // Jika punya parents, level dia adalah: Level tertinggi Parent + 1
            // Contoh: Node 4 ortunya Node 2(Lvl 1) dan Node 3(Lvl 1). Maka Node 4 = Lvl 2.
            let maxParentLevel = -1;
            node.parents.forEach(parentId => {
                const pLevel = getLevel(parentId, [...visited, nodeId]);
                if (pLevel > maxParentLevel) maxParentLevel = pLevel;
            });

            const myLevel = maxParentLevel + 1;
            nodeLevels[nodeId] = myLevel;
            return myLevel;
        };

        // Jalankan perhitungan untuk semua node
        allNodes.forEach(node => {
            getLevel(node.id);
        });

        // Kelompokkan node berdasarkan level untuk di-render
        // Hasil: [ [Node1], [Node2, Node3], [Node4], ... ]
        const groupedLevels = [];
        allNodes.forEach(node => {
            const lvl = nodeLevels[node.id];
            if (!groupedLevels[lvl]) groupedLevels[lvl] = [];
            groupedLevels[lvl].push(node);
        });

        // === PERBAIKAN: SORTING BERDASARKAN ABJAD ===
        // Kita urutkan node di dalam setiap level agar rapi (A-Z)
        // Jadi "Skill 2" pasti di kiri "Skill 3"
        groupedLevels.forEach(levelNodes => {
            if (levelNodes) {
                levelNodes.sort((a, b) => a.label.localeCompare(b.label));
            }
        });

        setLevels(groupedLevels);
    };

    // === 3. HANDLE KLIK NODE (Highlight Hubungan) ===
    const handleNodePress = (node) => {
        // Jika diklik lagi, matikan highlight
        if (selectedNodeId === node.id) {
            setSelectedNodeId(null);
            setRelatedParentIds([]);
            setRelatedChildIds([]);
            return;
        }

        setSelectedNodeId(node.id);

        // 1. Cari Parents (langsung dari data node)
        setRelatedParentIds(node.parents || []);

        // 2. Cari Children (cari node lain yang parents-nya mengandung node ini)
        const children = nodes.filter(n => n.parents && n.parents.includes(node.id));
        setRelatedChildIds(children.map(c => c.id));
    };

    // === FUNGSI RENDER TIAP KOTAK (VERSI UPDATE WARNA ABU-ABU) ===
    const renderNode = (node) => {
        // 1. Setup Warna Dasar (Keadaan Normal saat tidak ada yang diklik)
        let backgroundColor = Colors.white;
        let borderColor = '#ddd';
        let textColor = '#333';     // <--- Tambah variabel warna teks
        let scale = 1;
        let opacity = 1;            // <--- Tambah variabel transparansi

        // 2. Logika Pewarnaan saat ada Node yang dipilih
        if (selectedNodeId) {
            if (node.id === selectedNodeId) {
                // --- KASUS A: NODE YANG DIPILIH (Fokus Utama) ---
                backgroundColor = '#FFF3CD'; // Kuning terang
                borderColor = '#FFC107';     // Border kuning tua
                textColor = '#212529';       // Teks hitam tegas
                scale = 1.1;                 // Sedikit membesar

            } else if (relatedParentIds.includes(node.id)) {
                // --- KASUS B: ORANG TUA (Parent) ---
                backgroundColor = '#D1E7DD'; // Hijau muda
                borderColor = '#198754';     // Border hijau tua
                textColor = '#0f5132';       // Teks hijau gelap

            } else if (relatedChildIds.includes(node.id)) {
                // --- KASUS C: ANAK (Child) ---
                backgroundColor = '#CFE2FF'; // Biru muda
                borderColor = '#0D6EFD';     // Border biru tua
                textColor = '#084298';       // Teks biru gelap

            } else {
                // --- KASUS D: TIDAK BERSANGKUTAN (Nonaktif/Abu-abu) ---
                // <--- PERUBAHAN UTAMA DI SINI
                backgroundColor = '#EEEEEE'; // Abu-abu solid
                borderColor = '#BDBDBD';     // Border abu lebih tua
                textColor = '#9E9E9E';       // Teks jadi abu-abu pudar
                opacity = 0.6;               // Menjadi agak transparan (redup)
                scale = 0.98;                // Sedikit mengecil agar terlihat "tenggelam"
            }
        }

        return (
            <TouchableOpacity
                key={node.id}
                onPress={() => handleNodePress(node)}
                // Terapkan style dinamis ke kotak
                style={[
                    styles.nodeBox,
                    {
                        backgroundColor,
                        borderColor,
                        transform: [{ scale }],
                        opacity // <--- Terapkan opacity di sini
                    }
                ]}
                activeOpacity={0.8} // Efek saat ditekan
            >
                {/* Terapkan warna teks dinamis */}
                <Text style={[styles.nodeText, { color: textColor }]}>
                    {node.label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={{ margin: 20 }}>
                <Text style={{ textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }}>
                    Pilih Template Skill Tree:
                </Text>

                {/* WADAH TOMBOL BERDAMPINGAN */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>

                    {/* TOMBOL 1: GENERAL */}
                    <View style={{ width: '45%' }}>
                        <Button
                            title="📚 SKILL TREE UMUM"
                            onPress={() => handleSeedDatabase(LAYOUT_GENERAL)}
                            color={Colors.primary} // Biru
                        />
                    </View>

                    {/* TOMBOL 2: RPG */}
                    <View style={{ width: '45%' }}>
                        <Button
                            title="💻 SKILL TREE ILKOM"
                            onPress={() => handleSeedDatabase(LAYOUT_ILKOM)}
                            color={Colors.danger} // Merah
                        />
                    </View>

                </View>
            </View>

            <Text style={styles.headerInfo}>
                Klik Skill untuk melihat Skill prasyaratnya dan Skill Selanjutnya
            </Text>

            {/* RENDER PER LEVEL */}
            {levels.map((levelNodes, index) => (
                <View key={index} style={styles.levelContainer}>
                    {/* Garis Label Level (Opsional) */}
                    {/* <Text style={styles.levelLabel}>Level {index}</Text> */}

                    <View style={styles.nodesRow}>
                        {levelNodes && levelNodes.map(node => renderNode(node))}
                    </View>

                    {/* Panah visual antar level (Hiasan) */}
                    {index < levels.length - 1 && (
                        <Text style={styles.arrowDown}>⬇</Text>
                    )}
                </View>
            ))}

            {/* LEGENDA WARNA */}
            {selectedNodeId && (
                <View style={styles.legend}>
                    <Text style={{ color: '#198754' }}>■ Prasyarat</Text>
                    <Text style={{ color: '#FFC107' }}>■ Skill yang Dipilih</Text>
                    <Text style={{ color: '#0D6EFD' }}>■ Selanjutnya</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    headerInfo: {
        textAlign: 'center',
        color: '#888',
        marginBottom: 20,
        fontSize: 12,
    },
    levelContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    levelLabel: {
        position: 'absolute',
        left: 0,
        fontSize: 10,
        color: '#ccc',
    },
    nodesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    nodeBox: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        margin: 5,
        borderRadius: 8,
        borderWidth: 2,
        minWidth: 80,
        alignItems: 'center',
        elevation: 2, // Shadow Android
        shadowColor: '#000', // Shadow iOS
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    nodeText: {
        fontWeight: 'bold',
        color: '#333',
    },
    arrowDown: {
        marginTop: 10,
        color: '#ddd',
        fontSize: 20,
        fontWeight: 'bold',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginTop: 20,
    }
});
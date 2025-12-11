import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: 1,
    title: "Dapatkan Rekomendasi",
    desc: "Materi dan Belajar sesuai Keinginanmu!",
    image: require("../../assets/images/onboard1.png"),
  },
  {
    id: 2,
    title: "Belajar nggak harus ribet",
    desc: "Semua bisa dimulai dari sini!",
    image: require("../../assets/images/onboard2.png"),
  },
  {
    id: 3,
    title: "Cara baru memahami materi",
    desc: "Interaktif dan menyenangkan.",
    image: require("../../assets/images/onboard3.png"),
  },
];

export default function Onboarding() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ animated: true, index: currentIndex + 1 });
    } else {
      router.replace("/(tabs)");
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ animated: true, index: currentIndex - 1 });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* BACK ARROW */}
      {currentIndex > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={26} color="black" />
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <Image source={item.image} style={styles.image} />

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />

      {/* PAGINATION DOTS */}
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentIndex === i && styles.activeDot
            ]}
          />
        ))}
      </View>

      {/* BUTTON NEXT */}
      <TouchableOpacity style={styles.button} onPress={goNext}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? "Masuk" : "Lanjut"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width,
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 10,
  },
  image: {
    width: 260,
    height: 330,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    width: "90%",
    textAlign: "left",
  },
  desc: {
    fontSize: 16,
    color: "#444",
    marginTop: 6,
    width: "90%",
    textAlign: "left",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 80,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#000",
    width: 20,
  },
  button: {
    backgroundColor: "#e8ff36",
    paddingVertical: 14,
    borderRadius: 12,
    width: "90%",
    alignSelf: "center",
    position: "absolute",
    bottom: 20,
    alignItems: "center",
  },
  buttonText: { fontWeight: "bold", fontSize: 16 },
});

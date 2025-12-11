import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  const textOpacity = useRef(new Animated.Value(0)).current;
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Setelah 2 detik ⇒ munculkan text
    setTimeout(() => {
      setShowText(true);
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 2000);

    // Setelah 4 detik ⇒ pindah ke onboarding
    setTimeout(() => {
      router.replace("/onboarding");
    }, 4000);
  }, []);

  return (
    <View style={styles.container}>
      {/* Maskot */}
      <Image
        source={require("../../assets/images/splash-mascot.png")}
        style={styles.image}
      />

      {/* Teks muncul setelah 2 detik */}
      {showText && (
        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.title}>Dapatkan Rekomendasi</Text>
          <Text style={styles.subtitle}>
            Materi dan Belajar sesuai Keinginanmu!
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 240,
    height: 240,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginTop: 4,
  },
});

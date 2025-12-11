import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';

export default function CustomSplash() {
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animasi muncul setelah 1 detik
    const timer = setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../assets/splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Teks dengan fade-in */}
      <Animated.Text style={[styles.text, { opacity: textOpacity }]}>
        Dapatkan Rekomendasi{"\n"} Materi dan Belajar Sesuai Kemampuanmu
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
});

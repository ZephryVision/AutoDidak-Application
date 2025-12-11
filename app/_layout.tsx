import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash/index" />
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

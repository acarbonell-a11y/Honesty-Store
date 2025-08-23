import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen name="homepage" options={{ title: "Home" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
    </Stack>
  );
}

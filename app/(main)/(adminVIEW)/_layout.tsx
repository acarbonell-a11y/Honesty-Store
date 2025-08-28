import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="Homepage"
        options={{ headerShown: false }} // hide header for homepage
      />
      <Stack.Screen
        name="Bills"
        options={{ title: "My Bills" }} // custom title
      />
      <Stack.Screen
        name="CartScreen"
        options={{ title: "Cart" }} // 👈 will now just say "Cart"
      />
      <Stack.Screen
        name="ProfileScreen"
        options={{ title: "My Profile" }}
      />
    </Stack>
  );
}

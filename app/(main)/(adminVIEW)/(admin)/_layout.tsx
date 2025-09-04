// app/(admin)/_layout.tsx
import { getCurrentUser } from "@/functions/authFunctions";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useFocusEffect, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, View } from "react-native";

export default function AdminLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // wait until we check auth
  const segments = useSegments();
  
    // -------------------------------
    // Block Android hardware back button
    // -------------------------------
    useFocusEffect(
  React.useCallback(() => {
    const onBackPress = () => {
      // Only block back button on dashboard
      const currentTab = segments[segments.length - 1]; // get the last segment
      if (currentTab === "dashboard") {
        return true; // block back
      }
      return false; // allow back for other tabs
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [segments])
);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser(); // get the current logged-in user
      if (!user || !user.isAdmin) {
        // redirect non-admins or unauthenticated users to login
        router.replace("/(auth)/login");
      } else {
        setLoading(false); // allow rendering of tabs
      }
    };
    checkAdmin();
  }, [router]);

  // while checking auth, show a loading indicator
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#059038ff" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 20,
          right: 20,
          backgroundColor: "#fff",
          borderRadius: 20,
          height: 70,
          paddingBottom: 10,
          elevation: 5,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
        },
        tabBarActiveTintColor: "#059038ff",
        tabBarInactiveTintColor: "#7d7d7dff",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

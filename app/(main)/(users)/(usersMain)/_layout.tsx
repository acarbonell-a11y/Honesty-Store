// app/(users)/_layout.tsx
import { getCurrentUser } from "@/functions/authFunctions";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, View } from "react-native";


export default function UserLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // wait until auth check

  // -------------------------------
  // Block Android hardware back button
  // -------------------------------
  useFocusEffect(
  React.useCallback(() => {
    const onBackPress = () => true; // block back button

    // subscribe to back button
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    // cleanup
    return () => subscription.remove();
  }, [])
);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        // Not logged in, redirect to login
        router.replace("/(auth)/login");
      } else {
        // Logged in, allow access
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a6a37" />
      </View>
    );
  }

  // Render tabs after auth confirmed
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#1a6a37",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 70,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -3 },
          shadowRadius: 6,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="Homepage"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="Bill"
        options={{
          title: "My Bills",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="MyAccount"
        options={{
          title: "My Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/[id]"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="NotifacationScreen"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="CartScreen"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
    </Tabs>
  );
}

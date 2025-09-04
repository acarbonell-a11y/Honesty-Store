import { changeUsername, getUserProfile, logoutUser } from "@/functions/settingsFunctions";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "config/firebaseConfig";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const SettingsScreen: React.FC = () => {
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [themeDark, setThemeDark] = useState(false);

  const user = auth.currentUser;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (user) fetchProfile();
    animateScreen();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    if (profile?.name) {
      setUsername(profile.name);
      setNewUsername(profile.name);
    }
  };

  const animateScreen = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChangeUsername = async () => {
    if (!user) return;
    try {
      await changeUsername(user.uid, newUsername);
      setUsername(newUsername);
      Alert.alert("Success", "Username updated successfully");
    } catch (error: unknown) {
      Alert.alert("Error", error instanceof Error ? error.message : String(error));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      Alert.alert("Logged out", "You have been logged out successfully.", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (error: unknown) {
      Alert.alert("Error", error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeDark ? "#121212" : "#fff" },
      ]}
    >
      <StatusBar
        barStyle={themeDark ? "light-content" : "dark-content"}
        backgroundColor={themeDark ? "#121212" : "#fff"}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconWrapper}>
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color={themeDark ? "#fff" : "#000"}
          />
        </Pressable>

        <Text style={[styles.title, { color: themeDark ? "#fff" : "#000" }]}>
          Settings
        </Text>

        <Pressable onPress={handleLogout} style={styles.iconWrapper}>
          <Ionicons name="log-out-outline" size={28} color="#dc3545" />
        </Pressable>
      </View>

      {/* Content */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Username */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeDark ? "#fff" : "#000" }]}>
            Username
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeDark ? "#222" : "#f9f9f9",
                color: themeDark ? "#fff" : "#000",
                borderColor: themeDark ? "#555" : "#ccc",
              },
            ]}
            value={newUsername}
            onChangeText={setNewUsername}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleChangeUsername}
          >
            <Text style={styles.buttonText}>Update Username</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 45 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  title: { fontWeight: "800", fontSize: 28 },
  iconWrapper: { padding: 5 },
  section: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#1a6a37",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
});

export default SettingsScreen;

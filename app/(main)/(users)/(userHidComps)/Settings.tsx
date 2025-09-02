import { changeUsername, getUserProfile, logoutUser } from "@/functions/settingsFunctions";
import { auth } from "config/firebaseConfig";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

const SettingsScreen: React.FC = () => {
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [themeDark, setThemeDark] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    if (profile?.name) {
      setUsername(profile.name);
      setNewUsername(profile.name);
    }
  };

 const handleLogout = async () => {
  try {
    await logoutUser();

    Alert.alert("Logged out", "You have been logged out successfully.", [
      {
        text: "OK",
        onPress: () => {
          // Redirect AFTER user confirms
          router.replace("/");
        },
      },
    ]);
  } catch (error: unknown) {
    Alert.alert("Error", error instanceof Error ? error.message : String(error));
  }
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

  const toggleTheme = () => setThemeDark(!themeDark);

  const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: themeDark ? "#121212" : "#f5f5f5" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: themeDark ? "#fff" : "#000" },
    label: { fontSize: 16, color: themeDark ? "#fff" : "#000", marginBottom: 5 },
    input: {
      borderWidth: 1,
      borderColor: themeDark ? "#555" : "#ccc",
      borderRadius: 8,
      padding: 10,
      marginBottom: 15,
      color: themeDark ? "#fff" : "#000",
      backgroundColor: themeDark ? "#222" : "#fff",
    },
    button: { backgroundColor: "#007bff", padding: 15, borderRadius: 8, marginVertical: 10 },
    buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
    themeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 10 },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={newUsername} onChangeText={setNewUsername} />
      <TouchableOpacity style={styles.button} onPress={handleChangeUsername}>
        <Text style={styles.buttonText}>Update Username</Text>
      </TouchableOpacity>

      <View style={styles.themeRow}>
        <Text style={styles.label}>Dark Theme</Text>
        <Switch value={themeDark} onValueChange={toggleTheme} />
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#dc3545" }]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;

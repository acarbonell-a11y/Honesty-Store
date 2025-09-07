import { onSignUp } from "@/functions/authFunctions";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SignupScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false); // <-- Loading state

  const router = useRouter();

  // Animated values
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const appNameOpacity = useRef(new Animated.Value(1)).current;

  // Keyboard events
  useEffect(() => {
    const keyboardShow = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.parallel([
        Animated.timing(formTranslateY, {
          toValue: -e.endCoordinates.height / 2.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(appNameOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });

    const keyboardHide = Keyboard.addListener("keyboardDidHide", () => {
      Animated.parallel([
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(appNameOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  const handlePressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const handleSignup = async () => {
    // Validation checks
    if (!username.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setModalMessage("Please fill in all fields.");
      setModalVisible(true);
      return;
    }
    if (password !== confirm) {
      setModalMessage("Passwords do not match.");
      setModalVisible(true);
      return;
    }

    // Show loading
    setLoading(true);

    // Attempt signup
    const success = await onSignUp(email, password, confirm, username);
    setLoading(false);

    if (success) {
      router.replace("/(auth)/login");
    } else {
      setModalMessage("Signup failed. Please check your details.");
      setModalVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animated App Name */}
        <Animated.Text style={[styles.appName, { opacity: appNameOpacity }]}>
          Shopnesty
        </Animated.Text>

        <Animated.View
          style={{
            transform: [{ translateY: formTranslateY }],
            width: "100%",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Join Shopnesty Today!</Text>

          {/* Inputs */}
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#ccc"
            style={styles.input}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            placeholderTextColor="#ccc"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            style={styles.input}
          />

          {/* Sign Up Button with loading */}
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: "100%" }}>
            <Pressable
              onPress={handleSignup}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.signupButton}
              disabled={loading} // Disable while loading
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1a6a37" />
              ) : (
                <Text style={styles.signupButtonText}>SIGN UP</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Link to login */}
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.loginLink}>
                Already have an account? <Text style={{ fontWeight: "bold" }}>Sign in</Text>
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </ScrollView>

      {/* Modal for errors */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a6a37" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: SCREEN_HEIGHT,
  },
  appName: { color: "#fff", fontSize: 36, fontWeight: "900", textAlign: "center" },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { color: "#fff", fontSize: 16, textAlign: "center", marginBottom: 32 },
  input: {
    width: "100%",
    backgroundColor: "#2b7a49",
    color: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  signupButton: { backgroundColor: "#fff", paddingVertical: 16, borderRadius: 16, marginBottom: 24, alignItems: "center" },
  signupButtonText: { color: "#1a6a37", fontSize: 18, fontWeight: "600", textAlign: "center" },
  loginLink: { color: "#fff", textAlign: "center", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  modalText: { fontSize: 16, color: "#1a6a37", marginBottom: 16, textAlign: "center" },
  modalButton: {
    backgroundColor: "#1a6a37",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

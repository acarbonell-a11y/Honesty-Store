import { onLogin } from "@/functions/authFunctions";
import useGoogleAuth from "@/functions/useGoogleAuth";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false); // loading state
  const router = useRouter();

  const { request, promptAsync, response } = useGoogleAuth();

  useEffect(() => {
    if (response?.type === "success") console.log("✅ Google Sign-In successful");
  }, [response]);

  // Animations
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const shopNameOpacity = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Keyboard events
  useEffect(() => {
    const keyboardShow = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.parallel([
        Animated.timing(formTranslateY, {
          toValue: -e.endCoordinates.height / 2.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(shopNameOpacity, {
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
        Animated.timing(shopNameOpacity, {
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setModalMessage("Please fill in all fields.");
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const user = await onLogin(email, password);

      if (user) {
        router.replace(
          user.isAdmin
            ? "/(main)/(adminVIEW)/(admin)/dashboard"
            : "/(main)/(users)/(usersMain)/Homepage"
        );
      } else {
        setModalMessage("Invalid email or password.");
        setModalVisible(true);
      }
    } catch (error: any) {
      setModalMessage(error.message || "Login failed.");
      setModalVisible(true);
    } finally {
      setLoading(false);
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
        <Animated.Text style={[styles.appName, { opacity: shopNameOpacity }]}>
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

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

          {/* Sign In Button with Loading */}
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: "100%" }}>
            <Pressable
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.loginButton}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1a6a37" />
              ) : (
                <Text style={styles.loginButtonText}>SIGN IN</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Google Sign-in */}
          <Pressable
            onPress={() => promptAsync()}
            disabled={!request}
            style={styles.googleButton}
          >
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </Pressable>

          {/* Link to signup */}
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={styles.signupText}>
                Don’t have an account? <Text style={{ fontWeight: "bold" }}>Sign up</Text>
              </Text>
            </Pressable>
          </Link>
        </Animated.View>

        {/* Modal for error messages */}
        <Modal
          transparent
          animationType="fade"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>{modalMessage}</Text>
              <Pressable
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a6a37" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, minHeight: SCREEN_HEIGHT },
  appName: { color: "#fff", fontSize: 36, fontWeight: "900", textAlign: "center" },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { color: "#fff", fontSize: 16, textAlign: "center", marginBottom: 32 },
  input: { width: "100%", backgroundColor: "#2b7a49", color: "#fff", padding: 16, borderRadius: 16, marginBottom: 16, fontSize: 16 },
  loginButton: { backgroundColor: "#fff", paddingVertical: 16, borderRadius: 16, marginBottom: 16 },
  loginButtonText: { color: "#1a6a37", fontSize: 18, fontWeight: "600", textAlign: "center" },
  googleButton: { backgroundColor: "#2b7a49", paddingVertical: 16, borderRadius: 16, marginBottom: 24, width: "100%" },
  googleButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  signupText: { color: "#fff", textAlign: "center", fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { backgroundColor: "#fff", padding: 24, borderRadius: 16, width: "80%", alignItems: "center" },
  modalText: { fontSize: 16, textAlign: "center", marginBottom: 16 },
  modalButton: { backgroundColor: "#1a6a37", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

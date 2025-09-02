import { getUserProfile } from "@/services/userServices";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Alert } from "react-native";
import { auth } from "../config/firebaseConfig";
import { handleSignUp } from "./firebaseFunctions";

// Sign-up Function
export const onSignUp = async (
  email: string,
  password: string,
  confirm: string,
  username: string
) => {
  if (password !== confirm) {
    Alert.alert("Error", "Passwords do not match!");
    return false;
  }

  try {
    await handleSignUp(email, password, username);
    Alert.alert("Success", "Account created!");
    return true; // signal success
  } catch (error: any) {
    Alert.alert("Error", error.message);
    return false;
  }
};

// Login Function
export const onLogin = async (
  email: string,
  password: string
): Promise<any | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Fetch profile from Firestore
    const profile = await getUserProfile(uid);

    if (!profile) return null;

    return {
      uid,
      email: userCredential.user.email,
      ...profile, // includes isAdmin
    };
  } catch (error: any) {
    console.error("Login error:", error.message);
    return null;
  }
};

// Sign out
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

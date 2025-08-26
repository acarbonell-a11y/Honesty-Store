import { getUserProfile } from "@/services/userServices";
import { signInWithEmailAndPassword, signOut } from "firebase/auth"; //imports the handler for signing in.
import { Alert } from "react-native";
import { auth } from "../config/firebaseConfig";
import { handleSignUp } from "./firebaseFunctions"; // the firebase wrapper 

//Sign-up Function
export const onSignUp = async (
  email: string,
  password: string,
  confirm: string,
  username: string
) => {
  if (password !== confirm) {
    Alert.alert("Error", "Passwords do not match!");
    return;
  }

  try {
    await handleSignUp(email, password, username);
    Alert.alert("Success", "Account created!");
    return true; // signal success so the screen decides what to do
  } catch (error: any) {
    Alert.alert("Error", error.message);
    return false;
  }
};

//Login Function
export const onLogin = async (
  email: string,
  password: string
): Promise<any | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Fetch profile from Firestore
    const profile = await getUserProfile(uid);

    if (!profile) return null; // No profile found

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
export const logoutUser = () => {
  return signOut(auth);
};
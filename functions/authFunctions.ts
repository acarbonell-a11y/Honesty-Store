import { getUserProfile } from "@/services/userServices";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { auth, db } from "../config/firebaseConfig";
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

export const getCurrentUser = async () => {
  const auth = getAuth();
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    // No user is signed in
    return null;
  }

  try {
    // Get additional user info from Firestore, e.g., isAdmin
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isAdmin: userData.isAdmin || false, // default to false if not set
        ...userData,
      };
    } else {
      // If no Firestore doc exists, return basic info
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isAdmin: false,
      };
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};
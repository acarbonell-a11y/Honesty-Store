// app/functions/settingsFunctions.ts
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";

/**
 * Log out the current user
 */
export const logoutUser = async (): Promise<void> => {
  if (!auth.currentUser) throw new Error("No user is currently logged in.");
  await auth.signOut();
};

/**
 * Fetch current user's profile
 */
export const getUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data(); // { name: string, email: string, ... }
    } else {
      return null;
    }
  } catch (error: unknown) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

/**
 * Change the username of the current user
 */
export const changeUsername = async (uid: string, newName: string) => {
  if (!newName.trim()) throw new Error("Username cannot be empty");
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { name: newName.trim() });
};

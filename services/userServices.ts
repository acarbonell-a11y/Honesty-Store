// app/services/userService.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

//main function for creating  a new user
export const createUserProfile = async (uid: string, name: string, email: string) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    name,
    email,
    createdAt: serverTimestamp(),
    isAdmin: false,
  });
};

//Function for getting user information
export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

// define a type for your user data
export type UserData = {
  email: string;
  name: string;
  role: string;
};

/**
 * USER FUNCTIONS
 */
export const addUser = async (userData: UserData): Promise<string | null> => {
  try {
    const usersCollection = collection(db, "users");
    const docRef = await addDoc(usersCollection, {
      ...userData,
      lastLogin: serverTimestamp(),
    });
    console.log("User added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding user: ", error);
    return null;
  }
};
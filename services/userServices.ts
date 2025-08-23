// app/services/userService.ts
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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

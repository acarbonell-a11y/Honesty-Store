// googleAuthService.ts
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";

// Handles Firebase login with Google
export const firebaseGoogleLogin = async (idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    // If user doc does not exist, create one with your schema
    await setDoc(userRef, {
      name: user.displayName || "",
      email: user.email,
      isAdmin: false, // default
      createdAt: serverTimestamp(), // Firestore server time
    });
  }

  return user;
};

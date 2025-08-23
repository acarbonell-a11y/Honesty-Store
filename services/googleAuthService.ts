// googleAuthService.ts
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

export const firebaseGoogleLogin = async (id_token: string) => {
  try {
    const credential = GoogleAuthProvider.credential(id_token);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user; // Firebase user object
  } catch (error) {
    console.error("Google login error:", error);
    throw error; // so the caller knows login failed
  }
};

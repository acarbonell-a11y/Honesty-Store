import { signInWithEmailAndPassword } from "firebase/auth"; //imports the handler for signing in.
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
): Promise<boolean> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true; // success
  } catch (error: any) {
    console.error("Login error:", error.message);
    return false; // failure
  }
};

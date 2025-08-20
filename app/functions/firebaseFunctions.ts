// app/functions/authFunctions.ts
import { loginUser, signUpUser, } from "../services/authServices";
import { createUserProfile, getUserProfile } from "../services/userServices";

//this handles the setup for new users in the Firebase Database
export const handleSignUp = async (email: string, password: string, name: string) => {
  const userCredential = await signUpUser(email, password);
  const uid = userCredential.user.uid;

  await createUserProfile(uid, name, email);
  return userCredential.user;
};

//This handles the Authentication for Logging in/Signing in (Custom)
export const handleLogin = async (email: string, password: string) => {
  const userCredential = await loginUser(email, password);
  const uid = userCredential.user.uid;

  const profile = await getUserProfile(uid);
  return { ...userCredential.user, profile };
};

// hooks/useGoogleAuth.ts
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../config/firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleAuth() {
  const router = useRouter();
  // pull IDs from app config (set in app.json -> extra.google)
  const {clientId, androidClientId, iosClientId } =
    (Constants.expoConfig?.extra as any)?.google ?? {};

  // Expo Go uses the "Web" client (proxy via auth.expo.dev)
  // Native builds use platform-specific client IDs (no manual redirect URI!)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,        // for Expo Go
    androidClientId,     // for Android build
    iosClientId,          // for iOS build (optional)
  });

  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type === "success") {
        const idToken =
          response.params?.id_token || response.authentication?.idToken;

         if (!idToken) {
          console.error("❌ No ID token found in response");
          return;
        }
        if (idToken) {
          try {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;

            // Firestore doc
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);
            let isAdmin = false;

            if (!docSnap.exists()) {
              await setDoc(userRef, {
                name: user.displayName || "",
                email: user.email,
                isAdmin: false,
                createdAt: serverTimestamp(),
              });
            }
            else{
              const userData = docSnap.data();
              isAdmin = userData.isAdmin === true;
            }

            console.log("✅ Google login success:", user.email);
            if (isAdmin) {
          router.replace("/(main)/(adminVIEW)/(admin)/dashboard"); // goes to (main)/(adminVIEW)/(admin)/dashboard.tsx
          } else {
            router.replace("/(main)/(users)/(usersMain)/Homepage");
          }
          } catch (error) {
            console.error("❌ Firebase Google login error:", error);
          }
        }
      }
    };

    signInWithGoogle();
  }, [response]);

  return { request, response, promptAsync };
}
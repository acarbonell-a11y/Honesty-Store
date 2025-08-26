// hooks/useGoogleAuth.ts
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import * as React from "react";
import { auth, db } from "../config/firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleAuth() {
  const router = useRouter();

  const { clientId, androidClientId, iosClientId } =
    (Constants.expoConfig?.extra as any)?.google ?? {};

  // Google Auth request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,        // Web (Expo Go)
    androidClientId, // Android standalone
    iosClientId,     // iOS standalone
  });

  React.useEffect(() => {
    console.log("clientId:", clientId);
    const handleGoogleSignIn = async () => {
      if (response?.type === "success") {
        const idToken = response.params?.id_token || response.authentication?.idToken;

        if (!idToken) {
          console.error("❌ No ID token found in Google response");
          return;
        }

        try {
          // Firebase credential
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          // Firestore user doc
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
          } else {
            const userData = docSnap.data();
            isAdmin = userData.isAdmin === true;
          }

          console.log("✅ Google login success:", user.email);

          // Navigate based on role
          router.replace(isAdmin ? "/dashboard" : "/homepage");
        } catch (error) {
          console.error("❌ Firebase Google login error:", error);
        }
      }
    };

    handleGoogleSignIn();
  }, [response]);

  /**
   * Sign-in wrapper:
   * - forces useProxy in Expo Go to avoid 400 error
   * - uses default redirect for standalone builds
   */
  const signIn = () => {
    // Force proxy in Expo Go
    const isExpoGo = Constants.appOwnership === "expo" || Constants.appOwnership === "guest";
    promptAsync({ useProxy: isExpoGo });
  };

  return { request, response, signIn };
}

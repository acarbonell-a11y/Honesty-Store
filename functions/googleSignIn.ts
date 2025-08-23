import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../config/firebaseConfig";
  
const router = useRouter();
const isExpoGo = Constants.appOwnership === "expo";
WebBrowser.maybeCompleteAuthSession();

export default function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    webClientId: "688642102325-8ggre5ts31ic8kejd41d0svq65k76l89.apps.googleusercontent.com"
  });

  useEffect(() => {
  const signInWithGoogle = async () => {
    if (response?.type === "success") {
      const { id_token } = response.params;

      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
        router.replace("/(main)/homepage"); // ✅ redirect after login
      }
    }
  };

  signInWithGoogle(); // call the async function
}, [response]);


  return { request, promptAsync };
}

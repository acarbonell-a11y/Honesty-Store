import * as AuthSession from "expo-auth-session";

const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true, // important for Expo Go
});

console.log("Expo Go redirect URI:", redirectUri);

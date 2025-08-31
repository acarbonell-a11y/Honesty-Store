// ... your imports remain unchanged
import { onLogin } from "@/functions/authFunctions";
import useGoogleAuthAlpha from "@/functions/useGoogleAuth";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, Image, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import images from "../../constant/images";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
  const user = await onLogin(email, password);
  if (user) {
    if (user.isAdmin) {
      Alert.alert("Admin Login", "Welcome back, Admin!");
      router.replace("/(main)/(adminVIEW)/(admin)/dashboard"); // 👈 admin route
    } else {
      Alert.alert("Success", "Welcome back!");
      router.replace("/(main)/(users)/(usersMain)/Homepage");
    }
  } else {
    Alert.alert("Error", "Invalid email or password");
  }
};

  //Google Sign-in Hook:
  const { request, promptAsync, response } = useGoogleAuthAlpha();
  useEffect(() => {
    if(response?.type === 'success')
    {
      console.log("Signed in, navigating to homepage...");
      router.replace("/(main)/homepage");
    }
  },[response,router]);
  
  return (
    <View className="flex-1 bg-dark px-6 justify-center">
      {/* Header */}
      <View className="absolute top-16 left-0 right-0 px-6">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={images.arrow} className="w-6 h-6" resizeMode="contain" />
          </TouchableOpacity>

          <Text className="text-white text-3xl font-extrabold flex-1 text-center">
            Shopnesty
          </Text>

          <View className="w-6" />
        </View>
      </View>

      {/* Title */}
      <Text className="text-white text-4xl font-extrabold mt-32">Welcome</Text>
      <Text className="text-pink-500 text-4xl font-extrabold mb-8">Back!</Text>

      {/* Inputs */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email Address"
        placeholderTextColor="#aaa"
        className="bg-gray-800 text-white px-4 py-4 rounded-2xl mb-4"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        className="bg-gray-800 text-white px-4 py-4 rounded-2xl mb-6"
      />

      {/* Email/Password Login */}
      <Pressable
        onPress={handleLogin}
        style={{ paddingVertical: 16, borderRadius: 16, backgroundColor: "#ffffffff" }}
      >
        <Text style={{ color: "black", fontSize: 18, fontWeight: "600", textAlign: "center" }}>
          SIGN IN
        </Text>
      </Pressable>

      {/*Google Sign-in*/}
      <View style={{ marginTop: 20 }}>
  <Button
    title="Sign in with Google"
    disabled={!request}
    onPress={() => promptAsync()}
  />
</View>

      {/* Link to signup */}
      <Link href="/(auth)/signup" asChild>
        <TouchableOpacity className="mt-6">
          <Text className="text-gray-400 text-center">
            Don’t have an account? <Text className="text-pink-500">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

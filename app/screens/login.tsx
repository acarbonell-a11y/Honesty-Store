import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import images from "../../constant/images";
import { onLogin } from "../functions/authFunctions";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
//handles the login button
const handleLogin = async () => {
    const success = await onLogin(email, password);
    if (success) {
      Alert.alert("Success", "Welcome back!");
      router.replace("/screens/homepage"); // 👈 after login, go to home screen
    } else {
      Alert.alert("Error", "Invalid email or password");
    }
  };

  return (
    <View className="flex-1 bg-dark px-6 justify-center">
      {/* Header */}
      <View className="absolute top-16 left-0 right-0 px-6">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Image
              source={images.arrow}
              className="w-6 h-6"
              resizeMode="contain"
            />
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

      {/* Pressable {Custom-button} */}
      <Pressable
        onPress={handleLogin}
        style={{
          paddingVertical: 16,
          borderRadius: 16,
          backgroundColor: "#ffffffff", // pink-500
        }}
      >
        <Text
          style={{
            color: "black",
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          SIGN IN
        </Text>
      </Pressable>

      {/* Link to signup */}
      <Link href="/screens/signup" asChild>
        <TouchableOpacity className="mt-6">
          <Text className="text-gray-400 text-center">
            Don’t have an account? <Text className="text-pink-500">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

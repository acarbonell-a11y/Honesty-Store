import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import images from "../../constant/images";
import { onSignUp } from "../functions/authFunctions";

export default function SignupScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  const handlePress = async () => {
    const success = await onSignUp(email, password, confirm, username);
    if (success) {
      router.replace("/screens/login"); // 👈 navigation only here, inside screen
    }
  };

  return (
    <View className="flex-1 bg-dark px-6 justify-center">
      {/* Header container */}
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
          
          {/* Empty View for balanced spacing */}
          <View className="w-6" />
        </View>
      </View>

      <Text className="text-white text-4xl font-extrabold mt-32">Create an</Text>
      <Text className="text-pink-500 text-4xl font-extrabold mb-8">Account!</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#aaa"
        className="bg-gray-800 text-white px-4 py-4 rounded-2xl mb-4"
      />
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
        className="bg-gray-800 text-white px-4 py-4 rounded-2xl mb-4"
      />
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        className="bg-gray-800 text-white px-4 py-4 rounded-2xl mb-6"
      />
      <Pressable 
        onPress={handlePress} 
        style={{
          paddingVertical: 16,
          borderRadius: 16,
          backgroundColor: "#ffffffff", // Tailwind pink-500,
        }}
        >
          <Text style={{ color: "black", fontSize: 18, fontWeight: "600", textAlign: "center" }}>
            SIGN UP
          </Text>
      </Pressable>

      <Link href="/screens/login" asChild>
        <TouchableOpacity className="mt-6">
          <Text className="text-gray-400 text-center">
            Already have an account? <Text className="text-pink-500">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

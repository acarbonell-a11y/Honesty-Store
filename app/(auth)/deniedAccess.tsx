// app/(auth)/notAuth.tsx
import images from "constant/images"; // 👈 adjust path if needed
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function NotAuthorized() {
  const router = useRouter();

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
      <Text className="text-white text-4xl font-extrabold mt-32">Access</Text>
      <Text className="text-pink-500 text-4xl font-extrabold mb-8">Denied</Text>

      {/* Message */}
      <Text className="text-gray-400 text-center mb-8">
        You don’t have permission to access this page.{"\n"}
        Please contact an administrator if you believe this is a mistake.
      </Text>

      {/* Action Button */}
      <TouchableOpacity
        onPress={() => router.replace("/login")}
        className="bg-white py-4 rounded-2xl"
      >
        <Text className="text-black text-lg font-semibold text-center">
          Go to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

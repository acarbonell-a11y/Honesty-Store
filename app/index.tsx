import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-dark items-center justify-center px-6">
      {/* App Name on top */}
      <Text className="absolute top-16 text-white text-3xl font-extrabold">
        Shopnesty
      </Text>

      <Text className="text-white text-5xl font-extrabold">Let’s Get</Text>
      <Text className="text-pink-500 text-3xl font-extrabold mb-12">
        Started!
      </Text>

      {/* ✅ Go to login */}
      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="px-24 py-4 rounded-2xl bg-pink-500">
          <Text className="text-white text-lg font-semibold">SIGN IN</Text>
        </TouchableOpacity>
      </Link>

      {/* ✅ Go to signup */}
      <Link href="/(auth)/signup" asChild>
        <TouchableOpacity className="absolute bottom-10">
          <Text className="text-gray-400">
            Didn’t have account?{" "}
            <Text className="text-pink-500 text-[12px]">SIGN UP NOW</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

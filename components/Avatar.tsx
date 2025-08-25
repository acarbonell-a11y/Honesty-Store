import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { s } from "react-native-size-matters";

const Avatar = () => {
  const router = useRouter(); // ✅ must be at the top of component

  return (
    <TouchableOpacity onPress={() => console.log("ahhahahah")}>
      <Image source={require("../../assets/avatar.png")} style={styles.avatar} />
    </TouchableOpacity>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    height: s(32),
    width: s(32),
    borderRadius: s(16),
  },
});

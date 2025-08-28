import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const transactionHistory = [
  { id: "1", title: "Electric Bill", amount: "₱1,200.00", status: "Paid", time: "Aug 25, 2025" },
  { id: "2", title: "Water Bill", amount: "₱850.00", status: "Unpaid", time: "Aug 20, 2025" },
  { id: "3", title: "Internet", amount: "₱1,500.00", status: "Paid", time: "Aug 10, 2025" },
];

const ProfileScreen = () => {
  const scaleRight = useRef(new Animated.Value(1)).current;

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const renderIcon = (
    iconName: React.ComponentProps<typeof Ionicons>["name"],
    scale: Animated.Value,
    onPress?: () => void
  ) => (
    <Pressable
      onPress={onPress}
      onPressIn={() => handlePressIn(scale)}
      onPressOut={() => handlePressOut(scale)}
      style={styles.iconWrapper}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={iconName} size={28} color="#000" />
      </Animated.View>
    </Pressable>
  );

  const renderHistoryItem = ({ item }: any) => (
    <View style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <Ionicons
          name={item.status === "Paid" ? "checkmark-circle-outline" : "alert-circle-outline"}
          size={28}
          color={item.status === "Paid" ? "#1a6a37" : "#d9534f"}
        />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historyTime}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyAmount}>{item.amount}</Text>
        <Text style={[styles.historyStatus, { color: item.status === "Paid" ? "#1a6a37" : "#d9534f" }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {renderIcon("settings-outline", scaleRight, () => console.log("Go to Settings"))}
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/150?text=User" }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>johndoe@email.com</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Ionicons name="wallet-outline" size={32} color="#1a6a37" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.balanceLabel}>Balance to Pay</Text>
          <Text style={styles.balanceAmount}>₱2,050.00</Text>
        </View>
      </View>

      {/* History Section */}
      <Text style={styles.sectionTitle}>Payment History</Text>
      <FlatList
        data={transactionHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 17, paddingTop: 45 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  title: { fontWeight: "800", color: "#000", fontSize: 30 },
  iconWrapper: { marginHorizontal: 10 },

  profileSection: { alignItems: "center", marginVertical: 20 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#1a6a37",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  name: { fontSize: 22, fontWeight: "bold", color: "#1a6a37" },
  email: { fontSize: 16, color: "#555" },

  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f9f6",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 16, fontWeight: "600", color: "#444" },
  balanceAmount: { fontSize: 22, fontWeight: "800", color: "#1a6a37" },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#000", marginBottom: 10 },

  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  historyLeft: { flexDirection: "row", alignItems: "center" },
  historyTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  historyTime: { fontSize: 12, color: "#666" },
  historyRight: { alignItems: "flex-end" },
  historyAmount: { fontSize: 14, fontWeight: "700", color: "#111" },
  historyStatus: { fontSize: 12, fontWeight: "600" },
});

export default ProfileScreen;

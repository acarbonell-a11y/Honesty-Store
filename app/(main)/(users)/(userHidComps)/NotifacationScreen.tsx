import { Ionicons } from "@expo/vector-icons";
import NotificationCard from "app/(main)/(users)/(userComponent)/NotificationCard";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string; // YYYY-MM-DD
};

const initialNotifications: Notification[] = [
  { id: "1", title: "Order Shipped", message: "Your order #12345 has been shipped.", time: "2h ago", date: "2025-08-27" },
  { id: "2", title: "New Message", message: "You received a new message from support.", time: "5h ago", date: "2025-08-27" },
  { id: "3", title: "Discount Alert", message: "Get 20% off on your next purchase!", time: "1d ago", date: "2025-08-26" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Group notifications by date
  const groupedNotifications: Record<string, Notification[]> = notifications.reduce((groups, notif) => {
    if (!groups[notif.date]) groups[notif.date] = [];
    groups[notif.date].push(notif);
    return groups;
  }, {} as Record<string, Notification[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="#f2f2f7" />

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#222" />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
        </View>

        {/* Notifications List */}
        <FlatList
          data={sortedDates}
          keyExtractor={date => date}
          renderItem={({ item: date }) => (
            <View>
              {/* Date Stamp */}
              <Text style={styles.dateStamp}>{new Date(date).toDateString()}</Text>

              {groupedNotifications[date].map((n: Notification) => (
                <View key={n.id} style={{ padding: 17 }}>
                  <Pressable onPress={() => router.push('/(main)/(users)/(userHidComps)/(notifications)/[id]')}>
                    <NotificationCard
                      id={n.id}
                      title={n.title}
                      message={n.message}
                      time={n.time}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: { marginRight: 12, padding: 4 },
  title: { fontWeight: "700", color: "#222", fontSize: 20 },
  dateStamp: { fontSize: 14, fontWeight: "600", color: "#888", marginVertical: 8, paddingLeft: 17 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 12, fontSize: 18, fontWeight: "600", color: "#888" },
});

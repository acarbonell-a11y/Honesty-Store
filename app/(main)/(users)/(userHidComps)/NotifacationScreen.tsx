import { markGlobalNotificationRead, markSingleUserNotificationRead } from "@/functions/notificationFunctions";
import { Ionicons } from "@expo/vector-icons";
import NotificationCard from "app/(main)/(users)/(userComponent)/NotificationCard";
import { db } from "config/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type Notification = {
  id: string;
  type: "global" | "user";
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const auth = getAuth();

  const [globalNotifications, setGlobalNotifications] = useState<Notification[]>([]);
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;

    // Global notifications
    const globalRef = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubGlobal = onSnapshot(
      globalRef,
      (snapshot) => {
        const notifs: Notification[] = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const createdAt = data.createdAt?.toDate?.() ?? new Date();
          return {
            id: `global-${doc.id}`,
            type: "global",
            title: data.title || "",
            message: data.message || "",
            time: timeAgo(createdAt),
            date: createdAt.toISOString().split("T")[0],
            read: data.readBy?.includes(userId) ?? false,
          };
        });
        setGlobalNotifications(notifs);
      },
      (error) => console.error("Failed to fetch global notifications:", error)
    );

    // User-specific notifications
    const userRef = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubUser = onSnapshot(
      userRef,
      (snapshot) => {
        const notifs: Notification[] = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const createdAt = data.createdAt?.toDate?.() ?? new Date();
          return {
            id: `user-${doc.id}`,
            type: "user",
            title: data.title || "",
            message: data.message || "",
            time: timeAgo(createdAt),
            date: createdAt.toISOString().split("T")[0],
            read: data.read || false,
          };
        });
        setUserNotifications(notifs);
      },
      (error) => console.error("Failed to fetch user notifications:", error)
    );

    return () => {
      unsubGlobal();
      unsubUser();
    };
  }, [auth]);

  // Merge and group notifications by date
  const notifications = [...globalNotifications, ...userNotifications];
  const groupedNotifications: Record<string, Notification[]> = notifications.reduce((groups, notif) => {
    if (!groups[notif.date]) groups[notif.date] = [];
    groups[notif.date].push(notif);
    return groups;
  }, {} as Record<string, Notification[]>);

  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const handlePress = async (notif: Notification) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;

    if (notif.read) return; // already read
    if (notif.type === "global") {
      setGlobalNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      const notifId = notif.id.replace(/^global-/, "");
      try {
        await markGlobalNotificationRead(notifId, userId);
      } catch (err) {
        console.error("Failed to mark global notification as read", err);
      }
    } else if (notif.type === "user") {
      setUserNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      const notifId = notif.id.replace(/^user-/, "");
      try {
        await markSingleUserNotificationRead(userId, notifId);
      } catch (err) {
        console.error("Failed to mark user notification as read", err);
      }
    }
  };

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
          keyExtractor={(date) => date}
          renderItem={({ item: date }) => (
            <View>
              <Text style={styles.dateStamp}>{new Date(date).toDateString()}</Text>
              {groupedNotifications[date].map((n: Notification) => (
                <Pressable
                  key={n.id}
                  onPress={() => handlePress(n)}
                  style={{ padding: 17, opacity: n.read ? 0.5 : 1 }}
                >
                  <NotificationCard id={n.id} title={n.title} message={n.message} time={n.time} />
                </Pressable>
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

// Simple "time ago" helper
function timeAgo(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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
  dateStamp: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginVertical: 8,
    paddingLeft: 17,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#888",
  },
});

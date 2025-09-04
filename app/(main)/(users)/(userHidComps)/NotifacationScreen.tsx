import { markGlobalNotificationRead, markSingleUserNotificationRead } from "@/functions/notificationFunctions";
import { Ionicons } from "@expo/vector-icons";
import NotificationCard from "app/(main)/(users)/(userComponent)/NotificationCard";
import { db } from "config/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  const [refreshing, setRefreshing] = useState(false);

  // "time ago" helper
  const timeAgo = (date: Date) => {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // One-time fetch (for refresh)
  const fetchNotifications = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;

    try {
      const globalSnap = await getDocs(
        query(collection(db, "notifications"), orderBy("createdAt", "desc"))
      );
      const globalNotifs: Notification[] = globalSnap.docs.map((doc) => {
        const data = doc.data() as any;
        const createdAt = data.createdAt?.toDate?.() ?? new Date();
        return {
          id: `global-${doc.id}`,
          type: "global",
          title: data.title || "",
          message: data.message || "",
          time: timeAgo(createdAt),
          date: createdAt.toISOString().split("T")[0],
          read: Array.isArray(data.readBy) ? data.readBy.includes(userId) : false,
        };
      });
      setGlobalNotifications(globalNotifs);

      const userSnap = await getDocs(
        query(collection(db, "users", userId, "notifications"), orderBy("createdAt", "desc"))
      );
      const userNotifs: Notification[] = userSnap.docs.map((doc) => {
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
      setUserNotifications(userNotifs);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [auth]);

  // Real-time updates + initial fetch
  useEffect(() => {
    fetchNotifications();

    fetchNotifications();

    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;

    const unsubGlobal = onSnapshot(
      query(collection(db, "notifications"), orderBy("createdAt", "desc")),
      query(collection(db, "notifications"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const notifs: Notification[] = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
          return {
            id: `global-${doc.id}`,
            type: "global",
            title: data.title || "",
            message: data.message || "",
            time: timeAgo(createdAt),
            date: createdAt.toISOString().split("T")[0],
            read: Array.isArray(data.readBy) ? data.readBy.includes(userId) : false,
            read: Array.isArray(data.readBy) ? data.readBy.includes(userId) : false,
          };
        });
        setGlobalNotifications(notifs);
      },
      (error) => console.error("Failed to fetch global notifications:", error)
    );

    const unsubUser = onSnapshot(
      query(collection(db, "users", userId, "notifications"), orderBy("createdAt", "desc")),
      query(collection(db, "users", userId, "notifications"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const notifs: Notification[] = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
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
      }
    );

    return () => {
      unsubGlobal();
      unsubUser();
    };
  }, [auth, fetchNotifications]);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Mark as read
  const markAsRead = async (notif: Notification) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;

    if (notif.read) return;

    if (notif.read) return;

    if (notif.type === "global") {
      setGlobalNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      const notifId = notif.id.replace(/^global-/, "");
      await markGlobalNotificationRead(notifId, userId).catch(console.error);
    } else {
      await markGlobalNotificationRead(notifId, userId).catch(console.error);
    } else {
      setUserNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      const notifId = notif.id.replace(/^user-/, "");
      await markSingleUserNotificationRead(userId, notifId).catch(console.error);
    }
  };

  // Merge + group by date
  const notifications = [...globalNotifications, ...userNotifications];
  const groupedNotifications: Record<string, Notification[]> = notifications.reduce(
    (groups, notif) => {
      if (!groups[notif.date]) groups[notif.date] = [];
      groups[notif.date].push(notif);
      return groups;
    },
    {} as Record<string, Notification[]>
  );

  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header (clean) */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#222" />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
        </View>

        {/* FlatList with refresh + spacing */}
        <FlatList
          data={sortedDates}
          keyExtractor={(date) => date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item: date }) => (
            <View>
              <Text style={styles.dateStamp}>{new Date(date).toDateString()}</Text>
              {groupedNotifications[date].map((n) => (
                <NotificationCard
              {groupedNotifications[date].map((n) => (
                <NotificationCard
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  message={n.message}
                  time={n.time}
                  read={n.read}
                  onOpen={() => markAsRead(n)}
                />
                  id={n.id}
                  title={n.title}
                  message={n.message}
                  time={n.time}
                  read={n.read}
                  onOpen={() => markAsRead(n)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
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
    paddingVertical: 10,
  },
  title: { fontWeight: "700", color: "#222", fontSize: 20, marginLeft: 10 },
    paddingVertical: 10,
  },
  title: { fontWeight: "700", color: "#222", fontSize: 20, marginLeft: 10 },
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

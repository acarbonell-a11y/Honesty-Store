import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type NotificationProps = {
  id: string;
  title: string;
  message: string;
  time: string;
  read?: boolean;
  onOpen?: () => void; // called when modal opens
};

export default function NotificationCard({
  title,
  message,
  time,
  read = false,
  onOpen,
}: NotificationProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(read ? 0.5 : 1)).current; // opacity

  const [modalVisible, setModalVisible] = useState(false);

  // Animate fade when `read` changes
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: read ? 0.5 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [read]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    setModalVisible(true);
    if (onOpen) onOpen(); // mark as read after opening modal
  };

  return (
    <>
      <Animated.View
        style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
      >
        <Pressable style={styles.content} onPress={handlePress}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="notifications-outline"
              size={28}
              color={read ? "#999" : "#1a6a37"}
            />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.title,
                  read && { color: "#999", fontWeight: "400" },
                ]}
              >
                {title}
              </Text>
              <Text style={[styles.time, read && { color: "#bbb" }]}>{time}</Text>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.message, read && { color: "#aaa" }]}
            >
              {message}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  content: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: { marginRight: 12 },
  textContainer: { flex: 1 },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontWeight: "600", fontSize: 15, color: "#111" },
  message: { fontSize: 13, color: "#666" },
  time: { fontSize: 12, color: "#999" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20, width: "100%" },
  modalTitle: { fontWeight: "700", fontSize: 18, marginBottom: 12, color: "#111" },
  modalMessage: { fontSize: 15, color: "#444", marginBottom: 20 },
  closeBtn: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "#1a6a37", borderRadius: 10 },
  closeText: { color: "#fff", fontWeight: "600" },
});

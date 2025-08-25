import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ms, s, vs } from "react-native-size-matters";

interface ModalContentProps {
  title: string;
  data: Array<{
    name: string;
    value: string;
    subtitle?: string;
    hint?: string;
  }>;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Popup({ title, data, onClose }: ModalContentProps) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {data.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemValue}>{item.value}</Text>
              </View>
              {item.subtitle && (
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              )}
              {item.hint && (
                <Text style={styles.itemHint}>{item.hint}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: s(20),
  },
  modalContent: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: "#fff",
    borderRadius: ms(20),
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fafafa",
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: s(4),
    borderRadius: ms(20),
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: s(20),
  },
  itemCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: ms(12),
    padding: s(16),
    marginBottom: vs(12),
    borderLeftWidth: 4,
    borderLeftColor: "#1a6a37",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: vs(4),
  },
  itemName: {
    fontSize: ms(16),
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: s(8),
  },
  itemValue: {
    fontSize: ms(16),
    fontWeight: "700",
    color: "#1a6a37",
  },
  itemSubtitle: {
    fontSize: ms(14),
    color: "#666",
    marginBottom: vs(2),
  },
  itemHint: {
    fontSize: ms(12),
    color: "#888",
    fontStyle: "italic",
  },
});
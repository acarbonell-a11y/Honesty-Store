import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type CartItemProps = {
  id: string;
  name: string;
  price: string;
  image: string;
  qty: number;
  checked: boolean;
  onQtyChange: (id: string, type: "inc" | "dec") => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function CartItemCard({
  id,
  name,
  price,
  image,
  qty,
  checked,
  onQtyChange,
  onToggle,
  onDelete,
}: CartItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleQtyChange = (type: "inc" | "dec") => {
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

    onQtyChange(id, type);
  };

  // 👇 swipe right action (delete)
  const renderRightActions = () => (
    <Pressable style={styles.deleteButton} onPress={() => onDelete(id)}>
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </Pressable>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
          checked && styles.checkedCard,
        ]}
      >
        {/* Checkbox */}
        <Pressable onPress={() => onToggle(id)} style={styles.checkContainer}>
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </Pressable>

        {/* Product Image */}
        <Image source={{ uri: image }} style={styles.itemImage} />

        {/* Info */}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, checked && styles.checkedText]}>
            {name}
          </Text>
          <Text style={styles.itemPrice}>${price}</Text>
        </View>

        {/* Qty controls */}
        <View style={styles.qtyContainer}>
          <Pressable
            style={styles.qtyButton}
            onPress={() => handleQtyChange("dec")}
            disabled={qty <= 1}
          >
            <Ionicons
              name="remove"
              size={16}
              color={qty <= 1 ? "#ccc" : "#1a6a37"}
            />
          </Pressable>
          <Text style={styles.qtyText}>{qty}</Text>
          <Pressable
            style={[styles.qtyButton, styles.qtyAdd]}
            onPress={() => handleQtyChange("inc")}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>
    </Swipeable>
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
  checkedCard: {
    backgroundColor: "#f9fafb",
  },
  checkContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    borderColor: "#1a6a37",
    backgroundColor: "#1a6a37",
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111",
    marginBottom: 4,
  },
  checkedText: {
    color: "#6b7280",
    textDecorationLine: "line-through",
  },
  itemPrice: {
    fontWeight: "700",
    fontSize: 15,
    color: "#499966ff",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyAdd: {
    backgroundColor: "#000000ff",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    minWidth: 20,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#e11d48",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    borderRadius: 16,
    marginBottom: 14,
  },
});

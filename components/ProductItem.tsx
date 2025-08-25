import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { ms, s, vs } from "react-native-size-matters";
import { Product } from "../admin/inventory";

interface ProductItemProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductItem({ product, onEdit, onDelete }: ProductItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case "In stock": return "#28a745";
      case "Low stock": return "#ffc107";
      case "Out of stock": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusIcon = (status: Product['status']) => {
    switch (status) {
      case "In stock": return "checkmark-circle";
      case "Low stock": return "warning";
      case "Out of stock": return "close-circle";
      default: return "help-circle";
    }
  };

  // Fixed: Added proper type annotation
  const renderRightActions = (
    progress: Animated.AnimatedAddition<number>, 
    dragX: Animated.AnimatedAddition<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [0, 50, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.rightActions, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(product.id);
          }}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Fixed: Added proper type annotation
  const renderLeftActions = (
    progress: Animated.AnimatedAddition<number>, 
    dragX: Animated.AnimatedAddition<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.leftActions, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            swipeableRef.current?.close();
            onEdit(product);
          }}
        >
          <Ionicons name="create" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={40}
      rightThreshold={40}
    >
      <View style={styles.itemContainer}>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>
              {product.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
              <Ionicons 
                name={getStatusIcon(product.status)} 
                size={12} 
                color="#fff" 
                style={styles.statusIcon}
              />
              <Text style={styles.statusText}>{product.status}</Text>
            </View>
          </View>
          
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="pricetag" size={16} color="#6c757d" />
              <Text style={styles.detailText}>${product.price.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="cube" size={16} color="#6c757d" />
              <Text style={styles.detailText}>{product.stock} units</Text>
            </View>
          </View>

          {product.category && (
            <Text style={styles.categoryText}>{product.category}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onEdit(product)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: "#fff",
    marginBottom: vs(12),
    borderRadius: ms(12),
    padding: s(16),
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
  },
  itemName: {
    fontSize: ms(16),
    fontWeight: "700",
    color: "#212529",
    flex: 1,
    marginRight: s(8),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: ms(12),
  },
  statusIcon: {
    marginRight: s(4),
  },
  statusText: {
    fontSize: ms(11),
    fontWeight: "600",
    color: "#fff",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(4),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: ms(14),
    color: "#6c757d",
    marginLeft: s(4),
    fontWeight: "500",
  },
  categoryText: {
    fontSize: ms(12),
    color: "#adb5bd",
    fontStyle: "italic",
  },
  moreButton: {
    padding: s(8),
  },
  leftActions: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: s(20),
  },
  rightActions: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: s(20),
  },
  editButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: s(20),
    paddingVertical: vs(15),
    borderRadius: ms(8),
    alignItems: "center",
    minWidth: s(80),
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: s(20),
    paddingVertical: vs(15),
    borderRadius: ms(8),
    alignItems: "center",
    minWidth: s(80),
  },
  actionText: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "600",
    marginTop: vs(4),
  },
});
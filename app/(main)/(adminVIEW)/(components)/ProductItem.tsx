import { Ionicons } from "@expo/vector-icons";
import { Product } from "functions/types";
import React from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type ProductCardProps = {
  product: Product;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  onMore: (id: string) => void;
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onDelete,
  onEdit,
  onMore,
}) => {
  // Map status → icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "in stock":
        return "checkmark-circle";
      case "low stock":
        return "warning";
      case "out of stock":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  // Right swipe actions (Delete)
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [0, 50, 100],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.actionContainer,
          { transform: [{ translateX: trans }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(product.id)}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Left swipe actions (Edit)
  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0, 0],
    });

    return (
      <Animated.View
        style={[
          styles.actionContainer,
          { transform: [{ translateX: trans }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(product)}
        >
          <Ionicons name="create" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
    >
      <View style={styles.card}>
        {/* Product image */}
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="image" size={30} color="#ccc" />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{product.price}</Text>
          <Text style={styles.category}>{product.category}</Text>

          {/* Stock + Status */}
          <View style={styles.stockStatus}>
            <Text style={styles.stock}>
              Stock: {product.stock ?? "N/A"}
            </Text>
            <View style={styles.statusBadge}>
              <Ionicons
                name={getStatusIcon(product.status)}
                size={12}
                color="#fff"
                style={styles.statusIcon}
              />
              <Text style={styles.statusText}>{product.status}</Text>
            </View>
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    alignItems: "center",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  placeholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 12,
    color: "#666",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  category: {
    fontSize: 12,
    color: "#999",
  },
  stockStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  stock: {
    fontSize: 12,
    marginRight: 10,
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#007bff",
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
  },
  moreButton: {
    padding: 5,
  },
  actionContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  actionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  editButton: {
    backgroundColor: "#28a745",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },
});

export default ProductCard;

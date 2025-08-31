import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ProductCardProps = {
  title: string;
  description?: string;
  price: string;
  stock?: number;
  category?: string;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  image?: string;
};

const screenWidth = Dimensions.get("window").width;
const horizontalPadding = 34; // left + right padding from parent
const columnGap = 15; // gap between cards
const numColumns = 2;
const cardWidth = (screenWidth - horizontalPadding - columnGap) / numColumns;

export default function ProductCard({
  title,
  description,
  price,
  stock,
  category,
  onAddToCart,
  image,
}: ProductCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  const closeModal = () => {
    Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
      setModalVisible(false)
    );
  };

  const pricePHP = `₱${parseFloat(price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Pressable
        onPress={openModal}
        onPressIn={() => Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(cardScale, { toValue: 1, useNativeDriver: true }).start()}
      >
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }], width: cardWidth }]}>
          <Image
            source={image ? { uri: image } : require("./image.png")}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.price}>{pricePHP}</Text>
            {stock !== undefined && <Text style={styles.stock}>Stock: {stock}</Text>}
            {category && <Text style={styles.stock}>Category: {category}</Text>}
          </View>
        </Animated.View>
      </Pressable>

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Image
              source={image ? { uri: image } : require("./image.png")}
              style={styles.modalImage}
              resizeMode="cover"
            />
            <Text style={styles.modalTitle}>{title}</Text>
            {description && <Text style={styles.modalDescription}>{description}</Text>}
            <Text style={styles.modalPrice}>Price: {pricePHP}</Text>
            {stock !== undefined && <Text style={styles.modalStock}>Stock: {stock}</Text>}
            {category && <Text style={styles.modalStock}>Category: {category}</Text>}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#60d38aff" }]}
                onPress={onAddToCart}
              >
                <Text style={styles.modalButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    marginRight: 12,
    shadowColor: "#b7b7b7ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: "visible",
  },
  image: { width: "100%", height: 140, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  infoContainer: { padding: 12 },
  title: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  price: { fontSize: 14, fontWeight: "bold", color: "#1a6a37", marginBottom: 2 },
  stock: { fontSize: 12, color: "#999" },

  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "85%", backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center", elevation: 12 },
  modalImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalDescription: { fontSize: 14, color: "#666", marginBottom: 8, textAlign: "center" },
  modalPrice: { fontSize: 16, fontWeight: "600", color: "#999", marginBottom: 6 },  
  modalStock: { fontSize: 14, color: "#999", marginBottom: 12 },

  buttonRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 10 },
  modalButton: { flex: 1, borderRadius: 12, paddingVertical: 10, marginHorizontal: 5, alignItems: "center" },
  modalButtonText: { fontWeight: "700", fontSize: 14, color: "#fff" },

  closeButton: { padding: 6 },
  closeButtonText: { color: "#a9a9a9ff", fontWeight: "600" },
});

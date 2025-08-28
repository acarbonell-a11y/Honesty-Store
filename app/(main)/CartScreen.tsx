import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import CartItemCard from "./UserComponent/CartItemCard";

const initialCartItems = [
  { id: "1", name: "Bose Quiet Comfort", price: "520", qty: 1, checked: false, image: "https://picsum.photos/100/100?random=11" },
  { id: "2", name: "Robert Geller x Levi's Gradient Shirt", price: "60", qty: 1, checked: false, image: "https://picsum.photos/100/100?random=12" },
  { id: "3", name: "PUMA Speeder Mesh Running Shoes", price: "49", qty: 1, checked: false, image: "https://picsum.photos/100/100?random=13" },
  { id: "4", name: "PUMA Sports Socks (Set of Three)", price: "11", qty: 1, checked: false, image: "https://picsum.photos/100/100?random=14" },
];

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [modalVisible, setModalVisible] = useState(false);
  const [nextBillingDate, setNextBillingDate] = useState("");

  // Handle quantity change
  const handleQtyChange = (id: string, type: "inc" | "dec") => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, qty: type === "inc" ? item.qty + 1 : Math.max(1, item.qty - 1) }
          : item
      )
    );
  };

  // Handle toggle check
  const handleToggle = (id: string) => {
    setCartItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate total
  const total = useMemo(() => {
    return cartItems
      .filter(item => item.checked)
      .reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0)
      .toFixed(2);
  }, [cartItems]);

  // Animation for checkout bar
  const checkoutVisible = useSharedValue(cartItems.length > 0 ? 1 : 0);

  useEffect(() => {
    checkoutVisible.value = cartItems.length > 0 ? 1 : 0;
  }, [cartItems]);

  const checkoutStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(checkoutVisible.value ? 0 : 100) }],
    opacity: withTiming(checkoutVisible.value ? 1 : 0),
  }));

  // Calculate next Monday dynamically
  const calculateNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (8 - day) % 7; // days until next Monday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toDateString();
  };

  const handleCheckout = () => {
    if (parseFloat(total) === 0) return;
    setNextBillingDate(calculateNextMonday());
    setModalVisible(true);
    // Optionally, clear the cart after checkout
    setCartItems(prev => prev.filter(item => !item.checked));
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
          <Text style={styles.title}>My Cart</Text>
        </View>

        {/* Cart List */}
        <FlatList
          data={cartItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CartItemCard
              id={item.id}
              name={item.name}
              price={item.price}
              image={item.image}
              qty={item.qty}
              checked={item.checked}
              onQtyChange={handleQtyChange}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Your cart is empty</Text>
            </View>
          )}
        />

        {/* Animated Checkout Bar */}
        <Animated.View style={[styles.checkoutBar, checkoutStyle]}>
          <Text style={styles.totalText}>
            Total: <Text style={styles.totalPrice}>${total}</Text>
          </Text>
          <Pressable
            style={styles.checkoutBtn}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </Animated.View>

        {/* Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Thank you for your purchase!</Text>
              <Text style={styles.modalText}>Your next billing will be on:</Text>
              <Text style={styles.modalDate}>{nextBillingDate}</Text>
              <Pressable
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  totalText: { fontSize: 16, fontWeight: "600", color: "#333" },
  totalPrice: { fontWeight: "800", color: "#868686ff" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a6a37",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  checkoutText: { fontSize: 15, fontWeight: "700", color: "#fff", marginRight: 6 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 12, fontSize: 18, fontWeight: "600", color: "#888" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  modalText: { fontSize: 16, marginBottom: 8 },
  modalDate: { fontSize: 16, fontWeight: "600", marginBottom: 20, color: "#1a6a37" },
  modalButton: {
    backgroundColor: "#1a6a37",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

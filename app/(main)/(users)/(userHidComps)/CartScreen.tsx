import { Ionicons } from "@expo/vector-icons";
import CartItemCard from "app/(main)/(users)/(userComponent)/CartItemCard";
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

import { auth, db } from "config/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

// Types
type InventoryItem = {
  name: string;
  price: number | string;
  image: string;
  stock?: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  checked: boolean;
};

const coercePrice = (p: number | string): number =>
  typeof p === "number" ? p : parseFloat(p);

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nextBillingDate, setNextBillingDate] = useState("");

  // cart ref for logged in user
  const cartCollectionRefForUser = () => {
    const user = auth.currentUser;
    if (!user) return null;
    return collection(db, "users", user.uid, "cart");
  };

  // Live updates from Firestore
  useEffect(() => {
    const ref = cartCollectionRefForUser();
    if (!ref) return;

    const unsubscribe = onSnapshot(ref, async (snap) => {
      if (snap.empty) {
        setCartItems([]);
        return;
      }

      const resolved: CartItem[] = [];

      for (const cartDoc of snap.docs) {
        const data = cartDoc.data() as {
          products: { productId: string; quantity: number }[];
        };
        if (!data.products) continue;

        for (const { productId, quantity } of data.products) {
          const prodRef = doc(db, "inventory", productId);
          const prodSnap = await getDoc(prodRef);
          if (!prodSnap.exists()) continue;

          const prodData = prodSnap.data() as InventoryItem;

          resolved.push({
            id: productId,
            name: prodData.name,
            price: coercePrice(prodData.price),
            image: prodData.image,
            qty: quantity,
            checked: false,
          });
        }
      }

      setCartItems(resolved);
    });

    return () => unsubscribe();
  }, []);

  // fetch cart (manual refresh)
  const fetchCart = async () => {
    try {
      const ref = cartCollectionRefForUser();
      if (!ref) return;

      const snap = await getDocs(ref);
      if (snap.empty) {
        setCartItems([]);
        return;
      }

      const resolved: CartItem[] = [];
      for (const cartDoc of snap.docs) {
        const data = cartDoc.data() as {
          products: { productId: string; quantity: number }[];
        };
        if (!data.products) continue;

        for (const { productId, quantity } of data.products) {
          const prodRef = doc(db, "inventory", productId);
          const prodSnap = await getDoc(prodRef);
          if (!prodSnap.exists()) continue;

          const prodData = prodSnap.data() as InventoryItem;

          resolved.push({
            id: productId,
            name: prodData.name,
            price: coercePrice(prodData.price),
            image: prodData.image,
            qty: quantity,
            checked: false,
          });
        }
      }
      setCartItems(resolved);
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
    }
  };

  // update Firestore on qty change
  const syncCart = async (productId: string, newQty: number) => {
    const ref = cartCollectionRefForUser();
    if (!ref) return;
    try {
      const snap = await getDocs(ref);
      if (snap.empty) return;

      const cartDoc = snap.docs[0];
      const cartDocRef = cartDoc.ref;
      const cartData = cartDoc.data() as {
        products: { productId: string; quantity: number }[];
      };

      const updatedProducts = cartData.products.map((p) =>
        p.productId === productId ? { ...p, quantity: newQty } : p
      );

      await updateDoc(cartDocRef, { products: updatedProducts });

      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, qty: newQty } : item
        )
      );
    } catch (err) {
      console.error("❌ Error syncing cart:", err);
    }
  };

  // delete item
  const handleDelete = async (productId: string) => {
    const ref = cartCollectionRefForUser();
    if (!ref) return;
    try {
      const snap = await getDocs(ref);
      if (snap.empty) return;

      const cartDoc = snap.docs[0];
      const cartDocRef = cartDoc.ref;
      const cartData = cartDoc.data() as {
        products: { productId: string; quantity: number }[];
      };

      const updatedProducts = cartData.products.filter(
        (p) => p.productId !== productId
      );

      await updateDoc(cartDocRef, { products: updatedProducts });

      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      console.error("❌ Error deleting item:", err);
    }
  };

  // toggle checkbox
  const handleToggle = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // update qty
  const handleQtyChange = async (productId: string, type: "inc" | "dec") => {
    const ref = cartCollectionRefForUser();
    if (!ref) return;

    try {
      const snap = await getDocs(ref);
      if (snap.empty) return;

      const cartDoc = snap.docs[0];
      const cartDocRef = cartDoc.ref;
      const cartData = cartDoc.data() as {
        products: { productId: string; quantity: number }[];
      };

      const updatedProducts = cartData.products.map((p) =>
        p.productId === productId
          ? {
              ...p,
              quantity:
                type === "inc"
                  ? p.quantity + 1
                  : Math.max(1, p.quantity - 1),
            }
          : p
      );

      await updateDoc(cartDocRef, { products: updatedProducts });

      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId
            ? {
                ...item,
                qty:
                  type === "inc"
                    ? item.qty + 1
                    : Math.max(1, item.qty - 1),
              }
            : item
        )
      );
    } catch (err) {
      console.error("❌ Error updating quantity:", err);
    }
  };

  // calculate total
  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.checked)
      .reduce((sum, item) => sum + item.price * item.qty, 0)
      .toFixed(2);
  }, [cartItems]);

  // animation
  const checkoutVisible = useSharedValue(cartItems.length > 0 ? 1 : 0);

  useEffect(() => {
    checkoutVisible.value = cartItems.length > 0 ? 1 : 0;
  }, [cartItems]);

  const checkoutStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(checkoutVisible.value ? 0 : 100) }],
    opacity: withTiming(checkoutVisible.value ? 1 : 0),
  }));

  // next Monday
  const calculateNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (8 - day) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toDateString();
  };

  // checkout
const handleCheckout = async () => {
  if (parseFloat(total) === 0) return;

  try {
    const user = auth.currentUser;
    if (!user) return;

    const ref = cartCollectionRefForUser();
    if (!ref) return;

    const snap = await getDocs(ref);
    if (snap.empty) return;

    const cartDoc = snap.docs[0];
    const cartDocRef = cartDoc.ref;
    const cartData = cartDoc.data() as {
      products: { productId: string; quantity: number }[];
    };

    const selectedItems = cartItems.filter((item) => item.checked);
    const items: any[] = [];
    let subtotal = 0;

    for (const cartItem of selectedItems) {
      const prodRef = doc(db, "inventory", cartItem.id);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) continue;

      const prodData = prodSnap.data() as InventoryItem;
      const totalItem = coercePrice(prodData.price) * cartItem.qty;
      subtotal += totalItem;

      items.push({
        id: prodRef, // 🔗 reference
        name: prodData.name,
        price: coercePrice(prodData.price),
        quantity: cartItem.qty,
        total: totalItem,
        notes: "",
      });
    }

    const tax = 0;
    const totalAmount = subtotal + tax;

    // ✅ Get customerName from "users" collection
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let customerName = "Unknown";

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      customerName = userData.name || userData.fullName || "Unknown"; 
      // 👆 depends on what field you use in "users" collection
    }

    await addDoc(collection(db, "transactions"), {
      amountPaid: totalAmount,
      customerName, // ✅ now from users collection
      date: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items,
      notes: "",
      paymentMethod: "Cash",
      paymentStatus: "Pending",
      receiptNumber: Math.floor(1000 + Math.random() * 9000).toString(),
      subtotal,
      tax,
      total: totalAmount,
      userId: user.uid,
      userRef: userDocRef,
    });

    // remove checked items from cart
    const updatedProducts = cartData.products.filter(
      (p) => !selectedItems.some((sel) => sel.id === p.productId)
    );
    await updateDoc(cartDocRef, { products: updatedProducts });

    // modal
    setNextBillingDate(calculateNextMonday());
    setModalVisible(true);
    setCartItems((prev) => prev.filter((item) => !item.checked));
  } catch (err) {
    console.error("❌ Checkout error:", err);
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
          <Text style={styles.title}>My Cart</Text>
        </View>

        {/* Cart List */}
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CartItemCard
              id={item.id}
              name={item.name}
              price={item.price.toString()}
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
            Total: <Text style={styles.totalPrice}>₱{total}</Text>
          </Text>
          <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
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
              <Text style={styles.modalTitle}>
                Thank you for your purchase!
              </Text>
              <Text style={styles.modalText}>
                Your next billing will be on:
              </Text>
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
  totalPrice: { fontWeight: "800", color: "#1a6a37" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a6a37",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  checkoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginRight: 6,
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
  modalDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
    color: "#1a6a37",
  },
  modalButton: {
    backgroundColor: "#1a6a37",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

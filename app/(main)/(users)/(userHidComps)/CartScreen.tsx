import { addTransaction, Transaction } from "@/functions/firebaseFunctions";
import { Ionicons } from "@expo/vector-icons";
import CartItemCard from "app/(main)/(users)/(userComponent)/CartItemCard";
import { auth, db } from "config/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type InventoryItem = {
  name: string;
  price: number | string;
  imageUrl: string;
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

const coercePrice = (p: number | string): number => (typeof p === "number" ? p : parseFloat(p));
const coercePrice = (p: number | string): number => (typeof p === "number" ? p : parseFloat(p));

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const cartCollectionRefForUser = () => {
    const user = auth.currentUser;
    if (!user) return null;
    return collection(db, "users", user.uid, "cart");
  };

  useEffect(() => {
  const ref = cartCollectionRefForUser();
  if (!ref) return;

  const unsubscribe = onSnapshot(ref, async (snap) => {
    if (snap.empty) {
      setCartItems([]);
      return;
    }

    const allItems: CartItem[] = [];

    for (const cartDoc of snap.docs) {
      const data = cartDoc.data() as { products: { productId: string; quantity: number }[] };
      if (!data.products) continue;

      const resolvedItems = await Promise.all(
        data.products.map(async ({ productId, quantity }) => {
          const prodSnap = await getDoc(doc(db, "inventory", productId));
          if (!prodSnap.exists()) return null;
          const prodData = prodSnap.data() as InventoryItem;
          return {
            id: productId,
            name: prodData.name,
            price: coercePrice(prodData.price),
            image: prodData.imageUrl,
            qty: quantity,
            checked: false,
          } as CartItem;
        })
      );

      allItems.push(...resolvedItems.filter(Boolean) as CartItem[]);
    }

    setCartItems(allItems);
  });

  return () => unsubscribe();
}, []);


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
        const data = cartDoc.data() as { products: { productId: string; quantity: number }[] };
        const data = cartDoc.data() as { products: { productId: string; quantity: number }[] };
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
            image: prodData.imageUrl,
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const handleToggle = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    setCartItems((prev) => prev.map((item) => ({ ...item, checked: newValue })));
  };

  const handleQtyChange = async (productId: string, type: "inc" | "dec") => {
  const ref = cartCollectionRefForUser();
  if (!ref) return;

  try {
    const snap = await getDocs(ref);
    if (snap.empty) return;

    const cartDoc = snap.docs[0];
    const cartDocRef = cartDoc.ref;
    const cartData = cartDoc.data() as { products: { productId: string; quantity: number }[] };

    const productRef = doc(db, "inventory", productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) return;

    const currentQty = productSnap.data().quantity || 0;

    // --- Enforce inventory limits ---
    if (type === "inc" && currentQty <= 0) {
      Alert.alert("Out of stock", "Cannot add more of this item.");
      return;
    }

    // --- Update cart ---
    const updatedProducts = cartData.products.map((p: any) => {
      if (p.productId === productId) {
        return { ...p, quantity: type === "inc" ? p.quantity + 1 : Math.max(1, p.quantity - 1) };
      }
      return p;
    });

    await updateDoc(cartDocRef, { products: updatedProducts });

    // --- Update inventory safely by 1 ---
    const newInventoryQty = type === "inc" ? currentQty - 1 : currentQty + 1;
    await setDoc(productRef, { quantity: newInventoryQty }, { merge: true });

    // --- Update UI based on the new cart ---
setCartItems((prev) =>
  prev.map((item) =>
    item.id === productId
      ? { ...item, qty: updatedProducts.find(p => p.productId === productId)?.quantity || item.qty }
      : item
  )
);
  } catch (err) {
    console.error("❌ Error updating quantity:", err);
  }
};

 const handleDelete = async (productId: string) => {
  const ref = cartCollectionRefForUser();
  if (!ref) return;

  try {
    const snap = await getDocs(ref);
    if (snap.empty) return;

    const cartDoc = snap.docs[0];
    const cartDocRef = cartDoc.ref;
    const cartData = cartDoc.data() as { products: { productId: string; quantity: number }[] };

    // Find the item to restore
    const removedItem = cartData.products.find((p) => p.productId === productId);
    if (!removedItem) return;

    const productRef = doc(db, "inventory", productId);

    // --- Restore inventory one by one ---
    for (let i = 0; i < removedItem.quantity; i++) {
      const productSnap = await getDoc(productRef);
      const currentQty = productSnap.exists() ? productSnap.data().quantity || 0 : 0;
      await setDoc(productRef, { quantity: currentQty + 1 }, { merge: true });
    }

    // --- Remove from cart ---
    const updatedProducts = cartData.products.filter((p) => p.productId !== productId);
    await setDoc(cartDocRef, { products: updatedProducts }, { merge: true });

    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  } catch (err) {
    console.error("❌ Error deleting item:", err);
  }
};

  const handleBulkDelete = () => {
    Alert.alert(
      "Delete Selected Items",
      "Are you sure you want to delete all selected items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const selectedIds = cartItems.filter((i) => i.checked).map((i) => i.id);
            for (const id of selectedIds) await handleDelete(id);
            setSelectAll(false);
          },
        },
      ]
    );
  };

  const total = useMemo(() => {
    return cartItems
      .filter((item) => item.checked)
      .reduce((sum, item) => sum + item.price * item.qty, 0)
      .toFixed(2);
  }, [cartItems]);

  const checkoutVisible = useSharedValue(cartItems.length > 0 ? 1 : 0);

  useEffect(() => {
    checkoutVisible.value = cartItems.length > 0 ? 1 : 0;
  }, [cartItems]);

  const checkoutStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(checkoutVisible.value ? 0 : 100) }],
    opacity: withTiming(checkoutVisible.value ? 1 : 0),
  }));

  const calculateNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (8 - day) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toDateString();
  };

  const handleCheckout = async () => {
  const selectedItems = cartItems.filter((item) => item.checked);

  if (selectedItems.length === 0) {
    setWarningModalVisible(true);
    return;
  }

  try {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) return;

    // Fetch cart doc
    const ref = cartCollectionRefForUser();
    if (!ref) return;
    const snap = await getDocs(ref);
    if (snap.empty) return;
    const cartDoc = snap.docs[0];
    const cartDocRef = cartDoc.ref;
    const cartData = cartDoc.data() as { products: { productId: string; quantity: number }[] };

    let subtotal = 0;
    const transactionItems: Transaction["items"] = [];

      for (const cartItem of selectedItems) {
        const prodRef = doc(db, "inventory", cartItem.id);
        const prodSnap = await getDoc(prodRef);
        if (!prodSnap.exists()) continue;

        const prodData = prodSnap.data() as InventoryItem;
        const totalItem = coercePrice(prodData.price) * cartItem.qty;
        subtotal += totalItem;

      transactionItems.push({
        itemId: prodRef.id, // Using the document ID
        name: prodData.name,
        priceAtTimeOfSale: coercePrice(prodData.price),
        quantity: cartItem.qty,
      });
    }

      const totalAmount = subtotal;

    // Get user name
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const customerName = userDocSnap.exists()
      ? userDocSnap.data().name || userDocSnap.data().fullName || "Unknown"
      : "Unknown";

    const date = new Date();
    const dueDate = new Date();
    dueDate.setDate(date.getDate() + 7);

    // Add transaction
    await addTransaction({
      amountPaid: totalAmount,
      customerName,
      date,
      dueDate,
      items: transactionItems,
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

    // Remove checked items from cart
      const updatedProducts = cartData.products.filter(
        (p) => !selectedItems.some((sel) => sel.id === p.productId)
      );
      await updateDoc(cartDocRef, { products: updatedProducts });

      // Optimistic UI update
      setCartItems((prev) => prev.filter((item) => !item.checked));
      setSelectAll(false);

      setNextBillingDate(calculateNextMonday());
      setModalVisible(true);
    } catch (err) {
      console.error("❌ Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header with same design as NotificationsScreen */}
        {/* Header with same design as NotificationsScreen */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#222" />
          </Pressable>
          <Text style={styles.title}>My Cart</Text>
        </View>

        {/* Select All */}
        {cartItems.length > 0 && (
          <Pressable style={styles.selectAllButton} onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>{selectAll ? "Deselect All" : "Select All"}</Text>
          </Pressable>
        )}

        {/* Bulk Delete */}
        {cartItems.some((item) => item.checked) && (
          <Pressable style={styles.bulkButton} onPress={handleBulkDelete}>
            <Text style={styles.bulkButtonText}>Delete Selected</Text>
          </Pressable>
        )}

        {/* Select All */}
        {cartItems.length > 0 && (
          <Pressable style={styles.selectAllButton} onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>{selectAll ? "Deselect All" : "Select All"}</Text>
          </Pressable>
        )}

        {/* Bulk Delete */}
        {cartItems.some((item) => item.checked) && (
          <Pressable style={styles.bulkButton} onPress={handleBulkDelete}>
            <Text style={styles.bulkButtonText}>Delete Selected</Text>
          </Pressable>
        )}

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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a6a37"]} />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a6a37"]} />
          }
        />

        {/* Checkout */}
        {/* Checkout */}
        <Animated.View style={[styles.checkoutBar, checkoutStyle]}>
          <Text style={styles.totalText}>
            Total: <Text style={styles.totalPrice}>₱{total}</Text>
          </Text>
          <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.checkoutText}>Checkout</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.checkoutText}>Checkout</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Purchase Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        {/* Purchase Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Thank you for your purchase!</Text>
              <Text style={styles.modalText}>Your next billing will be on:</Text>
              <Text style={styles.modalTitle}>Thank you for your purchase!</Text>
              <Text style={styles.modalText}>Your next billing will be on:</Text>
              <Text style={styles.modalDate}>{nextBillingDate}</Text>
              <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Warning Modal */}
        <Modal visible={warningModalVisible} animationType="fade" transparent onRequestClose={() => setWarningModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>No items selected!</Text>
              <Text style={styles.modalText}>Please select at least one item to checkout.</Text>
              <Pressable style={styles.modalButton} onPress={() => setWarningModalVisible(false)}>
                <Text style={styles.modalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Warning Modal */}
        <Modal visible={warningModalVisible} animationType="fade" transparent onRequestClose={() => setWarningModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>No items selected!</Text>
              <Text style={styles.modalText}>Please select at least one item to checkout.</Text>
              <Pressable style={styles.modalButton} onPress={() => setWarningModalVisible(false)}>
                <Text style={styles.modalButtonText}>OK</Text>
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
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  title: { fontWeight: "700", color: "#222", fontSize: 20, marginLeft: 10 },

  selectAllButton: {
    backgroundColor: "#e6f5eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 17,
    alignSelf: "flex-start",
  },
  selectAllText: { color: "#1a6a37", fontWeight: "700", fontSize: 14 },

  bulkButton: {
    backgroundColor: "#ffe5e5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 17,
    alignSelf: "flex-start",
  },
  bulkButtonText: { color: "#d11a2a", fontWeight: "700", fontSize: 14 },

  header: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  title: { fontWeight: "700", color: "#222", fontSize: 20, marginLeft: 10 },

  selectAllButton: {
    backgroundColor: "#e6f5eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 17,
    alignSelf: "flex-start",
  },
  selectAllText: { color: "#1a6a37", fontWeight: "700", fontSize: 14 },

  bulkButton: {
    backgroundColor: "#ffe5e5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 17,
    alignSelf: "flex-start",
  },
  bulkButtonText: { color: "#d11a2a", fontWeight: "700", fontSize: 14 },

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
  checkoutText: { fontSize: 15, fontWeight: "700", color: "#fff", marginRight: 6 },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 12, fontSize: 18, fontWeight: "600", color: "#888" },

  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { backgroundColor: "#fff", padding: 24, borderRadius: 12, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  modalText: { fontSize: 14, textAlign: "center", marginBottom: 8 },
  modalDate: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  modalButton: { backgroundColor: "#1a6a37", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  checkoutText: { fontSize: 15, fontWeight: "700", color: "#fff", marginRight: 6 },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 12, fontSize: 18, fontWeight: "600", color: "#888" },

  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { backgroundColor: "#fff", padding: 24, borderRadius: 12, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  modalText: { fontSize: 14, textAlign: "center", marginBottom: 8 },
  modalDate: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  modalButton: { backgroundColor: "#1a6a37", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

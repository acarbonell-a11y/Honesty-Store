import { addTransaction, Transaction } from "@/functions/firebaseFunctions";
import { Ionicons } from "@expo/vector-icons";
import CartItemCard from "app/(main)/(users)/(userComponent)/CartItemCard";
import { auth, db } from "config/firebaseConfig";
import { Stack, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

type InventoryItem = { name: string; price: number | string; imageUrl: string; stock?: number };
type CartItem = { id: string; name: string; price: number; image: string; qty: number; checked: boolean };

const coercePrice = (p: number | string): number => (typeof p === "number" ? p : parseFloat(p));

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const purchaseScale = useRef(new Animated.Value(0)).current;
  const warningScale = useRef(new Animated.Value(0)).current;

  const cartCollectionRefForUser = () => {
    const user = auth.currentUser;
    if (!user) return null;
    return collection(db, "users", user.uid, "cart");
  };

  // Fetch cart ONCE
  useEffect(() => {
    const fetchCartOnce = async () => {
      const ref = cartCollectionRefForUser();
      if (!ref) return;

      const snap = await getDocs(ref);
      if (snap.empty) {
        setCartItems([]);
        setSelectAll(false);
        return;
      }

      const resolved: CartItem[] = [];
      for (const cartDoc of snap.docs) {
        const data = cartDoc.data() as { products: { productId: string; quantity: number }[] };
        if (!data.products) continue;

        for (const { productId, quantity } of data.products) {
          const prodSnap = await getDoc(doc(db, "inventory", productId));
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
      setSelectAll(false);
    };

    fetchCartOnce();
  }, []);

  const fetchCart = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    const ref = cartCollectionRefForUser();
    if (!ref) return;
    const snap = await getDocs(ref);
    if (snap.empty) {
      setCartItems([]);
      setSelectAll(false);
      setRefreshing(false);
      return;
    }

    const resolved: CartItem[] = [];
    for (const cartDoc of snap.docs) {
      const data = cartDoc.data() as { products: { productId: string; quantity: number }[] };
      if (!data.products) continue;
      for (const { productId, quantity } of data.products) {
        const prodSnap = await getDoc(doc(db, "inventory", productId));
        if (!prodSnap.exists()) continue;
        const prodData = prodSnap.data() as InventoryItem;
        resolved.push({
          id: productId,
          name: prodData.name,
          price: coercePrice(prodData.price),
          image: prodData.imageUrl,
          qty: quantity,
          checked: cartItems.find((i) => i.id === productId)?.checked || false,
        });
      }
    }

    setCartItems(resolved);
    setSelectAll(resolved.length > 0 && resolved.every((i) => i.checked));
    setRefreshing(false);
  };

  const onRefresh = async () => { await fetchCart(); };

  const handleToggle = (id: string) => {
    setCartItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      setSelectAll(updated.length > 0 && updated.every((i) => i.checked));
      return updated;
    });
  };

  const handleSelectAll = () => {
    setSelectAll((prev) => {
      const newValue = !prev;
      setCartItems((items) => items.map((item) => ({ ...item, checked: newValue })));
      return newValue;
    });
  };

  const handleQtyChange = async (productId: string, type: "inc" | "dec") => {
    const ref = cartCollectionRefForUser();
    if (!ref) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, qty: type === "inc" ? item.qty + 1 : Math.max(1, item.qty - 1) }
          : item
      )
    );

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
      if (type === "inc" && currentQty <= 0) { Alert.alert("Out of stock"); return; }

      const updatedProducts = cartData.products.map((p) => {
        if (p.productId === productId) {
          return { ...p, quantity: type === "inc" ? p.quantity + 1 : Math.max(1, p.quantity - 1) };
        }
        return p;
      });

      await updateDoc(cartDocRef, { products: updatedProducts });
      const newInventoryQty = type === "inc" ? currentQty - 1 : currentQty + 1;
      await setDoc(productRef, { quantity: newInventoryQty }, { merge: true });
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
      const removedItem = cartData.products.find((p) => p.productId === productId);
      if (!removedItem) return;

      const productRef = doc(db, "inventory", productId);
      const productSnap = await getDoc(productRef);
      const currentQty = productSnap.exists() ? productSnap.data().quantity || 0 : 0;
      await setDoc(productRef, { quantity: currentQty + removedItem.quantity }, { merge: true });

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
          },
        },
      ]
    );
  };

  const total = cartItems.filter((i) => i.checked).reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);

  const calculateNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (8 - day) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toDateString();
  };

  const openPurchaseModal = () => {
    setModalVisible(true);
    purchaseScale.setValue(0);
    Animated.spring(purchaseScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const closePurchaseModal = () => {
    Animated.timing(purchaseScale, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => setModalVisible(false));
  };

  const openWarningModal = () => {
    setWarningModalVisible(true);
    warningScale.setValue(0);
    Animated.spring(warningScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const closeWarningModal = () => {
    Animated.timing(warningScale, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => setWarningModalVisible(false));
  };

  const handleCheckoutWithAnimation = async () => {
    const selectedItems = cartItems.filter((item) => item.checked);
    if (selectedItems.length === 0) { openWarningModal(); return; }
    await handleCheckout();
    openPurchaseModal();
  };

  const handleCheckout = async () => {
    const selectedItems = cartItems.filter((item) => item.checked);
    if (selectedItems.length === 0) return;
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

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
        subtotal += coercePrice(prodData.price) * cartItem.qty;

        transactionItems.push({ itemId: prodRef.id, name: prodData.name, priceAtTimeOfSale: coercePrice(prodData.price), quantity: cartItem.qty });
      }

      const totalAmount = subtotal;
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const customerName = userDocSnap.exists() ? userDocSnap.data().name || "Unknown" : "Unknown";

      await addTransaction({
        amountPaid: totalAmount,
        customerName,
        date: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        items: transactionItems,
        notes: "",
        paymentMethod: "Cash",
        paymentStatus: "Pending",
        receiptNumber: Math.floor(1000 + Math.random() * 9000).toString(),
        subtotal,
        tax: 0,
        total: totalAmount,
        userId: user.uid,
        userRef: userDocRef,
      });

      const updatedProducts = cartData.products.filter((p) => !selectedItems.some((sel) => sel.id === p.productId));
      await updateDoc(cartDocRef, { products: updatedProducts });

      setCartItems((prev) => prev.filter((item) => !item.checked));
      setSelectAll(false);
      setNextBillingDate(calculateNextMonday());
    } catch (err) { console.error("❌ Checkout error:", err); }
    finally { setLoading(false); }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#222" />
          </Pressable>
          <Text style={styles.title}>My Cart</Text>
        </View>

        {/* Select All / Delete */}
        {cartItems.length > 0 && (
          <View style={styles.selectionContainer}>
            <Pressable style={styles.selectButton} onPress={handleSelectAll}>
              <Ionicons name={selectAll ? "checkbox-outline" : "square-outline"} size={20} color="#1a6a37" />
              <Text style={styles.selectButtonText}>{selectAll ? "Deselect All" : "Select All"}</Text>
            </Pressable>

            {cartItems.some((item) => item.checked) && (
              <Pressable style={styles.deleteButton} onPress={handleBulkDelete}>
                <Ionicons name="trash-outline" size={20} color="#a10000" />
                <Text style={styles.deleteButtonText}>Delete Selected</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Cart Items */}
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CartItemCard id={item.id} name={item.name} price={item.price.toString()} image={item.image} qty={item.qty} checked={item.checked} onQtyChange={handleQtyChange} onToggle={handleToggle} onDelete={handleDelete} />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Your cart is empty</Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />

        {/* Checkout bar */}
        {cartItems.length > 0 && (
          <View style={styles.checkoutBar}>
            <Text style={styles.totalText}>Total: ₱{total}</Text>
            <Pressable
              style={styles.checkoutButton}
              onPress={handleCheckoutWithAnimation}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.checkoutContent}>
                  <Text style={styles.checkoutText}>Purchase</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Modals */}
        <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closePurchaseModal}>
          <View style={styles.modalBackground}>
            <Animated.View style={[styles.modalContainer, { transform: [{ scale: purchaseScale }] }]}>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalTitle}>Purchase Success!</Text>
                <Text style={styles.modalSubtitle}>Next billing date: {nextBillingDate}</Text>
                <Pressable onPress={closePurchaseModal} style={styles.textButton}>
                  <Text style={styles.textButtonText}>Close</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        <Modal transparent visible={warningModalVisible} animationType="fade" onRequestClose={closeWarningModal}>
          <View style={styles.modalBackground}>
            <Animated.View style={[styles.modalContainer, { transform: [{ scale: warningScale }] }]}>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalTitle}>No Item Selected</Text>
                <Text style={styles.modalSubtitle}>Please select items to purchase.</Text>
                <Pressable onPress={closeWarningModal} style={styles.textButton}>
                  <Text style={styles.textButtonText}>Close</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginLeft: 12, color: "#000" },
  selectionContainer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
  selectButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  selectButtonText: { fontSize: 14, color: "#1a6a37" },
  deleteButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  deleteButtonText: { fontSize: 14, color: "#a10000" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12 },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#1a6a37",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40
  },
  totalText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27a745",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkoutContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkoutText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalContent: { alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#555", marginBottom: 16, textAlign: "center" },
  textButton: { marginTop: 8 },
  textButtonText: { color: "#1a6a37", fontWeight: "bold" },
});

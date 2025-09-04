import { Ionicons } from "@expo/vector-icons";
import ProductCard from "app/(main)/(users)/(userComponent)/ProductCard";
import SearchBar from "app/(main)/(users)/(userComponent)/SearchBar";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { db } from "config/firebaseConfig";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: string;
  image?: string;
  category: string;
  quantity?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const screenWidth = Dimensions.get("window").width;
const horizontalPadding = 34;
const columnGap = 15;
const numColumns = 2;
const cardWidth = (screenWidth - horizontalPadding - columnGap) / numColumns;

const Homepage = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingProducts, setRefreshingProducts] = useState(false);

  const [notificationCount, setNotificationCount] = useState(3);
  const [cartCount, setCartCount] = useState(2);

  const router = useRouter();
  const scaleLeft = useRef(new Animated.Value(1)).current;
  const scaleRight = useRef(new Animated.Value(1)).current;

  // ✅ Real-time products subscription
  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name,
        price: docSnap.data().price?.toString() || "0",
        image: docSnap.data().imageUrl || undefined,
        category: docSnap.data().category || "",
        quantity: docSnap.data().quantity || 0,
      }));

      setProducts(items);
      setLoading(false);
      setRefreshingProducts(false);
    });

    return () => unsubscribe();
  }, []);

  const onRefreshProducts = async () => {
    setRefreshingProducts(true);
    // Since we're using onSnapshot, refreshing only triggers the spinner
    setTimeout(() => setRefreshingProducts(false), 500);
  };

  // ✅ Add to Cart with stock check
  const addToCart = async (productId: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const productRef = doc(db, "inventory", productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        Alert.alert("Error", "Product not found.");
        return;
      }

      const productData = productSnap.data();
      if (!productData.quantity || productData.quantity <= 0) {
        Alert.alert("Out of Stock", "This product is currently unavailable.");
        return;
      }

      const cartRef = collection(db, "users", user.uid, "cart");
      const cartSnap = await getDocs(cartRef);

      let cartDocRef;
      if (cartSnap.empty) {
        const newDoc = await addDoc(cartRef, { products: [] });
        cartDocRef = newDoc;
      } else {
        cartDocRef = cartSnap.docs[0].ref;
      }

      const cartDoc = cartSnap.empty ? null : cartSnap.docs[0];
      const currentProducts: { productId: string; quantity: number }[] = cartDoc
        ? cartDoc.data().products || []
        : [];

      const existingIndex = currentProducts.findIndex((p) => p.productId === productId);
      if (existingIndex !== -1) {
        currentProducts[existingIndex].quantity += 1;
      } else {
        currentProducts.push({ productId, quantity: 1 });
      }

      await updateDoc(cartDocRef, { products: currentProducts });
      setCartCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // ✅ Case-insensitive category + search filter
  const filteredProducts = products.filter(
    (p) =>
      (!selectedCategory ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase()) &&
      p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const categories: Category[] = [
    { id: "1", name: "Snacks", icon: "pizza-outline" },
    { id: "2", name: "Beverages", icon: "cafe-outline" },
    { id: "3", name: "Foods", icon: "fast-food-outline" },
    { id: "4", name: "Fruits", icon: "nutrition-outline" },
    { id: "5", name: "Others", icon: "ice-cream-outline" },
  ];

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const renderIcon = (
    iconName: React.ComponentProps<typeof Ionicons>["name"],
    badgeCount: number,
    scale: Animated.Value,
    onPress?: () => void
  ) => (
    <Pressable
      onPress={onPress}
      onPressIn={() => handlePressIn(scale)}
      onPressOut={() => handlePressOut(scale)}
      style={styles.iconWrapper}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={iconName} size={28} color="#000" />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a6a37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shopnesty</Text>
        <View style={styles.iconContainer}>
          {renderIcon("notifications-outline", notificationCount, scaleLeft, () =>
            router.push("/(main)/(users)/(userHidComps)/NotifacationScreen")
          )}
          {renderIcon("cart-outline", cartCount, scaleRight, () =>
            router.push("/(main)/(users)/(userHidComps)/CartScreen")
          )}
        </View>
      </View>

      {/* Search */}
      <SearchBar value={searchText} onChangeText={setSearchText} />

      {/* Categories */}
      <View style={{ marginBottom: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedCategory(item.name)}
              style={{ marginRight: 25, alignItems: "center" }}
            >
              <Ionicons name={item.icon as any} size={28} color="#1a6a37" />
              <Text style={{ marginTop: 5, fontWeight: "600", color: "#333" }}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Products Grid */}
      <View style={{ flex: 1 }}>
        {selectedCategory && (
          <Pressable
            onPress={() => setSelectedCategory(null)}
            style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="chevron-back" size={28} color="#1a6a37" />
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#1a6a37",
                marginLeft: 5,
              }}
            >
              {selectedCategory}
            </Text>
          </Pressable>
        )}

        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#1a6a37",
            marginBottom: 10,
          }}
        >
          {selectedCategory ? `${selectedCategory} Products` : "All Products"}
        </Text>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 15 }}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <ProductCard
                title={item.name}
                description={`This is ${item.name}`}
                price={item.price}
                stock={item.quantity}
                category={item.category}
                image={item.image}
                onAddToCart={() => addToCart(item.id)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshingProducts}
              onRefresh={onRefreshProducts}
              colors={["#1a6a37"]}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 17, paddingTop: 45 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  title: { fontWeight: "800", color: "#000", fontSize: 30 },
  iconContainer: { flexDirection: "row", alignItems: "center" },
  iconWrapper: { marginLeft: 15 },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#1a6a37",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});

export default Homepage;

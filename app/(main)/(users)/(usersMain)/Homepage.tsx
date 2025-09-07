import { Ionicons } from "@expo/vector-icons";
import ProductCard from "app/(main)/(users)/(userComponent)/ProductCard";
import SearchBar from "app/(main)/(users)/(userComponent)/SearchBar";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
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
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  const [categoryVisible, setCategoryVisible] = useState(true);

  const router = useRouter();
  const scaleLeft = useRef(new Animated.Value(1)).current;
  const scaleRight = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList<Product>>(null);

  const user = getAuth().currentUser;
  const userId = user?.uid;

  const categoryAnim = useRef(new Animated.Value(1)).current;
  const productAnim = useRef(new Animated.Value(1)).current;

  const hideCategory = () => {
    Animated.timing(categoryAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => setCategoryVisible(false));
  };

  const showCategory = () => {
    setCategoryVisible(true);
    Animated.timing(categoryAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const animateProducts = () => {
    productAnim.setValue(0);
    Animated.timing(productAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // Fetch products live
  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name,
        price: docSnap.data().price.toString(),
        image: docSnap.data().imageUrl || undefined,
        category: docSnap.data().category,
        quantity: docSnap.data().quantity,
      }));
      setProducts(items);
      setLoading(false);
      setRefreshingProducts(false);
      animateProducts();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    animateProducts();
  }, [selectedCategory]);

  // Live cart count for the "main" document only
  useEffect(() => {
    if (!userId) return;
    const cartDocRef = doc(db, "users", userId, "cart", "main");
    const unsubscribe = onSnapshot(cartDocRef, (docSnap) => {
      if (!docSnap.exists()) {
        setCartCount(0);
        return;
      }
      const data = docSnap.data();
      const totalItems = Array.isArray(data.products)
        ? data.products.reduce((sum: number, p: any) => sum + p.quantity, 0)
        : 0;
      setCartCount(totalItems);
    });
    return () => unsubscribe();
  }, [userId]);

  // Live notifications count
  useEffect(() => {
    if (!userId) return;
    const notifRef = collection(db, "notifications");
    const unsubscribe = onSnapshot(
      query(notifRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        let count = 0;
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const readBy: string[] = data.readBy || [];
          if (!readBy.includes(userId)) count += 1;
        });
        setNotificationCount(count);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  const onRefreshProducts = () => {
    setRefreshingProducts(true);
    setTimeout(() => setRefreshingProducts(false), 500);
  };

  // Add to Cart Function
  const addToCart = async (productId: string) => {
    if (!userId) return;

    try {
      const productRef = doc(db, "inventory", productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) return;

      const productData = productSnap.data();
      if (!productData.quantity || productData.quantity <= 0) return;

      const cartDocRef = doc(db, "users", userId, "cart", "main");
      const cartSnap = await getDoc(cartDocRef);

      let currentProducts: { productId: string; quantity: number }[] = [];
      if (cartSnap.exists()) {
        currentProducts = cartSnap.data().products || [];
        const existingIndex = currentProducts.findIndex((p) => p.productId === productId);
        if (existingIndex !== -1) {
          currentProducts[existingIndex].quantity += 1;
        } else {
          currentProducts.push({ productId, quantity: 1 });
        }
      } else {
        currentProducts.push({ productId, quantity: 1 });
      }

      await setDoc(cartDocRef, { products: currentProducts }, { merge: true });

      // Reduce inventory
      await setDoc(
        productRef,
        { quantity: productData.quantity - 1 },
        { merge: true }
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.quantity &&
      p.quantity > 0 &&
      (!selectedCategory || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const categories: Category[] = [
    { id: "1", name: "Snacks", icon: "pizza-outline" },
    { id: "2", name: "Beverages", icon: "cafe-outline" },
    { id: "3", name: "Foods", icon: "fast-food-outline" },
    { id: "4", name: "Fruits", icon: "nutrition-outline" },
    { id: "5", name: "Others", icon: "layers-outline" },
  ];

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
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
        <Ionicons name={iconName} size={28} color="#fff" />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );

  useFocusEffect(
    React.useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1a6a37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a6a37" />

      {/* Header & Categories */}
      <Animated.View style={styles.headerBackground}>
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

        <SearchBar value={searchText} onChangeText={setSearchText} />

        <Animated.View
          style={{
            opacity: categoryAnim,
            height: categoryAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 70] }),
          }}
        >
          {categoryVisible && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedCategory(item.name);
                    hideCategory();
                  }}
                  style={styles.categoryItem}
                >
                  <Ionicons name={item.icon as any} size={26} color="#fff" />
                  <Text style={styles.categoryText}>{item.name}</Text>
                </Pressable>
              )}
            />
          )}
        </Animated.View>
      </Animated.View>

      {/* Product Grid */}
      <Animated.View
        style={{
          flex: 1,
          opacity: productAnim,
          transform: [
            {
              translateY: productAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
            },
          ],
          paddingHorizontal: 17,
          marginTop: 10,
        }}
      >
        {selectedCategory && (
          <Pressable
            onPress={() => {
              setSelectedCategory(null);
              showCategory();
            }}
            style={styles.backCategory}
          >
            <Ionicons name="chevron-back" size={28} color="#1a6a37" />
            <Text style={styles.backCategoryText}>{selectedCategory}</Text>
          </Pressable>
        )}

        {!selectedCategory && <Text style={styles.allProducts}>All Products</Text>}

        <FlatList
          ref={flatListRef}
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
                onAddToCart={async () => await addToCart(item.id)}
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBackground: {
    backgroundColor: "#1a6a37",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 17,
    paddingTop: 45,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  title: { fontWeight: "800", fontSize: 30, color: "#fff" },
  iconContainer: { flexDirection: "row", alignItems: "center" },
  iconWrapper: { marginLeft: 15 },
  badge: { position: "absolute", top: -6, right: -10, backgroundColor: "#fff", minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
  badgeText: { color: "#1a6a37", fontSize: 10, fontWeight: "bold" },
  categoryItem: { marginRight: 25, alignItems: "center" },
  categoryText: { marginTop: 5, fontWeight: "600", color: "#fff" },
  backCategory: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backCategoryText: { fontSize: 22, fontWeight: "bold", color: "#1a6a37", marginLeft: 5 },
  allProducts: { fontSize: 22, fontWeight: "bold", color: "#1a6a37", marginBottom: 10 },
});

export default Homepage;

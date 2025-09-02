// app/screens/Inventory.tsx
import { createProductNotification } from "@/functions/notificationFunctions";
import Avatar from "app/(main)/(adminVIEW)/(components)/Avatar";
import ProductItem from "app/(main)/(adminVIEW)/(components)/ProductItem";
import ProductModal from "app/(main)/(adminVIEW)/(components)/ProductModal";
import SearchBar from "app/(main)/(adminVIEW)/(components)/SearchBar";
import { db } from "config/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  addInventoryItem,
  InventoryItem,
  updateInventoryItem,
} from "functions/firebaseFunctions";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ms, s, vs } from "react-native-size-matters";

// ---------- Types ----------
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number; // mapped from Firestore "quantity"
  status: "In stock" | "Low stock" | "Out of stock";
  category?: string;
  lowStockThreshold?: number;
  lastUpdated?: Timestamp;
  createdAt?: Timestamp;
}

// ---------- Config ----------
const LOW_STOCK_FALLBACK = 15;

// ---------- Helpers ----------
const computeStatus = (
  stock: number,
  lowStockThreshold?: number
): Product["status"] => {
  if (stock <= 0) return "Out of stock";
  const threshold = lowStockThreshold ?? LOW_STOCK_FALLBACK;
  return stock <= threshold ? "Low stock" : "In stock";
};

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");

  const flatListRef = useRef<FlatList<Product>>(null);
  const inventoryRef = collection(db, "inventory");

  // ---------- Realtime listener ----------
  useEffect(() => {
    const unsubscribe = onSnapshot(
      inventoryRef,
      (snapshot) => {
        const items: Product[] = snapshot.docs.map((d) => {
  const data = d.data() as any;
  const stock = typeof data.quantity === "number" ? data.quantity : 0;

  return {
    id: d.id,
    name: data.name ?? "Untitled",
    price: typeof data.price === "number" ? data.price : 0,
    stock,
    category: data.category ?? undefined,
    status: (data.status as Product["status"]) ?? computeStatus(stock, data.lowStockThreshold),
    imageUrl: data.imageUrl ?? undefined, // ✅ read from Firestore
    lastUpdated: data.lastUpdated as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
  };
});


        setProducts(items);
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot(inventory) error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ---------- Add / Update ----------
  const saveProduct = async (
    productData: Omit<Product, "id" | "status" | "lastUpdated" | "createdAt">
  ) => {
    try {
      const { name, price, stock, category, lowStockThreshold } = productData;
      const nextStatus = computeStatus(stock, lowStockThreshold);

      if (editingProduct) {
        // Build the update object safely
        const updatedFields: Partial<InventoryItem> & { status?: string } = {
          name,
          price,
          quantity: stock,
          status: nextStatus,
          lastUpdated: serverTimestamp(),
        };

        if (category !== undefined && category !== null)
          updatedFields.category = category;
        if (lowStockThreshold !== undefined && lowStockThreshold !== null)
          updatedFields.lowStockThreshold = lowStockThreshold;

        await updateInventoryItem(editingProduct.id, updatedFields);
      } else {
        await addInventoryItem({
          name,
          description: "",
          price,
          quantity: stock,
          sku: "",
          lowStockThreshold: lowStockThreshold ?? LOW_STOCK_FALLBACK,
          supplier: { name: "", contact: "" },
          status: nextStatus,
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      closeModal();
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Error", "Could not save the product. Please try again.");
    }
  };

 // ---------- Delete ----------
const deleteProduct = async (id: string) => {
  try {
    const ref = doc(db, "inventory", id);

    // 1️⃣ Fetch the product data before deleting
    const snapshot = await getDoc(ref);
    const productData = snapshot.data();

    if (!productData) {
      console.warn("Product not found for deletion");
      return;
    }

    // 2️⃣ Delete the document
    await deleteDoc(ref);

    // 3️⃣ Create a notification
    await createProductNotification(
      ref.id, // productId
      "Product Deleted", // title
      `The product "${productData.name}" has been removed from the inventory.` // message
    );

    console.log(`Product "${productData.name}" deleted successfully.`);
  } catch (error) {
    console.error("Error deleting product:", error);
    Alert.alert("Error", "Could not delete the product. Please try again.");
  }
};

// ---------- Confirm Delete ----------
const confirmDelete = (id: string) => {
  Alert.alert(
    "Delete Product",
    "Are you sure you want to delete this product?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteProduct(id) },
    ]
  );
};


  // ---------- Modal controls ----------
  const openAddModal = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
    Keyboard.dismiss();
  };

  // ---------- Filter & Sort ----------
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.category &&
          p.category.toLowerCase().includes(searchText.toLowerCase()))
    );

    switch (sortBy) {
      case "name":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "stock":
        return filtered.sort((a, b) => b.stock - a.stock);
      case "price":
        return filtered.sort((a, b) => b.price - a.price);
      default:
        return filtered;
    }
  }, [products, searchText, sortBy]);

  // ---------- Stats ----------
  const inventoryStats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.status === "In stock").length;
    const lowStock = products.filter((p) => p.status === "Low stock").length;
    const outOfStock = products.filter((p) => p.status === "Out of stock")
      .length;
    return { total, inStock, lowStock, outOfStock };
  }, [products]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductItem
        product={item}
        onEdit={openEditModal}
        onDelete={confirmDelete} 
        onMore={function (id: string): void {
          throw new Error("Function not implemented.");
        } }      />
    ),
    []
  );

  // ---------- List Header ----------
  const ListHeaderComponent = useMemo(
    () => (
      <>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubTitle}>Shopnesty</Text>
            <Text style={styles.headerTitle}>Inventory</Text>
          </View>
          <Avatar />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{inventoryStats.total}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={[styles.statCard, styles.lowStockCard]}>
            <Text style={styles.statNumber}>{inventoryStats.lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={[styles.statCard, styles.outOfStockCard]}>
            <Text style={styles.statNumber}>{inventoryStats.outOfStock}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>

        <SearchBar
          placeholder="Search products or categories..."
          onSearch={setSearchText}
        />

        <View style={styles.sortContainer}>
          {(["name", "stock", "price"] as const).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.sortButton,
                sortBy === key && styles.activeSortButton,
              ]}
              onPress={() => setSortBy(key)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === key && styles.activeSortText,
                ]}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addText}>+ Add New Product</Text>
        </TouchableOpacity>

        <View style={{ height: vs(20) }} />
      </>
    ),
    [inventoryStats, sortBy]
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" />
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredAndSortedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <ProductModal
        visible={modalVisible}
        product={editingProduct}
        onSave={saveProduct}
        onClose={closeModal}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(20),
    marginBottom: vs(16),
    paddingHorizontal: s(16),
  },
  headerSubTitle: { fontSize: s(18), fontWeight: "600", color: "#6c757d" },
  headerTitle: {
    fontSize: s(32),
    fontWeight: "800",
    color: "#1a6a37",
    letterSpacing: -0.5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: s(16),
    marginBottom: vs(16),
    gap: s(12),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: s(16),
    borderRadius: ms(12),
    alignItems: "center",
    elevation: 2,
  },
  lowStockCard: {
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  outOfStockCard: {
    backgroundColor: "#f8d7da",
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  statNumber: {
    fontSize: ms(24),
    fontWeight: "800",
    color: "#1a6a37",
    marginBottom: vs(4),
  },
  statLabel: {
    fontSize: ms(12),
    color: "#6c757d",
    fontWeight: "600",
    textAlign: "center",
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: vs(8),
  },
  sortButton: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: ms(16),
    marginHorizontal: s(4),
  },
  activeSortButton: { backgroundColor: "#1a6a37", borderColor: "#1a6a37" },
  sortButtonText: { fontSize: ms(12), color: "#6c757d", fontWeight: "600" },
  activeSortText: { color: "#fff" },
  addButton: {
    marginHorizontal: s(16),
    backgroundColor: "#1a6a37",
    paddingVertical: vs(14),
    borderRadius: ms(12),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  addText: { color: "#fff", fontWeight: "700", fontSize: ms(16) },
  list: { paddingHorizontal: s(12), paddingBottom: vs(50) },
});

export default Inventory;

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ms, s, vs } from "react-native-size-matters";
import Avatar from "../(components)/Avatar";
import ProductItem from "../(components)/ProductItem";
import ProductModal from "../(components)/ProductModal";
import SearchBar from "../(components)/SearchBar";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: "In stock" | "Low stock" | "Out of stock";
  category?: string;
  lastUpdated?: Date;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "Premium Coffee Beans", price: 12.99, stock: 50, status: "In stock", category: "Beverages", lastUpdated: new Date() },
  { id: "2", name: "Organic Green Tea", price: 8.50, stock: 8, status: "Low stock", category: "Beverages", lastUpdated: new Date() },
  { id: "3", name: "Artisan Pastries", price: 4.25, stock: 0, status: "Out of stock", category: "Food", lastUpdated: new Date() },
  { id: "4", name: "Specialty Milk", price: 3.75, stock: 25, status: "In stock", category: "Dairy", lastUpdated: new Date() },
];

const LOW_STOCK_THRESHOLD = 15;
const OUT_OF_STOCK_THRESHOLD = 0;

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');

  const flatListRef = useRef<FlatList<Product>>(null);

  // Reset scroll when screen is focused
  useFocusEffect(
    useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [])
  );

  const getProductStatus = useCallback((stock: number): Product['status'] => {
    if (stock <= OUT_OF_STOCK_THRESHOLD) return "Out of stock";
    if (stock <= LOW_STOCK_THRESHOLD) return "Low stock";
    return "In stock";
  }, []);

  const deleteProduct = useCallback((id: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => setProducts(prev => prev.filter(p => p.id !== id)) },
      ]
    );
  }, []);

  const editProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
  }, []);

  const openAddModal = useCallback(() => {
    setEditingProduct(null);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingProduct(null);
    Keyboard.dismiss();
  }, []);

  const saveProduct = useCallback((productData: Omit<Product, 'id' | 'status' | 'lastUpdated'>) => {
    const { name, price, stock, category } = productData;
    
    if (!name.trim()) { Alert.alert("Validation Error", "Product name is required"); return; }
    if (price <= 0) { Alert.alert("Validation Error", "Price must be greater than 0"); return; }
    if (stock < 0) { Alert.alert("Validation Error", "Stock cannot be negative"); return; }

    const status = getProductStatus(stock);
    const now = new Date();

    if (editingProduct) {
      setProducts(prev =>
        prev.map(p => p.id === editingProduct.id
          ? { ...p, name: name.trim(), price, stock, status, category, lastUpdated: now }
          : p
        )
      );
    } else {
      const newProduct: Product = { id: Date.now().toString(), name: name.trim(), price, stock, status, category, lastUpdated: now };
      setProducts(prev => [...prev, newProduct]);
    }

    closeModal();
  }, [editingProduct, getProductStatus, closeModal]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchText.toLowerCase()))
    );
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'stock': return b.stock - a.stock;
        case 'price': return b.price - a.price;
        default: return 0;
      }
    });
  }, [products, searchText, sortBy]);

  const inventoryStats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.status === "In stock").length;
    const lowStock = products.filter(p => p.status === "Low stock").length;
    const outOfStock = products.filter(p => p.status === "Out of stock").length;
    return { total, inStock, lowStock, outOfStock };
  }, [products]);

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductItem product={item} onEdit={editProduct} onDelete={deleteProduct} />
  ), [editProduct, deleteProduct]);

  const ListHeaderComponent = useMemo(() => (
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

      <SearchBar placeholder="Search products or categories..." onSearch={setSearchText} />

      <View style={styles.actionRow}>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {['name','stock','price'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.sortButton, sortBy === key && styles.activeSortButton]}
              onPress={() => setSortBy(key as 'name' | 'stock' | 'price')}
            >
              <Text style={[styles.sortButtonText, sortBy === key && styles.activeSortText]}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addText}>Add New Product</Text>
      </TouchableOpacity>

      <View style={styles.listHeaderSpacer} />
    </>
  ), [inventoryStats, sortBy, openAddModal]);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchText ? "Try adjusting your search" : "Add your first product to get started"}
      </Text>
    </View>
  ), [searchText]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <GestureHandlerRootView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={filteredAndSortedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <ProductModal
          visible={modalVisible}
          product={editingProduct}
          onSave={saveProduct}
          onClose={closeModal}
        />
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  listContent: { paddingHorizontal: s(16), paddingVertical: vs(20), paddingBottom: vs(100) },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(20), marginTop: vs(20) },
  headerSubTitle: { fontSize: s(18), fontWeight: "600", color: "#6c757d", letterSpacing: 0.5 },
  headerTitle: { fontSize: s(32), fontWeight: "800", color: "#1a6a37", letterSpacing: -0.5 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: vs(20), gap: s(12) },
  statCard: { flex: 1, backgroundColor: "#fff", padding: s(16), borderRadius: ms(12), alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  lowStockCard: { backgroundColor: "#fff3cd", borderLeftWidth: 4, borderLeftColor: "#ffc107" },
  outOfStockCard: { backgroundColor: "#f8d7da", borderLeftWidth: 4, borderLeftColor: "#dc3545" },
  statNumber: { fontSize: ms(24), fontWeight: "800", color: "#1a6a37", marginBottom: vs(4) },
  statLabel: { fontSize: ms(12), color: "#6c757d", fontWeight: "600", textAlign: "center" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(16) },
  sortContainer: { marginTop: 20, flexDirection: "row", alignItems: "center", flex: 1 },
  sortLabel: { fontSize: ms(14), color: "#6c757d", fontWeight: "600", marginRight: s(8) },
  sortButton: { paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: ms(16), backgroundColor: "#e9ecef", marginRight: s(8) },
  activeSortButton: { backgroundColor: "#1a6a37" },
  sortButtonText: { fontSize: ms(12), color: "#6c757d", fontWeight: "600" },
  activeSortText: { color: "#fff" },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a6a37", paddingVertical: vs(14), paddingHorizontal: s(20), borderRadius: ms(12), justifyContent: "center", elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  addText: { color: "#fff", fontWeight: "700", fontSize: ms(16), marginLeft: s(8) },
  listHeaderSpacer: { height: vs(20) },
  emptyContainer: { alignItems: "center", paddingVertical: vs(60) },
  emptyTitle: { fontSize: ms(20), fontWeight: "600", color: "#6c757d", marginTop: vs(16), marginBottom: vs(8) },
  emptySubtitle: { fontSize: ms(14), color: "#adb5bd", textAlign: "center", lineHeight: ms(20) },
});

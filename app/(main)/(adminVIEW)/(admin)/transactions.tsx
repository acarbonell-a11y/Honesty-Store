import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { db } from "config/firebaseConfig";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ms, s, vs } from "react-native-size-matters";

import Avatar from "../(components)/Avatar";
import PaymentModal from "../(components)/PaymentModal";
import ReceiptModal from "../(components)/ReceiptModal";
import TransactionItem from "../(components)/TransactionItem";

export interface TransactionItemType {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  date: Date;
  customerName?: string;
  items: TransactionItemType[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: "Paid" | "Partially Paid" | "Unpaid";
  amountPaid: number;
  paymentMethod?: "Cash" | "Card" | "Digital Wallet";
  notes?: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Paid" | "Partially Paid" | "Unpaid">("All");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const flatListRef = useRef<FlatList<Transaction>>(null);

  // Fetch transactions in real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Transaction[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          receiptNumber: d.receiptNumber,
          date: d.date?.toDate ? d.date.toDate() : new Date(),
          customerName: d.customerName,
          items: d.items || [],
          subtotal: d.subtotal || 0,
          tax: d.tax || 0,
          total: d.total || 0,
          paymentStatus: d.paymentStatus,
          amountPaid: d.amountPaid || 0,
          paymentMethod: d.paymentMethod,
          notes: d.notes,
        };
      });
      setTransactions(data);
    }, error => console.error("Error fetching transactions:", error));

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [])
  );

  const updatePaymentStatus = useCallback(async (
    transactionId: string,
    newStatus: Transaction['paymentStatus'],
    amountPaid: number,
    paymentMethod?: Transaction['paymentMethod']
  ) => {
    try {
      const transactionRef = doc(db, "transactions", transactionId);
      await updateDoc(transactionRef, { paymentStatus: newStatus, amountPaid, paymentMethod: paymentMethod || null });
    } catch (error) {
      console.error("Error updating transaction:", error);
      Alert.alert("Error", "Could not update payment status. Make sure you are admin.");
    }
  }, []);

  const viewReceipt = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptModalVisible(true);
  }, []);

  const openPaymentModal = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setPaymentModalVisible(true);
  }, []);

  const closeModals = useCallback(() => {
    setReceiptModalVisible(false);
    setPaymentModalVisible(false);
    setSelectedTransaction(null);
  }, []);

  const downloadReceipt = useCallback((transaction: Transaction) => {
    Alert.alert("Download Receipt", `Receipt ${transaction.receiptNumber} download functionality goes here.`);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(transaction => {
        const matchesSearch =
          transaction.receiptNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          (transaction.customerName?.toLowerCase().includes(searchText.toLowerCase())) ||
          transaction.items.some(item => item.name.toLowerCase().includes(searchText.toLowerCase()));
        const matchesFilter = filterStatus === "All" || transaction.paymentStatus === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, searchText, filterStatus]);

  const transactionStats = useMemo(() => {
    const total = transactions.length;
    const paid = transactions.filter(t => t.paymentStatus === "Paid").length;
    const partiallyPaid = transactions.filter(t => t.paymentStatus === "Partially Paid").length;
    const unpaid = transactions.filter(t => t.paymentStatus === "Unpaid").length;
    const totalRevenue = transactions.filter(t => t.paymentStatus === "Paid").reduce((sum, t) => sum + t.total, 0);
    const pendingAmount = transactions.filter(t => t.paymentStatus !== "Paid").reduce((sum, t) => sum + (t.total - t.amountPaid), 0);
    return { total, paid, partiallyPaid, unpaid, totalRevenue, pendingAmount };
  }, [transactions]);

  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <TransactionItem
      transaction={item}
      onViewReceipt={viewReceipt}
      onUpdatePayment={openPaymentModal}
      onDownload={downloadReceipt}
    />
  ), [viewReceipt, openPaymentModal, downloadReceipt]);

  // Full header with stats, search, filters
  const ListHeaderComponent = useMemo(() => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubTitle}>Shopnesty</Text>
          <Text style={styles.headerTitle}>Transactions</Text>
        </View>
        <Avatar />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{transactionStats.total}</Text>
          <Text style={styles.statLabel}>Total Receipts</Text>
        </View>
        <View style={[styles.statCard, styles.revenueCard]}>
          <Text style={styles.statNumber}>₱{transactionStats.totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statNumber}>₱{transactionStats.pendingAmount.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Pending Amount</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search receipts, customers, or items..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by status:</Text>
        <View style={styles.filterButtons}>
          {(["All", "Paid", "Partially Paid", "Unpaid"] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, filterStatus === status && styles.activeFilterButton]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterButtonText, filterStatus === status && styles.activeFilterText]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listHeaderSpacer} />
    </>
  ), [transactionStats, searchText, filterStatus]);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Transactions Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchText || filterStatus !== "All" ? "Try adjusting your search or filters" : "Transactions will appear here once you start making sales"}
      </Text>
    </View>
  ), [searchText, filterStatus]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
        />

        {selectedTransaction && (
          <>
            <ReceiptModal
              visible={receiptModalVisible}
              transaction={selectedTransaction}
              onClose={closeModals}
              onDownload={downloadReceipt}
            />

            <PaymentModal
              visible={paymentModalVisible}
              transaction={selectedTransaction}
              onClose={closeModals}
              onUpdatePayment={updatePaymentStatus}
            />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  listContent: { paddingHorizontal: s(16), paddingVertical: vs(20), paddingBottom: vs(100) },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(20), marginTop: vs(20) },
  headerSubTitle: { fontSize: s(18), fontWeight: "600", color: "#6c757d", letterSpacing: 0.5 },
  headerTitle: { fontSize: s(32), fontWeight: "800", color: "#1a6a37", letterSpacing: -0.5 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: vs(20), gap: s(8) },
  statCard: { flex: 1, backgroundColor: "#fff", padding: s(12), borderRadius: ms(12), alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  revenueCard: { backgroundColor: "#d4edda", borderLeftWidth: 4, borderLeftColor: "#28a745" },
  pendingCard: { backgroundColor: "#fff3cd", borderLeftWidth: 4, borderLeftColor: "#ffc107" },
  statNumber: { fontSize: ms(18), fontWeight: "800", color: "#1a6a37", marginBottom: vs(4) },
  statLabel: { fontSize: ms(10), color: "#6c757d", fontWeight: "600", textAlign: "center" },
  searchInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: vs(16) },
  filterContainer: { marginBottom: vs(16), marginTop: vs(20) },
  filterLabel: { fontSize: ms(14), color: "#6c757d", fontWeight: "600", marginBottom: vs(8) },
  filterButtons: { flexDirection: "row", flexWrap: "wrap", gap: s(8) },
  filterButton: { paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: ms(16), backgroundColor: "#e9ecef" },
  activeFilterButton: { backgroundColor: "#1a6a37" },
  filterButtonText: { fontSize: ms(12), color: "#6c757d", fontWeight: "600" },
  activeFilterText: { color: "#fff" },
  listHeaderSpacer: { height: vs(8) },
  emptyContainer: { alignItems: "center", paddingVertical: vs(60) },
  emptyTitle: { fontSize: ms(20), fontWeight: "600", color: "#6c757d", marginTop: vs(16), marginBottom: vs(8) },
  emptySubtitle: { fontSize: ms(14), color: "#adb5bd", textAlign: "center", lineHeight: ms(20), paddingHorizontal: s(20) },
});

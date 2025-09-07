import { useFocusEffect } from "@react-navigation/native";
import BillCard, { BillStatus } from "app/(main)/(users)/(userComponent)/BillCard";
import SearchBar from "app/(main)/(users)/(userComponent)/SearchBar";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getTransactionsForUser } from "functions/firebaseFunctions";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Clipboard,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Bill {
  id: string;
  billNumber: string;
  amount: string;
  date: string;
  status: BillStatus;
}

const BillsPage = () => {
  const [searchText, setSearchText] = useState("");
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentConfirmModalVisible, setPaymentConfirmModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<{ billNumber: string; amount: string } | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Gcash" | null>(null);

  const router = useRouter();
  const scalePay = useRef(new Animated.Value(1)).current;
  const scaleConfirm = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<Bill>>(null);
  const GCashNumber = "09959483927";

  const fetchBills = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const transactions = await getTransactionsForUser(user.uid);
      const mappedBills = transactions.map((tx) => ({
        id: tx.id,
        billNumber: tx.receiptNumber ?? tx.id,
        amount: tx.amountPaid?.toString() ?? "0",
        date: tx.date?.toDate() ?? new Date(),
        status: (tx.paymentStatus as BillStatus) ?? "Pending",
      }));

      mappedBills.sort((a, b) => {
        if (a.status === b.status) return b.date.getTime() - a.date.getTime();
        return a.status === "Pending" ? -1 : 1;
      });

      setBills(
        mappedBills.map((bill) => ({
          ...bill,
          date: bill.date.toISOString().split("T")[0],
        }))
      );
    } catch (error) {
      console.log("Error fetching bills:", error);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [])
  );

  const summary = useMemo(() => {
    let totalDue = 0;
    let pendingCount = 0;

    bills.forEach((bill) => {
      const amount = parseFloat(bill.amount);
      if (bill.status === "Pending") {
        totalDue += amount;
        pendingCount += 1;
      }
    });

    return { totalDue, pendingCount };
  }, [bills]);

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const openPaymentModal = (bill: { billNumber: string; amount: string }) => {
    setSelectedBill(bill);
    setPaymentModalVisible(true);
  };

  const handlePayment = (method: "Cash" | "Gcash") => {
    if (!selectedBill) return;
    setPaymentMethod(method);
    setPaymentModalVisible(false);
    setPaymentConfirmModalVisible(true);
    Animated.spring(scaleConfirm, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const handleCopyNumber = () => {
    Clipboard.setString(GCashNumber);
    Alert.alert("Copied!", "GCash number copied to clipboard.");
  };

  const closeConfirmModal = () => {
    Animated.timing(scaleConfirm, { toValue: 0, duration: 150, useNativeDriver: true }).start(() =>
      setPaymentConfirmModalVisible(false)
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a6a37" />

      {/* Header Background */}
      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bills</Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Balance Due</Text>
            <Text style={styles.summaryValue}>₱{summary.totalDue.toFixed(2)}</Text>
            {summary.totalDue > 0 && (
              <Pressable
                style={styles.payButton}
                onPress={() =>
                  openPaymentModal({ billNumber: "Total Due", amount: summary.totalDue.toString() })
                }
                onPressIn={() => handlePressIn(scalePay)}
                onPressOut={() => handlePressOut(scalePay)}
              >
                <Animated.Text
                  style={{ color: "#fff", fontWeight: "700", transform: [{ scale: scalePay }] }}
                >
                  Pay Now
                </Animated.Text>
              </Pressable>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Pending Bills</Text>
            <Text style={[styles.summaryValue, { color: "#1a6a37" }]}>{summary.pendingCount} bill(s)</Text>
          </View>
        </View>

        {/* Search */}
        <View style={{ marginTop: 20 }}>
          <SearchBar value={searchText} onChangeText={setSearchText} />
        </View>
      </View>

      {/* Bills List */}
      <FlatList
        ref={flatListRef}
        data={bills.filter((bill) => bill.billNumber.toLowerCase().includes(searchText.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BillCard
            key={item.id}
            billNumber={item.billNumber}
            amount={item.amount}
            date={item.date}
            status={item.status}
            onPress={() => openPaymentModal(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a6a37"]} />}
        style={{ marginTop: 15 }}
      />

      {/* Payment Modal */}
      <Modal transparent visible={paymentModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={{ fontSize: 16, marginBottom: 20 }}>
              {selectedBill?.billNumber}: ₱{selectedBill?.amount}
            </Text>
            <Pressable style={styles.modalButton} onPress={() => handlePayment("Cash")}>
              <Text style={styles.modalButtonText}>Cash</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={() => handlePayment("Gcash")}>
              <Text style={styles.modalButtonText}>Gcash</Text>
            </Pressable>
            <Pressable onPress={() => setPaymentModalVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#a9a9a9" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal transparent visible={paymentConfirmModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleConfirm }] }]}>
            <Text style={styles.modalTitle}>Payment Info</Text>
            <Text style={{ textAlign: "center", marginVertical: 15 }}>
              {paymentMethod === "Cash"
                ? `Please proceed to the store to pay cash for ${selectedBill?.billNumber}`
                : `Pay via GCash\nName: A*** *******LL`}
            </Text>

            {paymentMethod === "Gcash" && (
              <Pressable onPress={handleCopyNumber} style={styles.copyButton}>
                <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Copy Number</Text>
              </Pressable>
            )}

            <Pressable onPress={closeConfirmModal} style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#a9a9a9" }}>OK</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerBackground: {
    backgroundColor: "#1a6a37",
    paddingTop: 45,
    paddingBottom: 25,
    paddingHorizontal: 17,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "800" },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  summarySection: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 13, color: "#555", marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#333" },
  payButton: {
    marginTop: 12,
    backgroundColor: "#1a6a37",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  divider: { width: 1, height: "100%", backgroundColor: "#ddd" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "#1a6a37" },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
  },
  modalButtonText: { fontSize: 16, fontWeight: "600", color: "#212529", textAlign: "center" },
  copyButton: { backgroundColor: "#1a6a37", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginBottom: 10 },
});

export default BillsPage;
 
import { getAllTransactions, getInventory } from "functions/firebaseFunctions";
import { getBestSellingProducts } from "functions/productFunctions";
import { getMonthlySales } from "functions/reportsFunctions";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { s, vs } from "react-native-size-matters";
import Avatar from "../(components)/Avatar";
import Card from "../(components)/Card";
import Card2 from "../(components)/Card2";
import Popup from "../(components)/Popup";

export default function Dashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<any>({});
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 = Jan
  const currentYear = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch inventory
        const inventory = await getInventory();
        const lowStock = inventory.filter(
          (item: { quantity: number; lowStockThreshold: number }) =>
            item.quantity <= item.lowStockThreshold
        );

        // Fetch all transactions
        const rawTransactions = await getAllTransactions();

        // Convert Firestore timestamps to JS Dates safely
        const transactions = rawTransactions.map((t: any) => ({
          ...t,
          date: t.date?.toDate ? t.date.toDate() : new Date(0),
        }));

        setAllTransactions(transactions);

        // Latest 3 transactions for receipts
        const latestTransactions = transactions.sort(
          (a: any, b: any) => b.date.getTime() - a.date.getTime()
        );
        const receipts = latestTransactions.slice(0, 3).map((t: any) => ({
          name: `Transaction: ${t.id ?? "N/A"}`,
          value: `₱${t.total ?? 0}`,
          subtitle: (t.customerName ?? "unknown").toUpperCase(),
        }));

        // Total sales calculation
        const totalSales = transactions
          .filter((t: any) => t.transactionType === "sale")
          .reduce((sum: number, t: any) => sum + (t.totalAmount ?? 0), 0);

        // Monthly sales
        const monthlySales = getMonthlySales(transactions, currentMonth, currentYear);

        // Best Selling
        const bestSellingProducts = await getBestSellingProducts();

        setModalData({
          bestSelling: {
            title: "Best Selling Products",
            data: bestSellingProducts.map((p) => ({
              name: p.name,
              value: `₱${p.price}`,
              subtitle: `Sold: ${p.sold} units`,
            })),
          },
          receipts: { title: "Recent Receipts", data: receipts },
          lowStock: {
            title: "Low Stock Alerts",
            data: lowStock.map((item: any) => ({
              name: item.name,
              value: `${item.quantity} remaining`,
              subtitle: "Needs restock",
            })),
          },
          sales: {
            title: "Sales Performance",
            data: [
              { name: "Monthly Sales", value: monthlySales, hint: "Current month total" },
            ],
          },
          totalSales: totalSales, // optional
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = useCallback((modalType: string) => setActiveModal(modalType), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const renderModal = () => {
    if (!activeModal || !modalData[activeModal]) return null;
    return (
      <Modal
        visible={!!activeModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <Popup
          title={modalData[activeModal].title}
          data={modalData[activeModal].data}
          onClose={closeModal}
        />
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a6a37" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubTitle}>Shopnesty</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <Avatar />
        </View>

        <TouchableOpacity activeOpacity={0.8}>
          <Card
            title="Total Transactions"
            value={allTransactions.length ?? 0}
            subtitle="All Users"
            icon="swap-horizontal"
            iconColor="#e1b61c"
            trend="+15% from last month"
            description="Transactions are growing steadily."
          />
        </TouchableOpacity>

        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.cardWrapper} onPress={() => openModal("bestSelling")}>
              <Card2
                title="Best Selling"
                value={modalData.bestSelling?.data.length || 0}
                icon="pricetag"
                iconColor="#1a6a37"
                backgroundColor="#eafaf1"
                info="Top products"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cardWrapper} onPress={() => openModal("receipts")}>
              <Card2
                title="Receipts"
                value={modalData.receipts?.data.length || 0}
                icon="receipt"
                iconColor="#f9a514"
                backgroundColor="#fff8e1"
                info="Recent receipts"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.cardWrapper} onPress={() => openModal("lowStock")}>
              <Card2
                title="Low Stock"
                value={modalData.lowStock?.data.length || 0}
                icon="alert-circle"
                iconColor="#e41818"
                backgroundColor="#fdecea"
                info="Check items"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cardWrapper} onPress={() => openModal("sales")}>
              <Card2
                title="Sales Revenue"
                value={`₱${modalData.sales?.data[0]?.value ?? 0}`}
                icon="trending-up"
                iconColor="#fff"
                backgroundColor="#5cb85c"
                info="Performance"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {renderModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { paddingHorizontal: s(16), paddingVertical: vs(20), paddingBottom: vs(40) },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(8), marginTop: vs(20) },
  headerSubTitle: { fontSize: s(18), fontWeight: "600", color: "#6c757d", letterSpacing: 0.5 },
  headerTitle: { fontSize: s(32), fontWeight: "800", color: "#1a6a37", letterSpacing: -0.5 },
  gridContainer: { marginTop: vs(16) },
  gridRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: vs(12), gap: s(12) },
  cardWrapper: { flex: 1 },
});

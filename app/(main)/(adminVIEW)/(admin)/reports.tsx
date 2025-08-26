// Reports.tsx
import { useFocusEffect } from "@react-navigation/native";
import { db } from "config/firebaseConfig";
import { getAuth } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
  computeReportStats,
  exportReportsAsCSV,
  prepareReportData,
  ReportModalData,
} from "functions/reportsFunctions";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ms, s, vs } from "react-native-size-matters";
import Avatar from "../(components)/Avatar";
import Card2 from "../(components)/Card2";
import Popup from "../(components)/Popup";

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  notes?: string;
}

interface Transaction {
  id: string;
  amountPaid: number;
  customerName: string;
  items: Item[];
}

interface ReportItem {
  name: string;
  value: string;
  subtitle?: string;
  items?: Item[];
}

export default function Reports() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [reportData, setReportData] = useState<Record<string, ReportModalData>>({
    revenue: { title: "Revenue", data: [] },
    topProducts: { title: "Top Products", data: [] },
    stockMovement: { title: "Stock Movement", data: [] },
  });

  const scrollRef = useRef<ScrollView>(null);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Reset scroll to top when screen gains focus
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const openModal = useCallback((modalType: string) => setActiveModal(modalType), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  // --- Fetch Reports Dynamically ---
  useEffect(() => {
    const fetchReports = async () => {
      if (!userId) return;

      try {
        // --- Fetch transactions directly from Firestore ---
        const txQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
        const txSnapshot = await getDocs(txQuery);

        const transactions: Transaction[] = txSnapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            amountPaid: data.amountPaid || 0,
            customerName: data.customerName || "",
            items: data.items?.map((i: any) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              total: i.total,
              notes: i.notes || "",
            })) || [],
          };
        });

        // Prepare report data for the modals
        const preparedData: Record<string, ReportModalData> = {
          revenue: {
            title: "Revenue",
            data: transactions.map((tx) => ({
              name: tx.customerName,
              value: `₱${tx.amountPaid.toFixed(2)}`,
              subtitle: `Items: ${tx.items.map((i) => i.name).join(", ")}`,
            })),
          },
          topProducts: await prepareReportData(userId).then((d) => d.topProducts),
          stockMovement: await prepareReportData(userId).then((d) => d.stockMovement),
        };

        setReportData(preparedData);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, [userId]);

  // --- Compute Report Stats ---
  const reportStats = useMemo(() => computeReportStats(reportData), [reportData]);

  // --- Export Reports as CSV ---
  const exportReport = async () => {
    try {
      const csvContent = exportReportsAsCSV(reportData);
      console.log("CSV Generated:\n", csvContent);
      // TODO: Implement actual file saving/sharing
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const renderModal = () => {
    if (!activeModal || !reportData[activeModal]) return null;
    return (
      <Modal
        visible={!!activeModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <Popup
          title={reportData[activeModal].title}
          data={reportData[activeModal].data}
          onClose={closeModal}
        />
      </Modal>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <GestureHandlerRootView style={styles.container}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubTitle}>Shopnesty</Text>
              <Text style={styles.headerTitle}>Reports</Text>
            </View>
            <Avatar />
          </View>

          {/* Stats Cards */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardLabel}>Total Sales</Text>
              <Text style={styles.cardValue}>₱{reportStats.totalSales.toFixed(2)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardLabel}>Top Products</Text>
              <Text style={styles.cardValue}>{reportStats.topProducts}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardLabel}>Low Stock</Text>
              <Text style={styles.cardValue}>{reportStats.lowStockItems}</Text>
            </TouchableOpacity>

            {/* Report Cards */}
            <TouchableOpacity style={styles.card} onPress={() => openModal("revenue")}>
              <Card2
                title="Revenue"
                value={`₱${reportStats.totalSales.toFixed(2)}`}
                icon="trending-up"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Total income"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => openModal("topProducts")}>
              <Card2
                title="Top Products"
                value={`${reportStats.topProducts} items`}
                icon="pricetag"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Best sellers"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => openModal("stockMovement")}>
              <Card2
                title="Stock Movement"
                value={`${reportStats.lowStockItems} low`}
                icon="swap-horizontal"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Items restocked"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={exportReport}>
              <Card2
                title="Export Reports"
                value="CSV / PDF"
                icon="download"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Save reports outside system"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {renderModal()}
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: s(16), paddingVertical: vs(20), paddingBottom: vs(40) },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
    marginTop: 20,
  },
  headerSubTitle: { fontSize: s(18), fontWeight: "600", color: "#6c757d" },
  headerTitle: { fontSize: s(32), fontWeight: "800", color: "#1a6a37" },
  cardsContainer: { marginTop: vs(8) },
  card: {
    backgroundColor: "#fff",
    borderRadius: ms(12),
    padding: s(16),
    marginBottom: vs(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: { fontSize: ms(14), color: "#6c757d", fontWeight: "600", marginBottom: vs(4) },
  cardValue: { fontSize: ms(24), fontWeight: "800", color: "#1a6a37" },
});

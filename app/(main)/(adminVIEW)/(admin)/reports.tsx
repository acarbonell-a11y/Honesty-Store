// Reports.tsx
import { useFocusEffect } from "@react-navigation/native"; // If using react-navigation
import React, { useCallback, useMemo, useRef, useState } from "react";
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

interface ReportModalData {
  title: string;
  data: Array<{
    name: string;
    value: string;
    subtitle?: string;
  }>;
}

const REPORT_MODAL_DATA: Record<string, ReportModalData> = {
  salesByDate: {
    title: "Sales by Date Range",
    data: [
      { name: "Daily", value: "₱2,500" },
      { name: "Weekly", value: "₱12,500" },
      { name: "Monthly", value: "₱50,000" },
    ],
  },
  topProducts: {
    title: "Top-Selling Products",
    data: [
      { name: "Coffee Beans", value: "120 units" },
      { name: "Green Tea", value: "80 units" },
      { name: "Espresso Blend", value: "65 units" },
    ],
  },
  revenue: {
    title: "Revenue Reports",
    data: [
      { name: "This Week", value: "₱12,500" },
      { name: "This Month", value: "₱50,000" },
      { name: "Year-to-Date", value: "₱600,000" },
    ],
  },
  stockMovement: {
    title: "Stock Movement",
    data: [
      { name: "Sugar Packets", value: "5 remaining" },
      { name: "Milk Cartons", value: "3 remaining" },
      { name: "Paper Cups", value: "8 remaining" },
    ],
  },
};

export default function Reports() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Reset scroll to top when screen gains focus
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const openModal = useCallback((modalType: string) => {
    setActiveModal(modalType);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const reportStats = useMemo(
    () => ({
      totalSales: "₱50,000",
      topProducts: 3,
      lowStockItems: 3,
    }),
    []
  );

  const renderModal = () => {
    if (!activeModal || !REPORT_MODAL_DATA[activeModal]) return null;

    return (
      <Modal
        visible={!!activeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <Popup
          title={REPORT_MODAL_DATA[activeModal].title}
          data={REPORT_MODAL_DATA[activeModal].data}
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
          showsVerticalScrollIndicator={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubTitle}>Shopnesty</Text>
              <Text style={styles.headerTitle}>Reports</Text>
            </View>
            <Avatar />
          </View>

          {/* Stats Cards - Full width */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardLabel}>Total Sales</Text>
              <Text style={styles.cardValue}>{reportStats.totalSales}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardLabel}>Top Products</Text>
              <Text style={styles.cardValue}>{reportStats.topProducts}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardLabel}>Low Stock</Text>
              <Text style={styles.cardValue}>{reportStats.lowStockItems}</Text>
            </TouchableOpacity>

            {/* Reports Cards */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => openModal("salesByDate")}
            >
              <Card2
                title="Sales by Date"
                value="Select Range"
                icon="calendar"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Daily, Weekly, Monthly"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => openModal("topProducts")}
            >
              <Card2
                title="Top Products"
                value="3 items"
                icon="pricetag"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Best sellers"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => openModal("revenue")}
            >
              <Card2
                title="Revenue"
                value="₱50,000"
                icon="trending-up"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Total income"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => openModal("stockMovement")}
            >
              <Card2
                title="Stock Movement"
                value="3 low"
                icon="swap-horizontal"
                iconColor="#1a6a37"
                backgroundColor="#fff"
                info="Items restocked"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => console.log("Export Reports")}
            >
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
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(16),
    paddingVertical: vs(20),
    paddingBottom: vs(40),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
    marginTop:(20)
  },
  headerSubTitle: {
    fontSize: s(18),
    fontWeight: "600",
    color: "#6c757d",
  },
  headerTitle: {
    fontSize: s(32),
    fontWeight: "800",
    color: "#1a6a37",
  },
  cardsContainer: {
    marginTop: vs(8),
  },
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
  cardLabel: {
    fontSize: ms(14),
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: vs(4),
  },
  cardValue: {
    fontSize: ms(24),
    fontWeight: "800",
    color: "#1a6a37",
  },
});

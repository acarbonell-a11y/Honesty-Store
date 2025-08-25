import React, { useCallback, useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { s, vs } from "react-native-size-matters";
import Avatar from "../(components)/Avatar";
import Card from "../(components)/Card";
import Card2 from "../(components)/Card2";
import Popup from "../(components)/Popup";

interface ModalData {
  title: string;
  data: Array<{
    name: string;
    value: string;
    subtitle?: string;
    hint?: string;
  }>;
}

const MODAL_DATA: Record<string, ModalData> = {
  bestSelling: {
    title: "Best Selling Products",
    data: [
      { name: "Coffee Beans", value: "₱6,000", subtitle: "Sold: 120 units" },
      { name: "Green Tea", value: "₱4,000", subtitle: "Sold: 80 units" },
      { name: "Espresso Blend", value: "₱3,500", subtitle: "Sold: 65 units" },
    ],
  },
  receipts: {
    title: "Recent Receipts",
    data: [
      { name: "Juan Dela Cruz", value: "₱1,200", subtitle: "Receipt #001" },
      { name: "Maria Santos", value: "₱850", subtitle: "Receipt #002" },
      { name: "Pedro Garcia", value: "₱2,100", subtitle: "Receipt #003" },
    ],
  },
  lowStock: {
    title: "Low Stock Alerts",
    data: [
      { name: "Sugar Packets", value: "5 remaining", subtitle: "Reorder needed" },
      { name: "Milk Cartons", value: "3 remaining", subtitle: "Critical level" },
      { name: "Paper Cups", value: "8 remaining", subtitle: "Low stock" },
    ],
  },
  sales: {
    title: "Sales Performance",
    data: [
      { name: "Weekly Sales", value: "₱12,500", hint: "7-day performance" },
      { name: "Monthly Sales", value: "₱50,000", hint: "Current month total" },
      { name: "Top Product", value: "Coffee Beans", hint: "Best performer" },
      { name: "Pending Payments", value: "₱3,000", hint: "Outstanding amount" },
    ],
  },
};

export default function Dashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = useCallback((modalType: string) => {
    setActiveModal(modalType);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const renderModal = () => {
    if (!activeModal || !MODAL_DATA[activeModal]) return null;

    return (
      <Modal
        visible={!!activeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <Popup
          title={MODAL_DATA[activeModal].title}
          data={MODAL_DATA[activeModal].data}
          onClose={closeModal}
        />
      </Modal>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubTitle}>Shopnesty</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <Avatar />
        </View>

        {/* Main Metrics Card */}
        <TouchableOpacity activeOpacity={0.8}>
          <Card
            title="Total Transactions"
            value="120"
            subtitle="This Month"
            icon="swap-horizontal"
            iconColor="#e1b61c"
            trend="+15% from last month"
            description="Transactions are growing steadily."
          />
        </TouchableOpacity>

        {/* Quick Stats Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.cardWrapper}
              activeOpacity={0.7}
              onPress={() => openModal('bestSelling')}
            >
              <Card2
                title="Best Selling"
                value="8"
                icon="pricetag"
                iconColor="#1a6a37"
                backgroundColor="#eafaf1"
                info="Top product: Coffee Beans"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardWrapper}
              activeOpacity={0.7}
              onPress={() => openModal('receipts')}
            >
              <Card2
                title="Receipts"
                value="4"
                icon="receipt"
                iconColor="#f9a514"
                backgroundColor="#fff8e1"
                info="Recent transactions"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.cardWrapper}
              activeOpacity={0.7}
              onPress={() => openModal('lowStock')}
            >
              <Card2
                title="Low Stock"
                value="3"
                icon="alert-circle"
                iconColor="#e41818"
                backgroundColor="#fdecea"
                info="Items need restocking"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardWrapper}
              activeOpacity={0.7}
              onPress={() => openModal('sales')}
            >
              <Card2
                title="Sales Revenue"
                value="₱50k"
                icon="trending-up"
                iconColor="#fff"
                backgroundColor="#5cb85c"
                info="Monthly performance"
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
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    marginBottom: vs(8),
    marginTop: vs(20),
  },
  headerSubTitle: {
    fontSize: s(18),
    fontWeight: "600",
    color: "#6c757d",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: s(32),
    fontWeight: "800",
    color: "#1a6a37",
    letterSpacing: -0.5,
  },
  gridContainer: {
    marginTop: vs(16),
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(12),
    gap: s(12),
  },
  cardWrapper: {
    flex: 1,
  },
});
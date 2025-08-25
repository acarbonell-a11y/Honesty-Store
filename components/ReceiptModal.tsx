import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ms, s, vs } from "react-native-size-matters";
import { Transaction } from "../admin/transactions";

interface ReceiptModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onDownload: (transaction: Transaction) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReceiptModal({
  visible,
  transaction,
  onClose,
  onDownload,
}: ReceiptModalProps) {
  if (!transaction) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Receipt Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.receiptContainer} showsVerticalScrollIndicator={false}>
            {/* Receipt Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.businessName}>Shopnesty</Text>
              <Text style={styles.receiptNumber}>{transaction.receiptNumber}</Text>
              <Text style={styles.receiptDate}>
                {formatDate(transaction.date)} at {formatTime(transaction.date)}
              </Text>
              {transaction.customerName && (
                <Text style={styles.customerInfo}>Customer: {transaction.customerName}</Text>
              )}
            </View>

            {/* Items List */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Items Purchased</Text>
              {transaction.items.map((item, index) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity} × ₱{item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>₱{item.total.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>₱{transaction.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (12%):</Text>
                <Text style={styles.totalValue}>₱{transaction.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>₱{transaction.total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Payment Information */}
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Status:</Text>
                <Text style={[
                  styles.paymentValue,
                  { color: transaction.paymentStatus === "Paid" ? "#28a745" : 
                           transaction.paymentStatus === "Partially Paid" ? "#ffc107" : "#dc3545" }
                ]}>
                  {transaction.paymentStatus}
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Amount Paid:</Text>
                <Text style={styles.paymentValue}>₱{transaction.amountPaid.toFixed(2)}</Text>
              </View>
              {transaction.paymentStatus !== "Paid" && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Remaining Balance:</Text>
                  <Text style={[styles.paymentValue, { color: "#dc3545" }]}>
                    ₱{(transaction.total - transaction.amountPaid).toFixed(2)}
                  </Text>
                </View>
              )}
              {transaction.paymentMethod && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Payment Method:</Text>
                  <Text style={styles.paymentValue}>{transaction.paymentMethod}</Text>
                </View>
              )}
            </View>

            {/* Notes */}
            {transaction.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{transaction.notes}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => onDownload(transaction)}
            >
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: s(20),
  },
  modalContent: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: "#fff",
    borderRadius: ms(20),
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fafafa",
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: s(4),
    borderRadius: ms(20),
    backgroundColor: "#f5f5f5",
  },
  receiptContainer: {
    padding: s(20),
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: vs(24),
    paddingBottom: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  businessName: {
    fontSize: ms(24),
    fontWeight: "800",
    color: "#1a6a37",
    marginBottom: vs(8),
  },
  receiptNumber: {
    fontSize: ms(18),
    fontWeight: "600",
    color: "#495057",
    marginBottom: vs(4),
  },
  receiptDate: {
    fontSize: ms(14),
    color: "#6c757d",
    marginBottom: vs(8),
  },
  customerInfo: {
    fontSize: ms(14),
    color: "#495057",
    fontWeight: "500",
  },
  itemsSection: {
    marginBottom: vs(24),
  },
  sectionTitle: {
    fontSize: ms(16),
    fontWeight: "700",
    color: "#212529",
    marginBottom: vs(12),
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#212529",
    marginBottom: vs(2),
  },
  itemDetails: {
    fontSize: ms(12),
    color: "#6c757d",
  },
  itemTotal: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#1a6a37",
  },
  totalsSection: {
    marginBottom: vs(24),
    paddingTop: vs(16),
    borderTopWidth: 2,
    borderTopColor: "#e9ecef",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(4),
  },
  totalLabel: {
    fontSize: ms(14),
    color: "#495057",
  },
  totalValue: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#495057",
  },
  grandTotalRow: {
    paddingTop: vs(8),
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
    marginTop: vs(8),
  },
  grandTotalLabel: {
    fontSize: ms(16),
    fontWeight: "700",
    color: "#212529",
  },
  grandTotalValue: {
    fontSize: ms(18),
    fontWeight: "800",
    color: "#1a6a37",
  },
  paymentSection: {
    marginBottom: vs(24),
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(6),
  },
  paymentLabel: {
    fontSize: ms(14),
    color: "#495057",
  },
  paymentValue: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#212529",
  },
  notesSection: {
    marginBottom: vs(16),
  },
  notesText: {
    fontSize: ms(14),
    color: "#495057",
    lineHeight: ms(20),
    fontStyle: "italic",
  },
  buttonContainer: {
    paddingHorizontal: s(20),
    paddingVertical: vs(20),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a6a37",
    paddingVertical: vs(14),
    borderRadius: ms(8),
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "600",
    marginLeft: s(8),
  },
});
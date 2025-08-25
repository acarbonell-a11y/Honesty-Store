import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ms, s, vs } from "react-native-size-matters";
import { Transaction } from "../admin/transactions";

interface PaymentModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onUpdatePayment: (
    transactionId: string,
    status: Transaction['paymentStatus'],
    amountPaid: number,
    paymentMethod?: Transaction['paymentMethod']
  ) => void;
}

const PAYMENT_METHODS: Transaction['paymentMethod'][] = ["Cash", "Card", "Digital Wallet"];

export default function PaymentModal({
  visible,
  transaction,
  onClose,
  onUpdatePayment,
}: PaymentModalProps) {
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<Transaction['paymentMethod']>("Cash");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction) {
      setAmountPaid(transaction.amountPaid.toString());
      setSelectedPaymentMethod(transaction.paymentMethod || "Cash");
    }
    setErrors({});
  }, [transaction, visible]);

  if (!transaction) return null;

  const remainingBalance = transaction.total - transaction.amountPaid;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(amountPaid);

    if (!amountPaid || isNaN(amount) || amount < 0) {
      newErrors.amount = "Valid amount is required";
    } else if (amount > transaction.total) {
      newErrors.amount = "Amount cannot exceed total";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePayment = () => {
    if (!validateForm()) return;

    const amount = parseFloat(amountPaid);
    let status: Transaction['paymentStatus'];

    if (amount >= transaction.total) {
      status = "Paid";
    } else if (amount > 0) {
      status = "Partially Paid";
    } else {
      status = "Unpaid";
    }

    Alert.alert(
      "Update Payment",
      `Update payment to ₱${amount.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: () => {
            onUpdatePayment(transaction.id, status, amount, selectedPaymentMethod);
            onClose();
          },
        },
      ]
    );
  };

  const handleQuickAmount = (amount: number) => {
    setAmountPaid(amount.toString());
  };

  // Fixed: Use correct Ionicons names
  const getPaymentMethodIcon = (method: Transaction['paymentMethod']): keyof typeof Ionicons.glyphMap => {
    switch (method) {
      case "Cash": return "cash-outline";
      case "Card": return "card-outline";
      case "Digital Wallet": return "phone-portrait-outline";
      default: return "wallet-outline";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Payment</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Transaction Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.receiptNumber}>{transaction.receiptNumber}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount:</Text>
                <Text style={styles.summaryValue}>₱{transaction.total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Currently Paid:</Text>
                <Text style={styles.summaryValue}>₱{transaction.amountPaid.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.remainingRow]}>
                <Text style={styles.remainingLabel}>Remaining Balance:</Text>
                <Text style={styles.remainingValue}>₱{remainingBalance.toFixed(2)}</Text>
              </View>
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountContainer}>
              <Text style={styles.sectionTitle}>Quick Amount</Text>
              <View style={styles.quickAmountButtons}>
                <TouchableOpacity
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(remainingBalance)}
                >
                  <Text style={styles.quickAmountText}>Pay Remaining</Text>
                  <Text style={styles.quickAmountValue}>₱{remainingBalance.toFixed(2)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(transaction.total)}
                >
                  <Text style={styles.quickAmountText}>Pay Full</Text>
                  <Text style={styles.quickAmountValue}>₱{transaction.total.toFixed(2)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Amount *</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={[styles.amountInput, errors.amount && styles.inputError]}
                  placeholder="0.00"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
            </View>

            {/* Payment Method Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodContainer}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      selectedPaymentMethod === method && styles.selectedPaymentMethod,
                    ]}
                    onPress={() => setSelectedPaymentMethod(method)}
                  >
                    <Ionicons
                      name={getPaymentMethodIcon(method)}
                      size={20}
                      color={selectedPaymentMethod === method ? "#fff" : "#6c757d"}
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        selectedPaymentMethod === method && styles.selectedPaymentMethodText,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Status Preview */}
            <View style={styles.statusPreview}>
              <Text style={styles.statusPreviewLabel}>New Status:</Text>
              <View style={styles.statusPreviewContainer}>
                {(() => {
                  const amount = parseFloat(amountPaid) || 0;
                  let status: Transaction['paymentStatus'];
                  let color: string;
                  let icon: keyof typeof Ionicons.glyphMap;

                  if (amount >= transaction.total) {
                    status = "Paid";
                    color = "#28a745";
                    icon = "checkmark-circle";
                  } else if (amount > 0) {
                    status = "Partially Paid";
                    color = "#ffc107";
                    icon = "time-outline";
                  } else {
                    status = "Unpaid";
                    color = "#dc3545";
                    icon = "close-circle";
                  }

                  return (
                    <View style={[styles.statusBadge, { backgroundColor: color }]}>
                      <Ionicons name={icon} size={14} color="#fff" />
                      <Text style={styles.statusBadgeText}>{status}</Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePayment}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.updateButtonText}>Update Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    maxHeight: "90%",
    paddingBottom: vs(20),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: "700",
    color: "#212529",
  },
  closeButton: {
    padding: s(4),
  },
  formContainer: {
    paddingHorizontal: s(20),
    paddingTop: vs(20),
  },
  summaryContainer: {
    backgroundColor: "#f8f9fa",
    padding: s(16),
    borderRadius: ms(12),
    marginBottom: vs(20),
  },
  receiptNumber: {
    fontSize: ms(18),
    fontWeight: "700",
    color: "#1a6a37",
    marginBottom: vs(12),
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
  },
  summaryLabel: {
    fontSize: ms(14),
    color: "#6c757d",
  },
  summaryValue: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#212529",
  },
  remainingRow: {
    paddingTop: vs(8),
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
    marginTop: vs(4),
  },
  remainingLabel: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#dc3545",
  },
  remainingValue: {
    fontSize: ms(16),
    fontWeight: "700",
    color: "#dc3545",
  },
  quickAmountContainer: {
    marginBottom: vs(20),
  },
  sectionTitle: {
    fontSize: ms(16),
    fontWeight: "600",
    color: "#212529",
    marginBottom: vs(12),
  },
  quickAmountButtons: {
    flexDirection: "row",
    gap: s(12),
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: "#e9ecef",
    padding: s(12),
    borderRadius: ms(8),
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: ms(12),
    color: "#6c757d",
    marginBottom: vs(4),
  },
  quickAmountValue: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#1a6a37",
  },
  inputGroup: {
    marginBottom: vs(20),
  },
  inputLabel: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#495057",
    marginBottom: vs(8),
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: ms(8),
    backgroundColor: "#f8f9fa",
  },
  currencySymbol: {
    fontSize: ms(18),
    fontWeight: "600",
    color: "#1a6a37",
    paddingLeft: s(12),
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    fontSize: ms(18),
    fontWeight: "600",
    color: "#212529",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  errorText: {
    fontSize: ms(12),
    color: "#dc3545",
    marginTop: vs(4),
  },
  paymentMethodContainer: {
    flexDirection: "row",
    gap: s(8),
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(12),
    paddingHorizontal: s(8),
    borderRadius: ms(8),
    backgroundColor: "#e9ecef",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPaymentMethod: {
    backgroundColor: "#1a6a37",
    borderColor: "#1a6a37",
  },
  paymentMethodText: {
    fontSize: ms(12),
    color: "#6c757d",
    fontWeight: "600",
    marginLeft: s(4),
  },
  selectedPaymentMethodText: {
    color: "#fff",
  },
  statusPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: s(12),
    borderRadius: ms(8),
    marginBottom: vs(20),
  },
  statusPreviewLabel: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#495057",
  },
  statusPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: ms(16),
  },
  statusBadgeText: {
    fontSize: ms(12),
    fontWeight: "600",
    color: "#fff",
    marginLeft: s(4),
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: s(20),
    paddingTop: vs(20),
    gap: s(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: vs(14),
    borderRadius: ms(8),
    backgroundColor: "#6c757d",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "600",
  },
  updateButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: vs(14),
    borderRadius: ms(8),
    backgroundColor: "#1a6a37",
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "600",
    marginLeft: s(4),
  },
});
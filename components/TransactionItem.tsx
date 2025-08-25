import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ms, s, vs } from "react-native-size-matters";
import { Transaction } from "../admin/transactions";

interface TransactionItemProps {
  transaction: Transaction;
  onViewReceipt: (transaction: Transaction) => void;
  onUpdatePayment: (transaction: Transaction) => void;
  onDownload: (transaction: Transaction) => void;
}

export default function TransactionItem({
  transaction,
  onViewReceipt,
  onUpdatePayment,
  onDownload,
}: TransactionItemProps) {
  const getStatusColor = (status: Transaction['paymentStatus']) => {
    switch (status) {
      case "Paid": return "#28a745";
      case "Partially Paid": return "#ffc107";
      case "Unpaid": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusIcon = (status: Transaction['paymentStatus']) => {
    switch (status) {
      case "Paid": return "checkmark-circle";
      case "Partially Paid": return "time-outline";
      case "Unpaid": return "close-circle";
      default: return "help-circle";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const remainingBalance = transaction.total - transaction.amountPaid;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptNumber}>{transaction.receiptNumber}</Text>
          <Text style={styles.dateTime}>
            {formatDate(transaction.date)} • {formatTime(transaction.date)}
          </Text>
          {transaction.customerName && (
            <Text style={styles.customerName}>{transaction.customerName}</Text>
          )}
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={styles.totalAmount}>₱{transaction.total.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.paymentStatus) }]}>
            <Ionicons 
              name={getStatusIcon(transaction.paymentStatus)} 
              size={12} 
              color="#fff" 
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{transaction.paymentStatus}</Text>
          </View>
        </View>
      </View>

      {transaction.paymentStatus !== "Paid" && (
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentText}>
            Paid: ₱{transaction.amountPaid.toFixed(2)} • 
            Remaining: ₱{remainingBalance.toFixed(2)}
          </Text>
        </View>
      )}

      <View style={styles.itemsPreview}>
        <Text style={styles.itemsLabel}>Items ({transaction.items.length}):</Text>
        <Text style={styles.itemsList} numberOfLines={2}>
          {transaction.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onViewReceipt(transaction)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="eye-outline" size={16} color="#1a6a37" />
          <Text style={styles.actionText}>View Receipt</Text>
        </TouchableOpacity>

        {transaction.paymentStatus !== "Paid" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.paymentButton]}
            onPress={() => onUpdatePayment(transaction)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="card-outline" size={16} color="#ffc107" />
            <Text style={[styles.actionText, { color: "#ffc107" }]}>Update Payment</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={() => onDownload(transaction)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="download-outline" size={16} color="#6c757d" />
          <Text style={[styles.actionText, { color: "#6c757d" }]}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginBottom: vs(12),
    borderRadius: ms(12),
    padding: s(16),
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: vs(12),
  },
  receiptInfo: {
    flex: 1,
  },
  receiptNumber: {
    fontSize: ms(16),
    fontWeight: "700",
    color: "#212529",
    marginBottom: vs(4),
  },
  dateTime: {
    fontSize: ms(12),
    color: "#6c757d",
    marginBottom: vs(2),
  },
  customerName: {
    fontSize: ms(14),
    color: "#495057",
    fontWeight: "500",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  totalAmount: {
    fontSize: ms(18),
    fontWeight: "700",
    color: "#1a6a37",
    marginBottom: vs(4),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: ms(12),
  },
  statusIcon: {
    marginRight: s(4),
  },
  statusText: {
    fontSize: ms(11),
    fontWeight: "600",
    color: "#fff",
  },
  paymentInfo: {
    backgroundColor: "#fff3cd",
    padding: s(8),
    borderRadius: ms(6),
    marginBottom: vs(12),
  },
  paymentText: {
    fontSize: ms(12),
    color: "#856404",
    fontWeight: "500",
  },
  itemsPreview: {
    marginBottom: vs(12),
  },
  itemsLabel: {
    fontSize: ms(12),
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: vs(4),
  },
  itemsList: {
    fontSize: ms(12),
    color: "#495057",
    lineHeight: ms(16),
  },


actions: {
  flexDirection: "row",
  flexWrap: "wrap", // allows wrapping to next line if space runs out
  justifyContent: "flex-start", // keep buttons aligned neatly
  alignItems: "center",
  paddingTop: vs(12),
  borderTopWidth: 1,
  borderTopColor: "#f0f0f0",
  gap: s(8), // keeps consistent spacing
},
actionButton: {
  flex: 1, // all buttons share equal width
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: vs(8),
  paddingHorizontal: s(12),
  borderRadius: ms(8),
  backgroundColor: "#f8f9fa",
  minHeight: vs(36),
},
  paymentButton: {
    backgroundColor: "#fff3cd",
  },
  downloadButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  actionText: {
    fontSize: ms(11),
    color: "#1a6a37",
    fontWeight: "600",
    marginLeft: s(4),
    textAlign: "center",
  },
});
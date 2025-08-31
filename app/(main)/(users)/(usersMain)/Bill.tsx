import { Ionicons } from '@expo/vector-icons';
import BillCard, { BillStatus } from 'app/(main)/(users)/(userComponent)/BillCard';
import SearchBar from 'app/(main)/(users)/(userComponent)/SearchBar';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getTransactionsForUser } from 'functions/firebaseFunctions';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const Bill = () => {
  const [searchText, setSearchText] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<{ billNumber: string; amount: string } | null>(null);
  const [bills, setBills] = useState<
    { id: string; billNumber: string; amount: string; date: string; status: BillStatus }[]
  >([]);

  const router = useRouter();
  const scaleNotification = useRef(new Animated.Value(1)).current;
  const scalePay = useRef(new Animated.Value(1)).current;

  // Fetch user transactions
  useEffect(() => {
    const fetchUserBills = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const transactions = await getTransactionsForUser(user.uid);

        const mappedBills = transactions.map((tx) => ({
          id: tx.id,
          billNumber: tx.receiptNumber ?? tx.id,
          amount: tx.amountPaid?.toString() ?? '0',
          date: tx.date?.toDate().toISOString().split('T')[0] ?? '',
          status: (tx.paymentStatus as BillStatus) ?? 'Pending',
        }));

        setBills(mappedBills);
      } catch (error) {
        console.log('Error fetching bills:', error);
      }
    };

    fetchUserBills();
  }, []);

  // Calculate summary
  const summary = useMemo(() => {
    let totalDue = 0;
    let totalCurrent = 0;

    bills.forEach(bill => {
      const amount = parseFloat(bill.amount);
      if (bill.status === 'Paid') totalCurrent += amount;
      else totalDue += amount;
    });

    return { totalDue, totalCurrent };
  }, [bills]);

  // Button animation
  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  // Open payment modal
  const openPaymentModal = (bill: { billNumber: string; amount: string }) => {
    setSelectedBill(bill);
    setPaymentModalVisible(true);
  };

  // Handle payment selection
  const handlePayment = (method: 'Cash' | 'Gcash') => {
    setPaymentModalVisible(false);
    Alert.alert('Payment', `Paid ${selectedBill?.billNumber} via ${method}`);
  };

  // Render top icons
  const renderIcon = (
    iconName: React.ComponentProps<typeof Ionicons>['name'],
    badgeCount: number,
    scale: Animated.Value,
    onPress?: () => void
  ) => (
    <Pressable
      onPress={onPress}
      onPressIn={() => handlePressIn(scale)}
      onPressOut={() => handlePressOut(scale)}
      hitSlop={10}
      style={styles.iconWrapper}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={iconName} size={28} color="#000" />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bills</Text>
        <View style={styles.iconContainer}>
          {renderIcon('notifications-outline', 5, scaleNotification, () =>
            router.push('/(main)/(users)/(usersMain)/NotifacationScreen')
          )}
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance Due</Text>
          <Text style={styles.summaryValue}>₱{summary.totalDue.toFixed(2)}</Text>

          {/* Pay Now Button */}
          {summary.totalDue > 0 && (
            <Pressable
              style={styles.payButton}
              onPress={() => openPaymentModal({ billNumber: 'Total Due', amount: summary.totalDue.toString() })}
              onPressIn={() => handlePressIn(scalePay)}
              onPressOut={() => handlePressOut(scalePay)}
            >
              <Animated.Text style={[styles.payButtonText, { transform: [{ scale: scalePay }] }]}>
                Pay Now
              </Animated.Text>
            </Pressable>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Current Paid</Text>
          <Text style={[styles.summaryValue, { color: '#1a6a37' }]}>
            ₱{summary.totalCurrent.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Search */}
      <SearchBar value={searchText} onChangeText={setSearchText} />

      {/* Bills List */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 15 }}>
        {bills
          .filter(bill => bill.billNumber.toLowerCase().includes(searchText.toLowerCase()))
          .map(bill => (
            <BillCard
              key={bill.id}
              billNumber={bill.billNumber}
              amount={bill.amount}
              date={bill.date}
              status={bill.status}
              onPress={() => console.log(`Tapped ${bill.billNumber}`)}
            />
          ))}
      </ScrollView>

      {/* Payment Modal */}
      <Modal transparent visible={paymentModalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalBillText}>
              {selectedBill?.billNumber}: ₱{selectedBill?.amount}
            </Text>

            {/* Cash Option */}
            <Pressable style={styles.paymentOption} onPress={() => handlePayment('Cash')}>
              <View style={styles.paymentRow}>
                <Ionicons name="cash-outline" size={24} color="#1a6a37" style={{ marginRight: 12 }} />
                <Text style={styles.paymentText}>Cash</Text>
              </View>
            </Pressable>

            {/* GCash Option */}
            <Pressable style={styles.paymentOption} onPress={() => handlePayment('Gcash')}>
              <View style={styles.paymentRow}>
                <Ionicons name="card-outline" size={24} color="#1a6a37" style={{ marginRight: 12 }} />
                <Text style={styles.paymentText}>Gcash</Text>
              </View>
            </Pressable>

            {/* Cancel Button */}
            <Pressable onPress={() => setPaymentModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 17, paddingTop: 45 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontWeight: '800', color: '#000', fontSize: 28 },
  iconContainer: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { marginHorizontal: 10 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#1a6a37',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  divider: { width: 1, height: '100%', backgroundColor: '#e0e0e0' },

  payButton: {
    marginTop: 12,
    backgroundColor: '#1a6a37',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#1a6a37' },
  modalBillText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  paymentOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentText: { fontSize: 16, fontWeight: '600', color: '#212529' },
  closeButton: { marginTop: 10, alignItems: 'center' },
  closeText: { fontSize: 16, fontWeight: '600', color: '#a9a9a9' },
});

export default Bill;

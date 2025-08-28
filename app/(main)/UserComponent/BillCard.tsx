import React, { useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type BillStatus = 'Paid' | 'Pending';

type BillCardProps = {
  billNumber: string;
  date: string;
  status: BillStatus;
  amount: string;
  onPress?: () => void;
};

const BillCard = ({ billNumber, date, status, amount, onPress }: BillCardProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setModalVisible(true);
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(scaleAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => setModalVisible(false));
  };

  // Get next Monday
  const getNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = (8 - day) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + diff);
    return nextMonday.toLocaleDateString();
  };

  const displayStatus = status === 'Paid' ? 'Paid' : 'Pending';
  const statusColor = status === 'Paid' ? '#28a745' : '#ff9900';
  const dueDate = status === 'Paid' ? '' : getNextMonday();

  return (
    <>
      {/* Card */}
      <Pressable onPress={openModal} style={[styles.card, status === 'Pending' && styles.pendingCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.billNumber}>{billNumber}</Text>
          <View style={[styles.statusContainer, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{displayStatus}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.date}>Bill Date: {date}</Text>
          {dueDate ? <Text style={styles.dueDate}>Due: {dueDate}</Text> : null}
          <Text style={styles.amount}>₱{amount}</Text>
        </View>
      </Pressable>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Bill Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Bill Number</Text>
                <Text style={styles.value}>{billNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Amount</Text>
                <Text style={styles.value}>₱{amount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Status</Text>
                <Text style={[styles.value, { color: statusColor }]}>{displayStatus}</Text>
              </View>

              {dueDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Due Date</Text>
                  <Text style={styles.value}>{dueDate}</Text>
                </View>
              )}

              <Pressable onPress={closeModal} style={styles.textButton}>
                <Text style={styles.textButtonText}>Close</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#888888ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  pendingCard: {

  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billNumber: { fontWeight: 'bold', fontSize: 16 },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 8,
  },
  date: { color: '#555' },
  dueDate: { color: '#ff9900', marginTop: 3, fontWeight: '600' },
  amount: { marginTop: 6, fontSize: 16, fontWeight: '700' },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(198, 198, 198, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalContent: { gap: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#1a6a37' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  label: { fontSize: 16, color: '#6c757d', fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '700', color: '#212529' },

  textButton: { marginTop: 20, alignItems: 'center' },
  textButtonText: { color: "#a9a9a9ff", fontWeight: '600', fontSize: 16 },
});

export default BillCard;

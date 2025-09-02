import { db } from "config/firebaseConfig";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { AdminTransaction } from "functions/types";
import { createSingleUserNotification } from "./notificationFunctions"; // 👈 import notification helper

// Convert Firestore document to AdminTransaction
export const convertTransaction = (docSnap: any): AdminTransaction => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    receiptNumber: data.receiptNumber,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(),
    customerName: data.customerName,
    items: data.items || [],
    subtotal: data.subtotal || 0,
    tax: data.tax || 0,
    total: data.total || 0,
    paymentStatus: data.paymentStatus,
    amountPaid: data.amountPaid || 0,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
  };
};

// Fetch all transactions once
export const fetchTransactions = async (): Promise<AdminTransaction[]> => {
  const q = query(collection(db, "transactions"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertTransaction);
};

// Listen to transactions in real-time
export const listenTransactions = (callback: (transactions: AdminTransaction[]) => void) => {
  const q = query(collection(db, "transactions"), orderBy("date", "desc"));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map(convertTransaction)),
    (err) => console.error("Error fetching transactions:", err)
  );
  return unsubscribe;
};

// Update payment status + log change + notification
// Update payment status + log change + notification
export const updateTransactionPayment = async (
  transactionId: string,
  newStatus: AdminTransaction["paymentStatus"],
  amountPaid: number,
  paymentMethod?: AdminTransaction["paymentMethod"]
) => {
  const ref = doc(db, "transactions", transactionId);

  // 🔹 calculate change
  const snapBefore = await getDoc(ref);
  if (!snapBefore.exists()) {
    console.error("Transaction not found.");
    return;
  }
  const dataBefore = snapBefore.data();
  const total = dataBefore?.total || 0;
  const change = amountPaid > total ? amountPaid - total : 0;

  // 🔹 update transaction with change
  await updateDoc(ref, {
    paymentStatus: newStatus,
    amountPaid,
    paymentMethod: paymentMethod || null,
    change, // ✅ persist change in Firestore
  });

  // 🔹 fetch updated transaction
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.error("Transaction not found after update.");
    return;
  }
  const data = snap.data();

  // 🔹 create notification
  await createSingleUserNotification(
    data?.userId, // 👈 correct field
    "Payment Updated",
    `Your payment of ₱${amountPaid.toFixed(2)} via ${paymentMethod || "N/A"} was recorded. 
    Status: ${newStatus}. ${change > 0 ? `Change: ₱${change.toFixed(2)}` : ""}`,
    transactionId
  );

  console.log("✅ Payment updated, change stored, and notification created.");
};

/**
 * Calculates total sales from an array of AdminTransaction.
 * @param transactions - array of AdminTransaction
 * @returns total sales amount
 */
export function getTotalSalesTrans(transactions: AdminTransaction[]): number {
  return transactions.reduce((total, t) => total + (t.amountPaid || 0), 0);
}
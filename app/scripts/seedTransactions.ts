// app/scripts/seedTransactions.ts
import { db } from "config/firebaseConfig";
import { addDoc, collection, Timestamp } from "firebase/firestore";

export const seedTransactions = async () => {
  try {
    const transactionsRef = collection(db, "transactions");

    // Sample data
    const sampleTransactions = [
      {
        receiptNumber: "RCPT-1001",
        date: Timestamp.fromDate(new Date("2025-08-20T10:00:00Z")),
        customerName: "John Doe",
        items: [
          { id: "p1", name: "Apple", quantity: 3, price: 1.25, total: 3.75 },
          { id: "p2", name: "Banana", quantity: 2, price: 0.75, total: 1.50 },
        ],
        subtotal: 5.25,
        tax: 0.50,
        total: 5.75,
        paymentStatus: "Partially Paid",
        amountPaid: 3.0,
        paymentMethod: "Cash",
        notes: "Customer will pay remaining tomorrow",
      },
      {
        receiptNumber: "RCPT-1002",
        date: Timestamp.fromDate(new Date("2025-08-21T14:30:00Z")),
        customerName: "Jane Smith",
        items: [
          { id: "p3", name: "Orange", quantity: 4, price: 0.9, total: 3.6 },
        ],
        subtotal: 3.6,
        tax: 0.36,
        total: 3.96,
        paymentStatus: "Paid",
        amountPaid: 3.96,
        paymentMethod: "Card",
        notes: "",
      },
      {
        receiptNumber: "RCPT-1003",
        date: Timestamp.fromDate(new Date("2025-08-22T18:00:00Z")),
        customerName: "Mark Lee",
        items: [
          { id: "p1", name: "Apple", quantity: 1, price: 1.25, total: 1.25 },
          { id: "p4", name: "Grapes", quantity: 1, price: 2.5, total: 2.5 },
        ],
        subtotal: 3.75,
        tax: 0.38,
        total: 4.13,
        paymentStatus: "Unpaid",
        amountPaid: 0.0,
        paymentMethod: "Digital Wallet",
        notes: "Pending payment",
      },
    ];

    for (const tx of sampleTransactions) {
      await addDoc(transactionsRef, tx);
    }

    console.log("✅ Transactions seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding transactions:", error);
  }
};

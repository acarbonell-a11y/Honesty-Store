import { Timestamp } from "firebase/firestore";

export interface TransactionItemType {
  id: string ;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export type TransactionItemTypeDeduct = {
  id: string | { id: string };
  name: string;
  quantity: number;
  price: number;
  total: number;
};


export type PaymentStatus = "Paid" | "Partially Paid" | "Unpaid" | "Pending";
export type PaymentMethod = "Cash" | "Digital Wallet";

// Admin view transaction (id optional)
export interface AdminTransaction {
  id: string; // optional in admin view
  receiptNumber: string;
  date: Date;
  customerName?: string;
  userId?: string;
  items: TransactionItemType[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

// types/Product.ts
export interface Product {
  id: string;
  name: string;           // used in ProductModal form
  price: number;          // number (not string!)
  stock: number;
  category?: string;
  imageUrl?: string;
  image?: string;         // stored image URL
  status: "In stock" | "Low stock" | "Out of stock";         // in stock, low stock, out of stock
  lastUpdated?: Timestamp;      // Firestore Timestamp | FieldValue if needed
  createdAt?: Timestamp;
}

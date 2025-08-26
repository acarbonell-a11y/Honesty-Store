export interface TransactionItemType {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export type PaymentStatus = "Paid" | "Partially Paid" | "Unpaid";
export type PaymentMethod = "Cash" | "Card" | "Digital Wallet";

// Admin view transaction (id optional)
export interface AdminTransaction {
  id?: string; // optional in admin view
  receiptNumber: string;
  date: Date;
  customerName?: string;
  items: TransactionItemType[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

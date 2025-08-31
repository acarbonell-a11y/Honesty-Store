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
  items: TransactionItemType[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}


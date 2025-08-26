// reportsFunctions.ts
import { db } from "config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export interface ReportDataItem {
  name: string;
  value: string;
  subtitle?: string;
}

export interface ReportModalData {
  title: string;
  data: ReportDataItem[];
}

// --- 1. Fetch ALL transactions ---
export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  amountPaid: number;
  customerName: string;
  date: any; // timestamp
  items: TransactionItem[];
  paymentMethod: string;
  paymentStatus: string;
  receiptNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  userId?: string;
}

export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  const snapshot = await getDocs(collection(db, "transactions"));

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      amountPaid: data.amountPaid || 0,
      customerName: data.customerName || "",
      date: data.date || null,
      items: data.items || [],
      paymentMethod: data.paymentMethod || "",
      paymentStatus: data.paymentStatus || "",
      receiptNumber: data.receiptNumber || "",
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      userId: data.userId || "",
    };
  });
};

// --- 2. Fetch inventory ---
export const fetchInventory = async () => {
  const snapshot = await getDocs(collection(db, "inventory"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// --- 3. Compute Top Products ---
export const computeTopProducts = (transactions: any[]) => {
  const productCountMap: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (!tx.items) return;
    tx.items.forEach((item: any) => {
      const productName = item.name || "Unknown";
      productCountMap[productName] = (productCountMap[productName] || 0) + item.quantity;
    });
  });

  return Object.entries(productCountMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: value.toString() }));
};

// --- 4. Prepare Report Data ---
export const prepareReportData = async (userId: string) => {
  const transactions = await fetchAllTransactions();
  const inventory = await fetchInventory();

  const revenueData: ReportModalData = {
    title: "Revenue",
    data: transactions.map((tx) => ({
      name: tx.id,
      value: (tx.amountPaid || 0).toString(),
      subtitle: `Items: ${tx.items.map((i) => i.name).join(", ")}`,
    })),
  };

  const inventoryData: ReportModalData = {
    title: "Stock Movement",
    data: inventory.map((item: any) => ({
      name: item.name,
      value: (item.quantity || 0).toString(),
      subtitle: item.category || "",
    })),
  };

  const topProductsData: ReportModalData = {
    title: "Top Products",
    data: computeTopProducts(transactions),
  };

  return {
    revenue: revenueData,
    stockMovement: inventoryData,
    topProducts: topProductsData,
  };
};

// --- 5. Compute Report Stats ---
export const computeReportStats = (reportData: Record<string, ReportModalData>) => {
  const revenueData = reportData.revenue?.data || [];
  const topProductsData = reportData.topProducts?.data || [];
  const stockMovementData = reportData.stockMovement?.data || [];

  const totalSales = revenueData.reduce((acc, item) => {
    const numericValue = parseFloat(item.value.replace(/[^0-9.-]+/g, ""));
    return acc + (isNaN(numericValue) ? 0 : numericValue);
  }, 0);

  const topProducts = topProductsData.length;
  const lowStockItems = stockMovementData.filter((item) => parseInt(item.value) < 5).length;

  return { totalSales, topProducts, lowStockItems };
};

// --- 6. Export Reports as CSV ---
export const exportReportsAsCSV = (reportData: Record<string, ReportModalData>) => {
  const headers = ["Report", "Name", "Value", "Subtitle"];
  const rows: string[] = [headers.join(",")];

  Object.entries(reportData).forEach(([_, report]) => {
    report.data.forEach((item) => {
      const row = [report.title, item.name, item.value, item.subtitle || ""].map((v) =>
        `"${v.replace(/"/g, '""')}"`
      );
      rows.push(row.join(","));
    });
  });

  return rows.join("\n");
};

/**
 * Calculate total sales for a given month and year
 * @param transactions Array of all transactions
 * @param month Month index (0 = January, 11 = December)
 * @param year Full year (e.g., 2025)
 * @returns Total sales amount for that month
 */
export function getMonthlySales(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter((t) => {
      if (!t.date) return false;
      const date = t.date instanceof Date ? t.date : t.date.toDate?.(); // handle Firestore timestamp
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .reduce((sum, t) => sum + (t.total ?? 0), 0);
}
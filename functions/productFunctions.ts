import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { computeTopProducts, Transaction } from "./reportsFunctions";

export type BestSellingProduct = {
  name: string;
  price: number;
  sold: number;
};

/**
 * Calculate total sales (sum of all transaction totals)
 */
export const getTotalSalesProd = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, t) => sum + (t.total || 0), 0);
};

// --- New function to calculate total sales ---
export const getTotalSales = (transactions: Transaction[]): number => {
  return transactions.reduce((total, transaction) => total + (transaction.amountPaid || 0), 0);
};

// --- New function to calculate total revenue ---
export const getTotalRevenue = (transactions: Transaction[]): number => {
  return transactions.reduce((total, transaction) => total + (transaction.total || 0), 0);
};

// --- New function to get top products ---
export const getTopProducts = (transactions: Transaction[]): { name: string; value: string }[] => {
  return computeTopProducts(transactions);
};

export const getBestSellingProducts = async (limitCount = 5): Promise<BestSellingProduct[]> => {
  try {
    // 1️⃣ Fetch all transactions
    const transactionsSnapshot = await getDocs(collection(db, "transactions"));
    const transactions = transactionsSnapshot.docs.map(doc => doc.data() as any);

    // 2️⃣ Aggregate sold quantities
    const soldMap: Record<string, number> = {}; // key = inventory doc id
    for (const tx of transactions) {
      tx.items?.forEach((item: any) => {
        const id = item.id?.id || item.id; // reference object
        soldMap[id] = (soldMap[id] || 0) + item.quantity;
      });
    }

    // 3️⃣ Fetch all inventory items that were sold
    const bestSelling: BestSellingProduct[] = [];
    for (const [id, soldQty] of Object.entries(soldMap)) {
      const itemRef = doc(db, "inventory", id);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const data = itemSnap.data() as any;
        bestSelling.push({
          name: data.name,
          price: data.price,
          sold: soldQty,
        });
      }
    }

    // 4️⃣ Sort by sold quantity descending
    bestSelling.sort((a, b) => b.sold - a.sold);

    return bestSelling.slice(0, limitCount);
  } catch (err) {
    console.error("Error fetching best selling products:", err);
    return [];
  }
};

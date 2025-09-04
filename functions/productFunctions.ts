import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, increment, updateDoc } from "firebase/firestore";
import { Alert } from "react-native";
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

// addToCart
export const addToCart = async (productId: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const productRef = doc(db, "inventory", productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        Alert.alert("Error", "Product not found.");
        return;
      }

      const productData = productSnap.data();
      if (!productData.quantity || productData.quantity <= 0) {
        Alert.alert("Out of Stock", "This product is currently unavailable.");
        return;
      }

      const cartRef = collection(db, "users", user.uid, "cart");
      const cartSnap = await getDocs(cartRef);

      let cartDocRef;
      if (cartSnap.empty) {
        const newDoc = await addDoc(cartRef, { products: [] });
        cartDocRef = newDoc;
      } else {
        cartDocRef = cartSnap.docs[0].ref;
      }

      const cartDoc = cartSnap.empty ? null : cartSnap.docs[0];
      const currentProducts: { productId: string; quantity: number }[] = cartDoc
        ? cartDoc.data().products || []
        : [];

      const existingIndex = currentProducts.findIndex((p) => p.productId === productId);
      if (existingIndex !== -1) {
        currentProducts[existingIndex].quantity += 1;
      } else {
        currentProducts.push({ productId, quantity: 1 });
      }

      await updateDoc(cartDocRef, { products: currentProducts });
      setCartCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

function setCartCount(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.");
}

/**
 * Reduce the quantity of an item in inventory by a given amount.
 * @param itemId string - ID of the inventory document
 * @param amount number - Amount to reduce
 */
export const reduceInventory = async (itemId: string, amount: number) => {
  if (amount <= 0) {
    Alert.alert("Invalid Amount", "Amount to reduce must be greater than zero.");
    return;
  }

  try {
    const itemRef = doc(db, "inventory", itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      Alert.alert("Error", "Item not found in inventory.");
      return;
    }

    const currentQuantity = itemSnap.data().quantity || 0;

    if (currentQuantity < amount) {
      Alert.alert("Error", "Not enough stock to reduce by this amount.");
      return;
    }

    // Reduce quantity safely
    await updateDoc(itemRef, {
      quantity: increment(-amount) // Firestore atomic decrement
    });

    Alert.alert("Success", `Reduced ${amount} item(s) from inventory.`);
  } catch (error) {
    console.error("Error reducing inventory:", error);
    Alert.alert("Error", "Something went wrong while updating inventory.");
  }
};

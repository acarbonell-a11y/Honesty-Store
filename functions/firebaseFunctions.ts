// app/functions/authFunctions.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { loginUser, signUpUser, } from "../services/authServices";
import { createUserProfile, getUserProfile } from "../services/userServices";


//this handles the setup for new users in the Firebase Database
export const handleSignUp = async (email: string, password: string, name: string) => {
  const userCredential = await signUpUser(email, password);
  const uid = userCredential.user.uid;

  await createUserProfile(uid, name, email);
  return userCredential.user;
};

//This handles the Authentication for Logging in/Signing in (Custom)
export const handleLogin = async (email: string, password: string) => {
  const userCredential = await loginUser(email, password);
  const uid = userCredential.user.uid;

  const profile = await getUserProfile(uid);
  return { ...userCredential.user, profile };
};

// Define types for your data to ensure type safety.
export type InventoryItem = {
  name: string;
  description: string;
  price: number;
  quantity: number;
  sku: string;
  lowStockThreshold: number;
  supplier: {
    name: string;
    contact: string;
  };
};

export type Transaction = {
  transactionType: "sale" | "purchase";
  totalAmount: number;
  items: {
    itemId: string;
    quantity: number;
    priceAtTimeOfSale: number;
  }[];
  userId: string;

  // New fields for your Bill UI
  receiptNumber: string;
  amountPaid: number;
  date: any; // Firestore timestamp
  paymentStatus: "Paid" | "Pending";
};


/**
 * INVENTORY FUNCTIONS
 */
const inventoryCollection = collection(db, "inventory");

export const addInventoryItem = async (item: InventoryItem): Promise<string | null> => {
  try {
    const docRef = await addDoc(inventoryCollection, {
      ...item,
      lastUpdated: serverTimestamp(),
    });
    console.log("Item added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    return null;
  }
};

export const updateInventoryItem = async (
  itemId: string,
  updatedData: Partial<InventoryItem>
): Promise<void> => {
  try {
    const itemRef = doc(db, "inventory", itemId);
    await updateDoc(itemRef, {
      ...updatedData,
      lastUpdated: serverTimestamp(),
    });
    console.log("Item updated successfully");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
};

export const getInventoryItem = async (
  itemId: string
): Promise<(InventoryItem & { id: string }) | null> => {
  try {
    const itemRef = doc(db, "inventory", itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      return { id: itemSnap.id, ...(itemSnap.data() as InventoryItem) };
    } else {
      console.log("No such item exists!");
      return null;
    }
  } catch (error) {
    console.error("Error getting item: ", error);
    return null;
  }
};

export const getInventory = async (): Promise<(InventoryItem & { id: string })[]> => {
  try {
    const snapshot = await getDocs(inventoryCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as InventoryItem) }));
  } catch (error) {
    console.error("Error getting inventory: ", error);
    return [];
  }
};

/**
 * TRANSACTION FUNCTIONS
 */
const transactionsCollection = collection(db, "transactions");

export const addTransaction = async (
  transaction: Omit<Transaction, "timestamp">
): Promise<string | null> => {
  try {
    const docRef = await addDoc(transactionsCollection, {
      ...transaction,
      timestamp: serverTimestamp(),
    });
    console.log("Transaction added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding transaction: ", error);
    return null;
  }
};

export const getTransactionsForUser = async (
  userId: string
): Promise<(Transaction & { id: string })[]> => {
  try {
    const q = query(
      transactionsCollection,
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Transaction),
    }));
  } catch (error) {
    console.error("Error getting user transactions:", error);
    return [];
  }
};


export const getLatestTransaction = async (): Promise<(Transaction & { id: string }) | null> => {
  try {
    const q = query(
      transactionsCollection,
      orderBy("date", "desc"), // latest first
      limit(1)                 // only one document
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as Transaction) };
  } catch (error) {
    console.error("Error getting latest transaction: ", error);
    return null;
  }
};

/**
 * Fetch all transactions in the collection and return with id
 */
export const getAllTransactions = async (): Promise<(Transaction & { id: string })[]> => {
  try {
    const q = query(transactionsCollection, orderBy("date", "desc")); // latest first
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Transaction) }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
};
//for specific user Transactions
export const getUserTransactions = async (uid: string) => {
  const q = query(collection(db, "transactions"), where("userId", "==", uid));
  const querySnapshot = await getDocs(q);
  const transactions: any[] = [];
  querySnapshot.forEach((doc) => {
    transactions.push({ id: doc.id, ...doc.data() });
  });
  return transactions;
};

//BackupGetUser:
export const getUserProfileFireBase = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid); // users collection
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data(); // { name: string, email: string, ... }
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export { db };


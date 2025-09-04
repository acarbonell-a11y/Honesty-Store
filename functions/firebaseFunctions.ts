// app/functions/authFunctions.ts
import axios from "axios";
import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  FieldValue,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Alert } from "react-native";
import { db } from "../config/firebaseConfig";
import { loginUser, signUpUser, } from "../services/authServices";
import { createUserProfile, getUserProfile } from "../services/userServices";
import { createProductNotification } from "./notificationFunctions";

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
  lowStockThreshold: number ;
  category?: string;
  status?: string;
  imageUrl?: string;
  lastUpdated: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
};


export type Transaction = {
  amountPaid: number;
  customerName: string;
  date: any;
  dueDate: Date;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    priceAtTimeOfSale: number;
  }[];
  notes: string;
  paymentMethod: string;
  paymentStatus: string;
  receiptNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  userId: string;
  userRef: DocumentReference;
};

/**
 * Upload image to Cloudinary and return secure URL
 */
export const uploadImageToCloudinary = async (uri: string): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", { uri, type: "image/jpeg", name: "product.jpg" } as any);
    formData.append("upload_preset", "shopnesty");

    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/dagwspffq/image/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data.secure_url; // ✅ Cloudinary URL
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    Alert.alert("Upload Failed", "Could not upload image. Please try again.");
    return null;
  }
};

const inventoryCollection = collection(db, "inventory");

/**
 * Add a new inventory item
 */
export const addInventoryItem = async (item: InventoryItem, imageUri?: string): Promise<string | null> => {
  try {
    let imageUrl: string | null = null;

    if (imageUri) {
      const uploadedUrl = await uploadImageToCloudinary(imageUri);
      if (!uploadedUrl) return null; // Stop if upload fails
      imageUrl = uploadedUrl;
    }

    const docRef = await addDoc(inventoryCollection, {
      ...item,
      imageUrl,
      lastUpdated: serverTimestamp(),
    });

    await createProductNotification(
      docRef.id,
      "New Product Added",
      `A new product "${item.name}" has been added to the inventory.`
    );

    console.log("Item added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return null;
  }
};

/**
 * Update an existing inventory item
 */
export const updateInventoryItem = async (
  itemId: string,
  updatedData: Partial<InventoryItem>,
  imageUri?: string
): Promise<void> => {
  try {
    const itemRef = doc(db, "inventory", itemId);

    // Get previous state
    const prevSnap = await getDoc(itemRef);
    const prevData = prevSnap.exists() ? (prevSnap.data() as InventoryItem) : null;

    // Upload new image if provided
    let imageUrl = updatedData.imageUrl ?? prevData?.imageUrl ?? null;
    if (imageUri) {
      const uploadedUrl = await uploadImageToCloudinary(imageUri);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    await updateDoc(itemRef, {
      ...updatedData,
      imageUrl,
      lastUpdated: serverTimestamp(),
    });

    console.log("Item updated successfully");

    // Notify if quantity increased (restocked)
    if (prevData && updatedData.quantity && updatedData.quantity > prevData.quantity) {
      const title = "Product Restocked";
      const message = `${updatedData.name || prevData.name} has been restocked. New quantity: ${updatedData.quantity}`;
      await createProductNotification(itemId, title, message);
    }
  } catch (error) {
    console.error("Error updating inventory item:", error);
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


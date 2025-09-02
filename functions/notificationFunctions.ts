// app/functions/notificationFunctions.ts
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// Notification type definition
export type Notification = {
  type: "payment" | "product";       // type of notification
  title: string;                     // short title
  message: string;                   // detailed message
  userIds?: string[];                // for user-specific notifications
  productId?: string;                // optional, for product notifications
  transactionId?: string;            // optional, for payment notifications
  readBy?: string[];                 // list of users who have read
  createdAt?: any;                   // Firestore timestamp
  expiresAt?: any;                   // optional timestamp for cleanup
};

// Reference to notifications collection
const notificationsCollection = collection(db, "notifications");

/**
 * Create a user-specific notification
 * e.g., payment processed
 */
export const createUserNotification = async (
  userId: string,
  title: string,
  message: string,
  transactionId?: string
): Promise<string | null> => {
  try {
    const docRef = await addDoc(notificationsCollection, {
      type: "payment",
      title,
      message,
      userIds: [userId],
      transactionId: transactionId || null,
      readBy: [],
      createdAt: serverTimestamp(),
    });
    console.log("User notification created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating user notification:", error);
    return null;
  }
};

/**
 * Create a global product notification
 * e.g., product restocked
 */
export const createProductNotification = async (
  productId: string,
  title: string,
  message: string
): Promise<string | null> => {
  try {
    const docRef = await addDoc(notificationsCollection, {
      type: "product",
      title,
      message,
      productId,
      userIds: ["global"], // <-- use "global" instead of empty array
      readBy: [],
      createdAt: serverTimestamp(),
    });
    console.log("Product notification created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating product notification:", error);
    return null;
  }
};

/**
 * Mark a GLOBAL notification as read by a user
 */
export const markGlobalNotificationRead = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  try {
    const notifRef = doc(db, "notifications", notificationId);

    // Fetch current readBy
    const docSnap = await getDoc(notifRef);
    const currentReadBy = docSnap.exists() ? docSnap.data().readBy || [] : [];

    if (!currentReadBy.includes(userId)) {
      await updateDoc(notifRef, {
        readBy: arrayUnion(userId), // <-- important: arrayUnion instead of spread
      });
      console.log(`🌍 Global notification ${notificationId} marked as read by ${userId}`);
    }
  } catch (error) {
    console.error("❌ Error marking global notification as read:", error);
  }
};

/**
 * Mark a USER-SPECIFIC notification as read
 */
export const markSingleUserNotificationRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    const notifRef = doc(db, "users", userId, "notifications", notificationId);

    // Use setDoc with merge:true to ensure doc exists and only update `read`
    await setDoc(notifRef, { read: true }, { merge: true });

    console.log(`👤 User notification ${notificationId} marked as read for ${userId}`);
  } catch (error) {
    console.error("❌ Error marking single-user notification as read:", error);
  }
};


/**
 * Helper: fetch current readBy array
 */
const getCurrentReadBy = async (notifRef: any): Promise<string[]> => {
  try {
    const snap = await getDoc(notifRef);
    if (!snap.exists()) return [];

    // Cast data to Notification type
    const data = snap.data() as Notification;

    return data.readBy || [];
  } catch (error) {
    console.error("Error fetching readBy array:", error);
    return [];
  }
};

/**
 * Creates a notification for a specific user under:
 * users/{userId}/notifications/{notifId}
 */
export const createSingleUserNotification = async (
  userId: string,
  title: string,
  message: string,
  transactionId?: string
) => {
  if (!userId) {
    console.error("❌ No userId provided, cannot create notification.");
    return;
  }

  try {
    const notifRef = collection(db, "users", userId, "notifications");
    await addDoc(notifRef, {
      title,
      message,
      transactionId: transactionId || null,
      createdAt: serverTimestamp(),
      read: false,
    });
    console.log(`✅ Notification created for user ${userId}`);
  } catch (error) {
    console.error("❌ Error creating single user notification:", error);
  }
};
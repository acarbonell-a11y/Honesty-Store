import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "config/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { getUserProfileFireBase, getUserTransactions, uploadImageToCloudinary } from "functions/firebaseFunctions";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Alert,
  Animated,
  FlatList,
  Modal,
  Modal,
  Pressable,
  RefreshControl,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";

type Transaction = {
  id: string;
  title: string;
  amount: number;
  status: "Paid" | "Unpaid";
  time: string;
  time: string;
};

const ProfileScreen = () => {
  const scaleRight = useRef(new Animated.Value(1)).current;
  const scaleProfile = useRef(new Animated.Value(1)).current;

  const scaleProfile = useRef(new Animated.Value(1)).current;

  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceToPay, setBalanceToPay] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(
    "https://via.placeholder.com/150?text=User"
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Animated values for list items
  const listAnimValues = useRef<Animated.Value[]>([]).current;

  // Fetch user profile + transactions
  const fetchUserData = async () => {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const profile = await getUserProfileFireBase(uid);
    if (profile) {
  setUserData({ name: profile.name, email: profile.email });
  if (profile.profileImage) setProfileImage(profile.profileImage); // ✅ show uploaded image
}


    const userTransactions = await getUserTransactions(uid);
    const mappedTransactions: Transaction[] = userTransactions.map((tx: any) => ({
      id: tx.id,
      title: tx.items?.[0]?.name || "Transaction",
      amount: Number(tx.total || 0),
      status: tx.paymentStatus === "Paid" ? "Paid" : "Unpaid",
      time: tx.date?.toDate
        ? tx.date.toDate().toISOString() // keep sortable
        : new Date().toISOString(),
    }));

    // ✅ Sort: unpaid first, then paid. Within each, latest date first.
    mappedTransactions.sort((a, b) => {
      if (a.status === b.status) {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      }
      return a.status === "Unpaid" ? -1 : 1;
    });

    setTransactions(
      mappedTransactions.map((t) => ({
        ...t,
        time: new Date(t.time).toLocaleDateString(), // format back for UI
      }))
    );

    const unpaid = mappedTransactions
      .filter((t) => t.status === "Unpaid")
      .reduce((sum, t) => sum + t.amount, 0);
    setBalanceToPay(unpaid);

    // Prepare animations
    listAnimValues.splice(0, listAnimValues.length); // reset
    mappedTransactions.forEach(() => listAnimValues.push(new Animated.Value(0)));

    Animated.stagger(
      120,
      listAnimValues.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      )
    ).start();
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};


  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, []);

  // Animation helpers
  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  // Pick image from gallery
const pickFromGallery = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission Denied", "We need camera roll permissions.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;

    // Upload to Cloudinary
    const uploadedUrl = await uploadImageToCloudinary(uri);
    if (uploadedUrl) {
      setProfileImage(uploadedUrl);

      // Save to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "users", uid), { profileImage: uploadedUrl });
      }
    }
  }

  setModalVisible(false);
};

// Take photo with camera
const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission Denied", "We need camera permissions.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;

    // Upload to Cloudinary
    const uploadedUrl = await uploadImageToCloudinary(uri);
    if (uploadedUrl) {
      setProfileImage(uploadedUrl);

      // Save to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "users", uid), { profileImage: uploadedUrl });
      }
    }
  }

  setModalVisible(false);
};


  const renderIcon = (
    iconName: React.ComponentProps<typeof Ionicons>["name"],
    scale: Animated.Value,
    onPress?: () => void
  ) => (
    <Pressable
      onPress={onPress}
      onPressIn={() => handlePressIn(scale)}
      onPressOut={() => handlePressOut(scale)}
      style={styles.iconWrapper}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={iconName} size={28} color="#000" />
      </Animated.View>
    </Pressable>
  );

  const renderHistoryItem = ({ item, index }: { item: Transaction; index: number }) => {
    const animStyle = {
      opacity: listAnimValues[index] || new Animated.Value(1),
      transform: [
        {
          translateY: (listAnimValues[index] || new Animated.Value(1)).interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.historyCard, animStyle]}>
        <View style={styles.historyLeft}>
          <Ionicons
            name={item.status === "Paid" ? "checkmark-circle-outline" : "alert-circle-outline"}
            size={28}
            color={item.status === "Paid" ? "#1a6a37" : "#d9534f"}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historyTime}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.historyRight}>
          <Text style={styles.historyAmount}>₱{item.amount.toLocaleString()}</Text>
          <Text
            style={[
              styles.historyStatus,
              { color: item.status === "Paid" ? "#1a6a37" : "#d9534f" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {renderIcon("settings-outline", scaleRight, () =>
          router.push("/(main)/(users)/(userHidComps)/Settings")
        )}
          router.push("/(main)/(users)/(userHidComps)/Settings")
        )}
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Pressable
          style={styles.avatarContainer}
          onPress={() => {
            handlePressIn(scaleProfile);
            setModalVisible(true);
          }}
          onPressOut={() => handlePressOut(scaleProfile)}
        >
          <Animated.Image
            source={{ uri: profileImage }}
            style={[styles.avatar, { transform: [{ scale: scaleProfile }] }]}
          />
        </Pressable>
        <Text style={styles.name}>{userData?.name || "Loading..."}</Text>
        <Text style={styles.email}>{userData?.email || ""}</Text>
      </View>

      {/* Balance */}
      <View style={styles.balanceCard}>
        <Ionicons name="wallet-outline" size={32} color="#1a6a37" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.balanceLabel}>Balance to Pay</Text>
          <Text style={styles.balanceAmount}>₱{balanceToPay.toLocaleString()}</Text>
        </View>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>Payment History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            <Pressable style={styles.modalButton} onPress={pickFromGallery}>
              <Text style={styles.modalButtonText}>Select from Gallery</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={takePhoto}>
              <Text style={styles.modalButtonText}>Take a Picture</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: "#ccc" }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: "#000" }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 17, paddingTop: 45 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  title: { fontWeight: "800", color: "#000", fontSize: 30 },
  iconWrapper: { marginHorizontal: 10 },
  profileSection: { alignItems: "center", marginVertical: 20 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#1a6a37",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  name: { fontSize: 22, fontWeight: "bold", color: "#1a6a37" },
  email: { fontSize: 16, color: "#555" },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f9f6",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 16, fontWeight: "600", color: "#444" },
  balanceAmount: { fontSize: 22, fontWeight: "800", color: "#1a6a37" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#000", marginBottom: 10 },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  historyLeft: { flexDirection: "row", alignItems: "center" },
  historyTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  historyTime: { fontSize: 12, color: "#666" },
  historyRight: { alignItems: "flex-end" },
  historyAmount: { fontSize: 14, fontWeight: "700", color: "#111" },
  historyStatus: { fontSize: 12, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  modalButton: { padding: 15, borderRadius: 10, backgroundColor: "#1a6a37", marginVertical: 5 },
  modalButtonText: { color: "#fff", fontWeight: "600", textAlign: "center" },
});

export default ProfileScreen;

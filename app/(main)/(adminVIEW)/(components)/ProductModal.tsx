import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { addInventoryItem, InventoryItem, updateInventoryItem } from "functions/firebaseFunctions";
import { Product } from "functions/types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ms, s, vs } from "react-native-size-matters";

interface ProductModalProps {
  visible: boolean;
  product: Product | null;
  onSave: (
    product: Omit<Product, "id" | "status" | "lastUpdated"> & {
      imageUri?: string;
    }
  ) => void;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CATEGORIES = [
  "Beverages",
  "Food",
  "Dairy",
  "Snacks",
  "Supplies",
  "Others",
];
const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/100?text=No+Image";

export default function ProductModal({
  visible,
  product,
  onSave,
  onClose,
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setCategory(product.category || "");
      setImageUri((product as any).imageUri || null);
    } else {
      setName("");
      setPrice("");
      setStock("");
      setCategory("");
      setImageUri(null);
    }
    setErrors({});
  }, [product, visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Product name is required";

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0)
      newErrors.price = "Valid price is required";

    const stockNum = parseInt(stock);
    if (!stock || isNaN(stockNum) || stockNum < 0)
      newErrors.stock = "Valid stock quantity is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async (camera: boolean) => {
    let result;
    if (camera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
    }

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageToCloudinary = async (
    uri: string
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append(
        "file",
        { uri, type: "image/jpeg", name: "product.jpg" } as any
      );
      formData.append("upload_preset", "shopnesty");

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dagwspffq/image/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      Alert.alert(
        "Upload Failed",
        "Could not upload image. Please try again."
      );
      return null;
    }
  };

  const handleSave = async () => {
  if (!validateForm()) return;

  setLoading(true);

  try {
    // Upload image if there's a new local image
    let uploadedImageUrl: string | undefined = undefined;
    if (imageUri && (!product || imageUri !== (product as any).imageUrl)) {
      const url = await uploadImageToCloudinary(imageUri);
      if (!url) {
        setLoading(false);
        return; // stop if upload fails
      }
      uploadedImageUrl = url;
    } else if (product) {
      uploadedImageUrl = (product as any).imageUrl; // keep existing URL
    }

    const itemData: InventoryItem = {
      name,
      price: parseFloat(price),
      quantity: parseInt(stock),
      category: category || "",
      description: "", // default empty
      sku: "", // default empty
      lowStockThreshold: 5, // default threshold
      supplier: {
        name: "",
        contact: "",
      },
      imageUrl: uploadedImageUrl,
    };

    if (product) {
      // Updating existing product
      await updateInventoryItem(product.id, itemData);
      Alert.alert("Success", `Product "${name}" updated successfully`);
    } else {
      // Adding new product
      await addInventoryItem(itemData);
      Alert.alert("Success", `Product "${name}" added successfully`);
    }

    onClose();
  } catch (error) {
    console.error("Error saving product:", error);
    Alert.alert("Error", "Failed to save product. Please try again.");
  }

  setLoading(false);
};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {product ? "Edit Product" : "Add New Product"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Preview */}
            <Image
              source={{ uri: imageUri || PLACEHOLDER_IMAGE }}
              style={styles.previewImage}
            />

            <View
              style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}
            >
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(false)}
              >
                <Text style={styles.imageButtonText}>Pick Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(true)}
              >
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter product name"
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Price & Stock */}
            <View style={styles.inputRow}>
              <View
                style={[styles.inputGroup, { flex: 1, marginRight: s(8) }]}
              >
                <Text style={styles.inputLabel}>Price ($) *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.price && styles.inputError,
                  ]}
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
                {errors.price && (
                  <Text style={styles.errorText}>{errors.price}</Text>
                )}
              </View>

              <View
                style={[styles.inputGroup, { flex: 1, marginLeft: s(8) }]}
              >
                <Text style={styles.inputLabel}>Stock *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.stock && styles.inputError,
                  ]}
                  placeholder="0"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {errors.stock && (
                  <Text style={styles.errorText}>{errors.stock}</Text>
                )}
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.selectedCategoryButton,
                    ]}
                    onPress={() =>
                      setCategory(category === cat ? "" : cat)
                    }
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat &&
                          styles.selectedCategoryButtonText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {product ? "Update" : "Save"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: vs(20),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: "700",
    color: "#212529",
  },
  closeButton: {
    padding: s(4),
  },
  formContainer: {
    paddingHorizontal: s(20),
    paddingTop: vs(20),
  },
  inputGroup: {
    marginBottom: vs(20),
  },
  inputRow: {
    flexDirection: "row",
  },
  inputLabel: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#495057",
    marginBottom: vs(8),
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: ms(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    fontSize: ms(16),
    backgroundColor: "#f8f9fa",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  errorText: {
    fontSize: ms(12),
    color: "#dc3545",
    marginTop: vs(4),
  },
  categoryContainer: {
    flexDirection: "row",
  },
  categoryButton: {
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    backgroundColor: "#e9ecef",
    marginRight: s(8),
  },
  selectedCategoryButton: {
    backgroundColor: "#1a6a37",
  },
  categoryButtonText: {
    fontSize: ms(14),
    color: "#6c757d",
    fontWeight: "500",
  },
  selectedCategoryButtonText: {
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: s(20),
    paddingTop: vs(20),
    gap: s(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: vs(14),
    borderRadius: ms(8),
    backgroundColor: "#6c757d",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: vs(14),
    borderRadius: ms(8),
    backgroundColor: "#1a6a37",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "600",
    marginLeft: s(4),
  },
  imageButton: {
    flex: 1,
    paddingVertical: vs(10),
    borderRadius: ms(8),
    backgroundColor: "#6c757d",
    alignItems: "center",
    justifyContent: "center",
  },
  imageButtonText: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: vs(150),
    borderRadius: ms(12),
    marginBottom: vs(12),
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
  },
});

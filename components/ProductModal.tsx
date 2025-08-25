import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
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
import { Product } from "../admin/inventory";

interface ProductModalProps {
  visible: boolean;
  product: Product | null;
  onSave: (product: Omit<Product, 'id' | 'status' | 'lastUpdated'>) => void;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORIES = ["Beverages", "Food", "Dairy", "Snacks", "Supplies", "Other"];

export default function ProductModal({ visible, product, onSave, onClose }: ProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setCategory(product.category || "");
    } else {
      setName("");
      setPrice("");
      setStock("");
      setCategory("");
    }
    setErrors({});
  }, [product, visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Product name is required";
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = "Valid price is required";
    }

    const stockNum = parseInt(stock);
    if (!stock || isNaN(stockNum) || stockNum < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    onSave({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || undefined,
    });
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

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter product name"
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: s(8) }]}>
                <Text style={styles.inputLabel}>Price ($) *</Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: s(8) }]}>
                <Text style={styles.inputLabel}>Stock *</Text>
                <TextInput
                  style={[styles.input, errors.stock && styles.inputError]}
                  placeholder="0"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.selectedCategoryButton,
                    ]}
                    onPress={() => setCategory(category === cat ? "" : cat)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat && styles.selectedCategoryButtonText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {product ? "Update" : "Save"}
              </Text>
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
});
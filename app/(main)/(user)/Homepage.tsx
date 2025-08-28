import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ProductCard from '../UserComponent/ProductCard';
import SearchBar from '../UserComponent/SearchBar';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const screenWidth = Dimensions.get('window').width;
const horizontalPadding = 34; // 17 left + 17 right
const columnGap = 15; // space between cards
const numColumns = 2;
const cardWidth = (screenWidth - horizontalPadding - columnGap) / numColumns;

const Homepage = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();
  const scaleLeft = useRef(new Animated.Value(1)).current;
  const scaleRight = useRef(new Animated.Value(1)).current;

  const allProducts: Product[] = [
    { id: '1', name: 'Nike Air Max', price: '120', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368208/download_8_iyjzbr.jpg', category: 'Snacks' },
    { id: '2', name: 'Adidas Ultraboost', price: '150', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368209/shoes_pmrqwf.jpg', category: 'Snacks' },
    { id: '3', name: 'Puma RS-X', price: '110', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368209/download_4_m34xv3.jpg', category: 'Snacks' },
    { id: '4', name: 'Cola', price: '1.5', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368209/download_1_ukjojf.jpg', category: 'Beverages' },
    { id: '5', name: 'Orange Juice', price: '2', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368209/download_5_y7rbb2.jpg', category: 'Beverages' },
    { id: '6', name: 'Coffee', price: '3', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368208/download_7_jh4ftm.jpg', category: 'Beverages' },
    { id: '7', name: 'Instant Noodles', price: '1', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368208/download_6_ah9d2q.jpg', category: 'Noodles' },
    { id: '8', name: 'Choco Biscuit', price: '0.8', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368209/download_2_hcktjf.jpg', category: 'Biscuits' },
    { id: '9', name: 'Lollipop', price: '0.5', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368209/download_3_nl0ttm.jpg', category: 'Candy' },
    { id: '10', name: 'Canned Tuna', price: '2.5', image: 'https://res.cloudinary.com/dagwspffq/image/upload/v1756368208/download_9_du32lb.jpg', category: 'Canned Goods' },
    // add remaining products as needed...
  ];

  const categories: Category[] = [
    { id: '1', name: 'Snacks', icon: 'pizza-outline' },
    { id: '2', name: 'Beverages', icon: 'cafe-outline' },
    { id: '3', name: 'Noodles', icon: 'fast-food-outline' },
    { id: '4', name: 'Biscuits', icon: 'nutrition-outline' },
    { id: '5', name: 'Candy', icon: 'ice-cream-outline' },
    { id: '6', name: 'Canned Goods', icon: 'beer-outline' },
  ];

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const renderIcon = (
    iconName: React.ComponentProps<typeof Ionicons>['name'],
    badgeCount: number,
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
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );

  const filteredProducts = selectedCategory
    ? allProducts.filter(p => p.category === selectedCategory)
    : allProducts;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shopnesty</Text>
        <View style={styles.iconContainer}>
          {renderIcon('notifications-outline', 5, scaleLeft, () =>
            router.push("/(main)/NotifacationScreen")
          )}
          {renderIcon('cart-outline', 2, scaleRight, () =>
            router.push("/(main)/CartScreen")
          )}
        </View>
      </View>

      {/* Search */}
      <SearchBar value={searchText} onChangeText={setSearchText} />

      {/* Categories */}
      <View style={{ marginBottom: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 0 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedCategory(item.name)}
              style={{ marginRight: 25, alignItems: 'center' }}
            >
              <Ionicons name={item.icon as any} size={28} color="#1a6a37" />
              <Text style={{ marginTop: 5, fontWeight: '600', color: '#333' }}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Products Grid */}
      <View style={{ flex: 1 }}>
        {selectedCategory && (
          <Pressable
            onPress={() => setSelectedCategory(null)}
            style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="chevron-back" size={28} color="#1a6a37" />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1a6a37', marginLeft: 5 }}>
              {selectedCategory}
            </Text>
          </Pressable>
        )}

        {/* Product List Title */}
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1a6a37', marginBottom: 10 }}>
          {selectedCategory ? `${selectedCategory} Products` : 'All Products'}
        </Text>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 15 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <ProductCard
                title={item.name}
                description={`This is ${item.name}`}
                price={item.price}
                stock={5}
                category={item.category}
                image={item.image}
                onAddToCart={() => console.log(`Added ${item.name} to cart`)}
                onBuyNow={() => console.log(`Buy ${item.name} now`)}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 17, paddingTop: 45 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontWeight: '800', color: '#000', fontSize: 30 },
  iconContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconWrapper: { marginHorizontal: 10 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#1a6a37', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
});

export default Homepage;

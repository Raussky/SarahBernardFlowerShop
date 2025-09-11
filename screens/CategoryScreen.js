import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator, // Keep ActivityIndicator for initial full screen load if needed
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';
import SkeletonLoader from '../src/components/SkeletonLoader'; // Import SkeletonLoader

const CategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category?.id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name, name_en), product_variants(*)')
          .eq('category_id', category.id);
        
        if (error) throw error;
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products for category:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <SkeletonLoader width={150} height={20} borderRadius={4} />
          <SkeletonLoader width={24} height={24} borderRadius={12} />
        </View>

        <View style={styles.categoryHeader}>
          <SkeletonLoader width={80} height={80} borderRadius={40} style={{ marginBottom: 10 }} />
          <SkeletonLoader width={'70%'} height={14} borderRadius={4} />
        </View>

        <View style={styles.sortBar}>
          <SkeletonLoader width={100} height={14} borderRadius={4} />
          <SkeletonLoader width={100} height={20} borderRadius={4} />
        </View>

        <FlatList
          data={[...Array(6)]} // Render 6 skeleton cards
          renderItem={({ item }) => (
            <View style={styles.productCardSkeleton}>
              <SkeletonLoader width={'100%'} height={180} borderRadius={15} />
              <View style={{ padding: 12 }}>
                <SkeletonLoader width={'80%'} height={15} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonLoader width={'60%'} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={'50%'} height={16} borderRadius={4} />
              </View>
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name || category.name_en}</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryHeader}>
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryEmoji}>{category.icon}</Text>
        </View>
        <Text style={styles.categoryDescription}>
          Выберите из нашей коллекции {category.name?.toLowerCase() || category.name_en.toLowerCase()}
        </Text>
      </View>

      <View style={styles.sortBar}>
        <Text style={styles.productCount}>{products.length} товаров</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Сортировка</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryEmoji: {
    fontSize: 40,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCardSkeleton: {
    width: 160, // Adjust to match ProductCard width
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
});

export default CategoryScreen;
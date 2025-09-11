import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';

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
          .select('*, product_variants(*)')
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
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
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
});

export default CategoryScreen;
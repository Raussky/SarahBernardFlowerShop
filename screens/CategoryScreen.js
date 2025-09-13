import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';
import SkeletonLoader from '../src/components/SkeletonLoader';
import { FONTS } from '../src/config/theme';

const CategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState({ column: 'created_at', ascending: false, label: 'По новизне' });

  const sortOptions = [
    { column: 'created_at', ascending: false, label: 'По новизне' },
    { column: 'name', ascending: true, label: 'По названию (А-Я)' },
    { column: 'name', ascending: false, label: 'По названию (Я-А)' },
    { column: 'product_variants.price', ascending: true, label: 'По цене (возрастание)' },
    { column: 'product_variants.price', ascending: false, label: 'По цене (убывание)' },
    { column: 'purchase_count', ascending: false, label: 'По популярности' },
  ];

  const fetchProducts = useCallback(async () => {
    if (!category?.id) return;

    // To sort by a value in a related table (price in product_variants),
    // we need to use a Postgres function (RPC).
    // This function will fetch products and sort them correctly in the database.
    const rpcFn = 'get_products_by_category_sorted';
    
    try {
      const { data, error } = await supabase.rpc(rpcFn, {
        p_category_id: category.id,
        sort_column: sortOption.column,
        sort_direction: sortOption.ascending ? 'ASC' : 'DESC'
      });

      if (error) throw error;

      // The RPC function is expected to return data in the same shape as the previous query.
      // Supabase automatically nests the related records.
      setProducts(data);

    } catch (error) {
      console.error("Error fetching products for category:", error);
    } finally {
      setLoading(false);
    }
  }, [category, sortOption]);

 useFocusEffect(
   useCallback(() => {
     setLoading(true);
     fetchProducts();
   }, [fetchProducts])
 );

  useEffect(() => {
    const channel = supabase
      .channel(`public:products:category_id=eq.${category.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `category_id=eq.${category.id}` }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, fetchProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts, category.id]);

  const handleSortSelect = (option) => {
    setSortOption(option);
    setSortModalVisible(false);
  };

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
          data={[...Array(6)]}
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
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.sortText}>{sortOption.label}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={80} color="#999" />
          <Text style={styles.emptyText}>В этой категории пока нет товаров.</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
            <Text style={styles.shopButtonText}>Вернуться на главную</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModalContent}>
            <Text style={styles.modalTitle}>Сортировать по</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={styles.modalOption}
                onPress={() => handleSortSelect(option)}
              >
                <Text style={[styles.modalOptionText, sortOption.label === option.label && styles.activeModalOptionText]}>
                  {option.label}
                </Text>
                {sortOption.label === option.label && <Ionicons name="checkmark" size={20} color="#FF69B4" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.regular,
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
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  activeModalOptionText: {
    fontWeight: 'bold',
    color: '#FF69B4',
  },
});

export default CategoryScreen;
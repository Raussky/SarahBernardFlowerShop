import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../src/components/ProductCard';
import FilterModal from '../src/components/FilterModal'; // Import FilterModal
import { FONTS } from '../src/config/theme';
import { supabase } from '../src/integrations/supabase/client';
import EmptyState from '../src/components/EmptyState';
import { logger } from '../src/utils/logger';

const FilterResultsScreen = ({ route, navigation }) => {
  const { filteredProducts: initialProducts, title = 'Результаты фильтра', specialFilter } = route.params;
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(true); // Set loading to true initially
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchFilteredProducts = useCallback(async () => {
    logger.info('Fetching filtered products', { context: 'FilterResultsScreen', specialFilter, minPrice, maxPrice });
    setLoading(true);
    let query = supabase.from('products').select('*, categories(name, name_en), product_variants(*)'); // Fetch relations

    if (specialFilter === 'bestsellers') {
      query = supabase.rpc('get_best_sellers', { limit_count: 100 });
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching filtered products', error, { context: 'FilterResultsScreen', specialFilter, minPrice, maxPrice });
      setProducts([]);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, [specialFilter, minPrice, maxPrice]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  const handleApplyFilters = ({ minPrice: newMinPrice, maxPrice: newMaxPrice }) => {
    logger.info('Applying filters', { context: 'FilterResultsScreen', newMinPrice, newMaxPrice });
    setMinPrice(newMinPrice);
    setMaxPrice(newMaxPrice);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
        keyExtractor={(item) => `filtered-${item.id}`}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Ничего не найдено"
            message="Попробуйте изменить фильтры или поисковый запрос."
          />
        }
      />
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    flex: 1, // Allow title to take available space
    textAlign: 'center', // Center the title
  },
  filterButton: {
    marginLeft: 15,
  },
  listContainer: {
    paddingVertical: 20,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
});

export default FilterResultsScreen;
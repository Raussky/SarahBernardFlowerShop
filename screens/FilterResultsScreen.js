import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../src/components/ProductCard';
import { FONTS } from '../src/config/theme';
import { supabase } from '../src/integrations/supabase/client';
import EmptyState from '../src/components/EmptyState';

const FilterResultsScreen = ({ route, navigation }) => {
  const { filteredProducts: initialProducts, title = 'Результаты фильтра', specialFilter } = route.params;
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);

  useEffect(() => {
    const fetchSpecialFilter = async () => {
      if (specialFilter === 'bestsellers') {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_best_sellers', { limit_count: 100 }); // Fetch all
        if (!error) {
          setProducts(data);
        }
        setLoading(false);
      }
    };

    if (specialFilter) {
      fetchSpecialFilter();
    }
  }, [specialFilter]);

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
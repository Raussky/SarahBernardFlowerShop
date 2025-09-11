import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';
import { useToast } from '../../src/components/ToastProvider';

const AdminProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*, product_variants(*), categories(name)')
        .filter('is_archived', 'is', 'false')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isFocused) {
      fetchProducts();
    }
  }, [isFocused, fetchProducts]);

  const handleArchiveProduct = (id) => {
    Alert.alert(
      'Архивировать товар?',
      'Товар будет скрыт из каталога.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Архивировать', onPress: async () => {
            try {
              const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
              if (error) throw error;
              fetchProducts();
              showToast('Товар архивирован', 'success');
            } catch (error) {
              showToast(error.message, 'error');
            }
          }}
      ]
    );
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.categories?.name || 'Без категории'}</Text>
        <Text style={styles.productPrice}>₸{item.product_variants[0]?.price.toLocaleString() || 'N/A'}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity onPress={() => navigation.navigate('EditProduct', { productId: item.id })} style={styles.actionButton}>
          <Ionicons name="create-outline" size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleArchiveProduct(item.id)} style={styles.actionButton}>
          <Ionicons name="archive-outline" size={20} color="#FF69B4" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Товары</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('EditProduct', { productId: null })}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию товара..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Нет товаров, соответствующих критериям</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: '#FF69B4', padding: 8, borderRadius: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 10, marginTop: 10, marginBottom: 10 },
  searchInput: { flex: 1, height: 40, marginLeft: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600' },
  productCategory: { fontSize: 12, color: '#666', marginTop: 2 },
  productPrice: { fontSize: 14, color: '#FF69B4', marginTop: 5 },
  productActions: { flexDirection: 'row', gap: 10 },
  actionButton: { padding: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
});

export default AdminProductsScreen;
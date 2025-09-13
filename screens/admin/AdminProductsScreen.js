import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';
import { useToast } from '../../src/components/ToastProvider';
import EmptyState from '../../src/components/EmptyState';
import AdminHeader from '../../src/components/AdminHeader';

const AdminProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' or 'archived'
  const isFocused = useIsFocused();
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*, product_variants(*), categories(name)')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }
      if (statusFilter === 'active') {
        query = query.filter('is_archived', 'is', 'false');
      } else {
        query = query.eq('is_archived', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  useEffect(() => {
    if (isFocused) {
      fetchProducts();
      fetchCategories();
    }
  }, [isFocused, fetchProducts]);

  const handleArchiveToggle = (product) => {
    const newArchivedStatus = !product.is_archived;
    const actionText = newArchivedStatus ? 'Архивировать' : 'Восстановить';
    Alert.alert(
      `${actionText} товар?`,
      `Товар будет ${newArchivedStatus ? 'скрыт' : 'снова виден'} в каталоге.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: actionText, onPress: async () => {
            try {
              const { error } = await supabase.from('products').update({ is_archived: newArchivedStatus }).eq('id', product.id);
              if (error) throw error;
              fetchProducts();
              showToast(`Товар ${newArchivedStatus ? 'архивирован' : 'восстановлен'}`, 'success');
            } catch (error) {
              showToast(error.message, 'error');
            }
          }}
      ]
    );
  };

  const renderProductItem = ({ item }) => {
    const isLowStock = item.product_variants.some(v => v.stock_quantity <= 10);
    
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.categories?.name || 'Без категории'}</Text>
          <Text style={styles.productPrice}>₸{item.product_variants[0]?.price ? item.product_variants[0].price.toLocaleString() : 'N/A'}</Text>
          {isLowStock && (
            <View style={styles.lowStockIndicator}>
              <Ionicons name="warning-outline" size={14} color="#D32F2F" />
              <Text style={styles.lowStockText}>Мало на складе</Text>
            </View>
          )}
           <View style={styles.tagsContainer}>
             {item.is_weekly_pick && <View style={styles.tag}><Text style={styles.tagText}>Подборка недели</Text></View>}
             {item.purchase_count > 10 && <View style={[styles.tag, styles.bestsellerTag]}><Text style={styles.tagText}>Хит продаж</Text></View>}
           </View>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProduct', { productId: item.id })} style={styles.actionButton}>
            <Ionicons name="create-outline" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleArchiveToggle(item)} style={styles.actionButton}>
            <Ionicons name={item.is_archived ? "arrow-undo-outline" : "archive-outline"} size={20} color="#FF69B4" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title="Товары" onAddPress={() => navigation.navigate('EditProduct', { productId: null })} />
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
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.filterButton, statusFilter === 'active' && styles.activeFilter]} onPress={() => setStatusFilter('active')}><Text style={[styles.filterText, statusFilter === 'active' && styles.activeFilterText]}>Активные</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, statusFilter === 'archived' && styles.activeFilter]} onPress={() => setStatusFilter('archived')}><Text style={[styles.filterText, statusFilter === 'archived' && styles.activeFilterText]}>Архивные</Text></TouchableOpacity>
        </ScrollView>
      </View>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.filterButton, categoryFilter === 'all' && styles.activeFilter]} onPress={() => setCategoryFilter('all')}><Text style={[styles.filterText, categoryFilter === 'all' && styles.activeFilterText]}>Все категории</Text></TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.filterButton, categoryFilter === cat.id && styles.activeFilter]} onPress={() => setCategoryFilter(cat.id)}><Text style={[styles.filterText, categoryFilter === cat.id && styles.activeFilterText]}>{cat.name}</Text></TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="Нет товаров"
              message="Добавьте новый товар, чтобы он появился здесь."
              icon="cube-outline"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 10, marginTop: 10 },
  searchInput: { flex: 1, height: 40, marginLeft: 10 },
  filters: { paddingHorizontal: 20, paddingTop: 10 },
  filterButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 10 },
  activeFilter: { backgroundColor: '#FF69B4' },
  filterText: { color: '#333' },
  activeFilterText: { color: '#fff', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600' },
  productCategory: { fontSize: 12, color: '#666', marginTop: 2 },
  productPrice: { fontSize: 14, color: '#FF69B4', marginTop: 5 },
  tagsContainer: { flexDirection: 'row', marginTop: 8, gap: 5 },
  tag: { backgroundColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  bestsellerTag: { backgroundColor: '#FFC107' },
  tagText: { fontSize: 10, fontWeight: '600' },
  productActions: { flexDirection: 'row', gap: 10 },
  actionButton: { padding: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  lowStockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  lowStockText: {
    color: '#D32F2F',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
});

export default AdminProductsScreen;
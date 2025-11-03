import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client'; // Keep for now for categories fetch
import { deleteProduct, bulkArchiveProducts } from '../../src/services/productService';
import { useIsFocused } from '@react-navigation/native';
import { useToast } from '../../src/components/ToastProvider';
import EmptyState from '../../src/components/EmptyState';
import AdminHeader from '../../src/components/AdminHeader';
import { logger } from '../../src/utils/logger';

const AdminProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' or 'archived'
  const isFocused = useIsFocused();
  const { showToast } = useToast();

  const PAGE_SIZE = 15;

  const fetchProducts = useCallback(async (currentPage = 0, isRefresh = false) => {
    if (loadingMore || (currentPage > 0 && !hasMore && !isRefresh)) return;

    try {
      if (currentPage === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('products')
        .select('*, product_variants(*), categories(name)')
        .order('created_at', { ascending: false })
        .range(from, to);

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

      if (isRefresh || currentPage === 0) {
        setProducts(data);
      } else {
        setProducts(prevProducts => [...prevProducts, ...data]);
      }

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      setPage(currentPage);

    } catch (error) {
      logger.error('Error fetching products', error, { context: 'AdminProductsScreen', page, categoryFilter, searchQuery });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (isRefresh) setIsRefreshing(false);
    }
  }, [searchQuery, categoryFilter, statusFilter, loadingMore, hasMore]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  useEffect(() => {
    if (isFocused) {
      setPage(0);
      setHasMore(true);
      fetchProducts(0, true);
      fetchCategories();
    }
  }, [isFocused, searchQuery, categoryFilter, statusFilter]);

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

  const handleDelete = (product) => {
    Alert.alert(
      'Удалить товар?',
      `Вы уверены, что хотите навсегда удалить "${product.name}"? Это действие нельзя будет отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: async () => {
            try {
              const { data, error } = await deleteProduct(product.id);
              if (error) throw error;

              // Check the message from the RPC function
              if (data.includes('Cannot delete')) {
                showToast(data, 'warning');
              } else {
                showToast(data, 'success');
                fetchProducts(0, true); // Refresh the list
              }
            } catch (error) {
              showToast(error.message, 'error');
            }
          }}
      ]
    );
  };

  const handleBulkArchive = async (archive = true) => {
    const actionText = archive ? 'Архивировать' : 'Восстановить';
    Alert.alert(
      `${actionText} ${selectedProducts.length} товаров?`,
      `Вы уверены?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: actionText, style: 'destructive', onPress: async () => {
            try {
              const { error } = await bulkArchiveProducts(selectedProducts, archive);
              if (error) throw error;
              
              showToast(`Товары успешно ${archive ? 'архивированы' : 'восстановлены'}`, 'success');
              setSelectedProducts([]);
              setSelectionMode(false);
              fetchProducts(0, true);
            } catch (error) {
              showToast(error.message, 'error');
            }
          }}
      ]
    );
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedProducts([]); // Clear selection when exiting selection mode
    }
    setSelectionMode(!selectionMode);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(currentSelected => {
      if (currentSelected.includes(productId)) {
        return currentSelected.filter(id => id !== productId);
      } else {
        return [...currentSelected, productId];
      }
    });
  };

  const renderProductItem = ({ item }) => {
    const isLowStock = item.product_variants.some(v => v.stock_quantity <= 10);
    const isSelected = selectedProducts.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.productItem, isSelected && styles.selectedItem]}
        onPress={() => selectionMode ? toggleProductSelection(item.id) : navigation.navigate('EditProduct', { productId: item.id })}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={styles.checkbox}>
            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color="#FF69B4" />
          </View>
        )}
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
             {item.purchase_count > 10 && <View style={[styles.tag, styles.bestsellerTag]}><Text style={styles.tagText}>Хит продаж</Text></View>}
           </View>
        </View>
        {!selectionMode && (
          <View style={styles.productActions}>
            <TouchableOpacity onPress={() => navigation.navigate('EditProduct', { productId: item.id })} style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleArchiveToggle(item)} style={styles.actionButton}>
              <Ionicons name={item.is_archived ? "arrow-undo-outline" : "archive-outline"} size={20} color="#FFC107" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
             <Ionicons name="trash-outline" size={20} color="#D32F2F" />
           </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Товары"
        onAddPress={() => navigation.navigate('EditProduct', { productId: null })}
      >
        <TouchableOpacity onPress={toggleSelectionMode} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{selectionMode ? 'Отмена' : 'Выбрать'}</Text>
        </TouchableOpacity>
      </AdminHeader>
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
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              fetchProducts(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#999" style={{ marginVertical: 20 }} /> : null}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                setPage(0);
                setHasMore(true);
                fetchProducts(0, true);
              }}
              colors={['#FF69B4']}
            />
          }
        />
      )}
      {selectedProducts.length > 0 && (
       <View style={styles.bulkActionsContainer}>
         <Text style={styles.bulkActionsText}>{`Выбрано: ${selectedProducts.length}`}</Text>
         <View style={styles.bulkButtonsWrapper}>
           <TouchableOpacity style={styles.bulkActionButton} onPress={() => handleBulkArchive(true)}>
             <Ionicons name="archive-outline" size={24} color="#fff" />
             <Text style={styles.bulkButtonText}>Архив</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.bulkActionButton} onPress={() => handleBulkArchive(false)}>
             <Ionicons name="arrow-undo-outline" size={24} color="#fff" />
             <Text style={styles.bulkButtonText}>Восстановить</Text>
           </TouchableOpacity>
         </View>
       </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerButton: {
   marginRight: 10,
   paddingHorizontal: 10,
   paddingVertical: 5,
  },
  headerButtonText: {
   color: '#FF69B4',
   fontSize: 16,
   fontWeight: '600',
  },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 10, marginTop: 10 },
  searchInput: { flex: 1, height: 40, marginLeft: 10 },
  filters: { paddingHorizontal: 20, paddingTop: 10 },
  filterButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 10 },
  activeFilter: { backgroundColor: '#FF69B4' },
  filterText: { color: '#333' },
  activeFilterText: { color: '#fff', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 80, paddingTop: 10 }, // Added paddingBottom for bulk action bar
  productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  selectedItem: {
   backgroundColor: '#FFE4E1',
   borderColor: '#FF69B4',
   borderWidth: 1,
  },
  checkbox: {
   marginRight: 15,
  },
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
  bulkActionsContainer: {
   position: 'absolute',
   bottom: 60,
   left: 0,
   right: 0,
   height: 70,
   backgroundColor: '#333',
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   paddingHorizontal: 20,
   borderTopLeftRadius: 20,
   borderTopRightRadius: 20,
  },
  bulkActionsText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: '600',
  },
  bulkActionButton: {
    alignItems: 'center',
    gap: 2,
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 10,
  },
  bulkButtonsWrapper: {
    flexDirection: 'row',
    gap: 20,
  }
});

export default AdminProductsScreen;
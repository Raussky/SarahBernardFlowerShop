import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../src/components/EmptyState';
import AdminHeader from '../../src/components/AdminHeader';

const ORDER_STATUSES = {
  all: 'Все',
  pending: 'Новые',
  processing: 'В работе',
  shipping: 'Доставляются',
  completed: 'Выполненные',
  cancelled: 'Отмененные',
};

const PAGE_SIZE = 15;

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState({ column: 'created_at', ascending: false });
  const isFocused = useIsFocused();

  const handleSort = (columnName) => {
    setSort(currentSort => {
      if (currentSort.column === columnName) {
        return { ...currentSort, ascending: !currentSort.ascending };
      }
      return { column: columnName, ascending: false };
    });
  };

  const fetchOrders = useCallback(async (currentPage = 0, isRefresh = false) => {
    if (loadingMore || (currentPage > 0 && !hasMore && !isRefresh)) return; // Added !isRefresh to allow refetch on refresh even if no more pages

    try {
      if (currentPage === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('orders')
        .select('*')
        .order(sort.column, { ascending: sort.ascending })
        .range(from, to);
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      if (searchQuery) {
        query = query.ilike('customer_name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (isRefresh || currentPage === 0) {
        setOrders(data);
      } else {
        setOrders(prevOrders => [...prevOrders, ...data]);
      }

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      setPage(currentPage);

    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (isRefresh) setIsRefreshing(false);
    }
  }, [filter, searchQuery, sort, loadingMore, hasMore]);

  useEffect(() => {
    if (isFocused) {
      setPage(0);
      setHasMore(true);
      fetchOrders(0, true);
    }
  }, [isFocused, filter, searchQuery, sort]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchOrders(page + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(0);
    setHasMore(true);
    fetchOrders(0, true);
  }, []);

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderItem} 
      onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item.id })}
    >
      <View>
        <Text style={styles.orderId}>Заказ #{item.id.substring(0, 8)}</Text>
        <Text style={styles.orderCustomer}>{item.customer_name}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleString('ru-RU')}</Text>
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <Text style={styles.orderTotal}>₸{item.total_price ? item.total_price.toLocaleString() : 0}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
         <Text style={styles.statusText}>{ORDER_STATUSES[item.status] || item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

 const getStatusColor = (status) => {
   switch (status) {
     case 'completed': return '#4CAF50';
     case 'shipping': return '#2196F3';
     case 'processing': return '#FFC107';
     case 'cancelled': return '#F44336';
     case 'pending':
     default:
       return '#9E9E9E';
   }
 };

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title="Заказы" />
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени клиента..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
      <View style={styles.filterContainer}>
        <FlatList
          data={Object.keys(ORDER_STATUSES)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterButton, filter === item && styles.activeFilterButton]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{ORDER_STATUSES[item]}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Сортировать:</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('created_at')}>
          <Text style={styles.sortButtonText}>По дате</Text>
          {sort.column === 'created_at' && <Ionicons name={sort.ascending ? 'arrow-up' : 'arrow-down'} size={16} color="#FF69B4" />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('total_price')}>
          <Text style={styles.sortButtonText}>По сумме</Text>
          {sort.column === 'total_price' && <Ionicons name={sort.ascending ? 'arrow-up' : 'arrow-down'} size={16} color="#FF69B4" />}
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="Нет заказов"
              message="Новые заказы появятся здесь."
              icon="receipt-outline"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#999" style={{ marginVertical: 20 }} /> : null}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FF69B4']} />
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
  filterContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  filterButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 10 },
  activeFilterButton: { backgroundColor: '#FF69B4' },
  filterText: { color: '#333' },
  activeFilterText: { color: '#fff', fontWeight: 'bold' },
  sortContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sortLabel: { marginRight: 10, fontSize: 14, color: '#666' },
  sortButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 10, gap: 5 },
  sortButtonText: { color: '#333' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  orderId: { fontSize: 14, fontWeight: '600' },
  orderCustomer: { fontSize: 12, color: '#666', marginVertical: 2 },
  orderDate: { fontSize: 12, color: '#999' },
  orderTotal: { fontSize: 14, fontWeight: 'bold', color: '#FF69B4' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
});

export default AdminOrdersScreen;
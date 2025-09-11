import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ORDER_STATUSES = {
  all: 'Все',
  pending: 'Новые',
  processing: 'В работе',
  shipping: 'Доставляются',
  completed: 'Выполненные',
  cancelled: 'Отмененные',
};

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isFocused = useIsFocused();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      if (searchQuery) {
        query = query.ilike('customer_name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [isFocused, fetchOrders]);

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderItem} onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item.id })}>
      <View>
        <Text style={styles.orderId}>Заказ #{item.id.substring(0, 8)}</Text>
        <Text style={styles.orderCustomer}>{item.customer_name}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleString('ru-RU')}</Text>
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <Text style={styles.orderTotal}>₸{item.total_price.toLocaleString()}</Text>
        <Text style={styles.orderStatus}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Заказы</Text>
      </View>
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
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Нет заказов, соответствующих критериям</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 10, marginTop: 10 },
  searchInput: { flex: 1, height: 40, marginLeft: 10 },
  filterContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  filterButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 10 },
  activeFilterButton: { backgroundColor: '#FF69B4' },
  filterText: { color: '#333' },
  activeFilterText: { color: '#fff', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  orderId: { fontSize: 14, fontWeight: '600' },
  orderCustomer: { fontSize: 12, color: '#666', marginVertical: 2 },
  orderDate: { fontSize: 12, color: '#999' },
  orderTotal: { fontSize: 14, fontWeight: 'bold', color: '#FF69B4' },
  orderStatus: { fontSize: 12, color: '#333', fontStyle: 'italic', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
});

export default AdminOrdersScreen;
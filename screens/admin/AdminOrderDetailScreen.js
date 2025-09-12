import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useToast } from '../../src/components/ToastProvider';
import { useAuth } from '../../src/context/AuthContext'; // Import useAuth

const ORDER_STATUSES = {
  pending: 'Новый',
  processing: 'В работе',
  shipping: 'Доставляется',
  completed: 'Выполнен',
  cancelled: 'Отменен',
};

const AdminOrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { profile } = useAuth(); // Get profile from AuthContext
  const isAdmin = profile?.is_admin; // Check if user is admin

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      showToast('Ошибка загрузки заказа', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus) => {
    if (!isAdmin) { // Client-side check for admin status
      showToast('У вас нет прав для изменения статуса заказа.', 'error');
      return;
    }
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      setOrder({ ...order, status: newStatus });
      showToast('Статус заказа обновлен', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Заказ не найден</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Заказ #{order.id.substring(0, 8)}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Клиент</Text>
          <Text style={styles.infoText}><Text style={styles.infoLabel}>Имя:</Text> {order.customer_name}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customer_phone}`)}>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Телефон:</Text> <Text style={styles.linkText}>{order.customer_phone}</Text></Text>
          </TouchableOpacity>
          {order.customer_address && <Text style={styles.infoText}><Text style={styles.infoLabel}>Адрес:</Text> {order.customer_address}</Text>}
          <Text style={styles.infoText}><Text style={styles.infoLabel}>Способ получения:</Text> {order.delivery_method === 'delivery' ? 'Доставка' : 'Самовывоз'}</Text>
          {order.order_comment && <Text style={styles.infoText}><Text style={styles.infoLabel}>Комментарий:</Text> {order.order_comment}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Состав заказа</Text>
          {order.order_items.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.quantity}x {item.product_name} ({item.variant_size})</Text>
              <Text style={styles.itemPrice}>₸{(item.price_at_purchase * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Итого:</Text>
            <Text style={styles.totalPrice}>₸{order.total_price.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статус заказа: {ORDER_STATUSES[order.status]}</Text>
          {isAdmin && ( // Only show status selector if user is admin
            <View style={styles.statusSelector}>
              {Object.keys(ORDER_STATUSES).map(statusKey => (
                <TouchableOpacity
                  key={statusKey}
                  disabled={order.status === statusKey}
                  style={[styles.statusButton, order.status === statusKey && styles.activeStatusButton]}
                  onPress={() => handleUpdateStatus(statusKey)}
                >
                  <Text style={[styles.statusButtonText, order.status === statusKey && styles.activeStatusButtonText]}>
                    {ORDER_STATUSES[statusKey]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  section: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  infoText: { fontSize: 16, color: '#333', marginBottom: 5 },
  infoLabel: { fontWeight: '600' },
  linkText: { color: '#2196F3', textDecorationLine: 'underline' },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { flex: 1, fontSize: 14 },
  itemPrice: { fontSize: 14, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF69B4' },
  statusSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#e0e0e0' },
  activeStatusButton: { backgroundColor: '#FF69B4' },
  statusButtonText: { fontSize: 12, color: '#333', fontWeight: '500' },
  activeStatusButtonText: { color: '#fff' },
});

export default AdminOrderDetailScreen;
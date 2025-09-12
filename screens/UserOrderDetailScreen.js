import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/components/ToastProvider';
import { useAuth } from '../src/context/AuthContext';

const ORDER_STATUSES = {
  pending: 'Новый',
  processing: 'В работе',
  shipping: 'Доставляется',
  completed: 'Выполнен',
  cancelled: 'Отменен',
};

const UserOrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchOrderDetails = async () => {
    if (!user) {
      showToast('Вы не авторизованы.', 'error');
      navigation.goBack();
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .eq('user_id', user.id) // Ensure user can only see their own orders
        .single();
      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      showToast('Ошибка загрузки заказа или у вас нет доступа.', 'error');
      navigation.goBack(); // Go back if order not found or not user's
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, user]);

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
        <Text>Заказ не найден или у вас нет доступа.</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.goBack()}>
          <Text style={styles.shopButtonText}>Вернуться назад</Text>
        </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Информация о заказе</Text>
          <Text style={styles.infoText}><Text style={styles.infoLabel}>Дата:</Text> {new Date(order.created_at).toLocaleString('ru-RU')}</Text>
          <Text style={styles.infoText}><Text style={styles.infoLabel}>Способ получения:</Text> {order.delivery_method === 'delivery' ? 'Доставка' : 'Самовывоз'}</Text>
          {order.customer_address && <Text style={styles.infoText}><Text style={styles.infoLabel}>Адрес доставки:</Text> {order.customer_address}</Text>}
          <Text style={styles.infoText}><Text style={styles.infoLabel}>Способ оплаты:</Text> {order.payment_method === 'kaspi' ? 'Kaspi Перевод' : 'Наличными'}</Text>
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
          <Text style={styles.sectionTitle}>Статус заказа</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{ORDER_STATUSES[order.status] || order.status}</Text>
          </View>
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
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { flex: 1, fontSize: 14 },
  itemPrice: { fontSize: 14, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF69B4' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  statusText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  shopButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserOrderDetailScreen;
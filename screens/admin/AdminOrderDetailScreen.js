import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/integrations/supabase/client';
import { useToast } from '../../src/components/ToastProvider';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../src/components/AdminHeader';

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

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*, product_variants(*)))')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      setOrder(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleStatusUpdate = async (newStatus) => {
    Alert.alert(
      'Сменить статус заказа?',
      `Вы уверены, что хотите сменить статус на "${ORDER_STATUSES[newStatus]}"?`,
      [
        { text: 'Отмена' },
        {
          text: 'Сменить',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);
              if (error) throw error;
              fetchOrderDetails();
              showToast('Статус заказа обновлен', 'success');
            } catch (error) {
              showToast(error.message, 'error');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FF69B4" />;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <AdminHeader title="Заказ не найден" />
        <View style={styles.centered}>
          <Text>Не удалось загрузить детали заказа.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title={`Заказ #${order.id.substring(0, 8)}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Детали заказа</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Статус</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(order.status) }]}>
              {ORDER_STATUSES[order.status] || order.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Дата</Text>
            <Text style={styles.detailValue}>{new Date(order.created_at).toLocaleString('ru-RU')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Сумма</Text>
            <Text style={styles.detailValue}>₸{order.total_price.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Клиент</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Имя</Text>
            <Text style={styles.detailValue}>{order.customer_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Телефон</Text>
            <Text style={styles.detailValue}>{order.customer_phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Адрес</Text>
            <Text style={styles.detailValue}>{order.shipping_address}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Состав заказа</Text>
          {order.order_items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.products.name}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} x ₸{item.price ? item.price.toLocaleString() : 0}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Смена статуса</Text>
          <View style={styles.statusActions}>
            {Object.keys(ORDER_STATUSES).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusButton, { backgroundColor: getStatusColor(status) }]}
                onPress={() => handleStatusUpdate(status)}
                disabled={order.status === status}
              >
                <Text style={styles.statusButtonText}>{ORDER_STATUSES[status]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 14,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  statusButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminOrderDetailScreen;
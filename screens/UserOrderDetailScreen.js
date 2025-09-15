import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/components/ToastProvider';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../src/components/AdminHeader'; // Re-using for consistent header style
import { FONTS } from '../src/config/theme';
import { AuthContext } from '../src/context/AuthContext';

const STATUS_MAP = [
  { key: 'pending', title: 'Заказ принят', icon: 'receipt-outline' },
  { key: 'processing', title: 'Собирается', icon: 'cube-outline' },
  { key: 'out_for_delivery', title: 'В пути', icon: 'car-outline' },
  { key: 'delivered', title: 'Доставлен', icon: 'checkmark-circle-outline' },
];

const UserOrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const fetchOrderDetails = useCallback(async () => {
    try {
      // No need to set loading true here as it's handled in the initial load
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*), combos(*))')
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

    const channel = supabase
      .channel(`public:orders:id=eq.${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(prevOrder => ({ ...prevOrder, ...payload.new }));
        showToast('Статус вашего заказа обновлен!', 'info');
        // Trigger animation
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchOrderDetails]);

  const renderStatusTracker = () => {
    if (!order) return null;

    const currentStatusIndex = STATUS_MAP.findIndex(s => s.key === order.status);

    if (order.status === 'cancelled') {
      return (
        <View style={styles.cancelledContainer}>
          <Ionicons name="close-circle-outline" size={24} color="#F44336" />
          <Text style={styles.cancelledText}>Заказ был отменен</Text>
        </View>
      );
    }

    return (
      <View style={styles.trackerContainer}>
        {STATUS_MAP.map((status, index) => {
          const isActive = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          const animatedStyle = isCurrent ? { transform: [{ scale: scaleAnim }] } : {};

          return (
            <React.Fragment key={status.key}>
              <View style={styles.statusPoint}>
                <Animated.View style={[styles.statusIconContainer, isActive && styles.activeStatus, animatedStyle]}>
                  <Ionicons name={status.icon} size={24} color={isActive ? '#fff' : '#999'} />
                </Animated.View>
                <Text style={[styles.statusLabel, isActive && styles.activeLabel]}>{status.title}</Text>
              </View>
              {index < STATUS_MAP.length - 1 && <View style={[styles.connector, isActive && styles.activeConnector]} />}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const handleCancelOrder = async () => {
    Alert.alert(
      "Подтвердите отмену",
      "Вы уверены, что хотите отменить этот заказ?",
      [
        { text: "Нет", style: "cancel" },
        {
          text: "Да, отменить",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from('orders')
              .update({ status: 'cancelled' })
              .match({ id: orderId, user_id: user.id, status: 'pending' });

            if (error) {
              showToast(error.message, 'error');
            } else {
              showToast('Заказ успешно отменен!', 'success');
              setOrder(currentOrder => ({ ...currentOrder, status: 'cancelled' }));
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
        <AdminHeader title="Заказ не найден" back />
        <View style={styles.centered}>
          <Text>Не удалось загрузить детали заказа.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title={`Заказ #${order.id.substring(0, 8)}`} back />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Статус заказа</Text>
          {renderStatusTracker()}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Детали доставки</Text>
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
            <Text style={styles.detailValue}>{order.customer_address}</Text>
          </View>
           <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Время доставки</Text>
            <Text style={styles.detailValue}>{order.delivery_time || 'Не указано'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Состав заказа</Text>
          {order.order_items.map((item) => {
            const productDetails = item.products || item.combos;
            return (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{productDetails?.name || 'Название не найдено'}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} x ₸{item.price ? item.price.toLocaleString() : 0}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Итого</Text>
            <Text style={styles.totalPrice}>₸{order.total_price.toLocaleString()}</Text>
          </View>
        </View>

        {order.status === 'pending' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
            <Ionicons name="close-circle-outline" size={22} color="#fff" />
            <Text style={styles.cancelButtonText}>Отменить заказ</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
    fontFamily: FONTS.bold,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.regular,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
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
    fontFamily: FONTS.regular,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  totalPrice: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FF69B4',
  },
  trackerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusPoint: {
    alignItems: 'center',
    width: 80,
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStatus: {
    backgroundColor: '#FF69B4',
  },
  statusLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    fontFamily: FONTS.regular,
  },
  activeLabel: {
    color: '#333',
    fontFamily: FONTS.semiBold,
  },
  connector: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    marginTop: 23, // Align with center of icons
  },
  activeConnector: {
    backgroundColor: '#FF69B4',
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
  },
  cancelledText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#F44336',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 10,
    marginHorizontal: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginLeft: 10,
  },
});

export default UserOrderDetailScreen;
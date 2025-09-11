import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';

const StatCard = ({ icon, title, value, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ newOrders: 0, revenue: 0, activeOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch stats
      const { data: newOrdersData, error: newOrdersError } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .gte('created_at', todayISO);
      if (newOrdersError) throw newOrdersError;

      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_price')
        .gte('created_at', todayISO);
      if (revenueError) throw revenueError;
      const totalRevenue = revenueData.reduce((sum, order) => sum + order.total_price, 0);

      const { data: activeOrdersData, error: activeOrdersError } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .in('status', ['pending', 'processing', 'shipping']);
      if (activeOrdersError) throw activeOrdersError;

      // Fetch recent orders
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentOrdersError) throw recentOrdersError;

      setStats({
        newOrders: newOrdersData.length,
        revenue: totalRevenue,
        activeOrders: activeOrdersData.length,
      });
      setRecentOrders(recentOrdersData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchDashboardData();
    }
  }, [isFocused]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Сводка</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <StatCard icon="receipt-outline" title="Новых заказов сегодня" value={stats.newOrders} color="#2196F3" />
          <StatCard icon="cash-outline" title="Выручка сегодня" value={`₸${stats.revenue.toLocaleString()}`} color="#4CAF50" />
          <StatCard icon="hourglass-outline" title="Активных заказов" value={stats.activeOrders} color="#FFC107" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Последние заказы</Text>
          {recentOrders.map(order => (
            <TouchableOpacity key={order.id} style={styles.orderItem} onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order.id })}>
              <View>
                <Text style={styles.orderId}>Заказ #{order.id.substring(0, 8)}</Text>
                <Text style={styles.orderCustomer}>{order.customer_name}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.orderTotal}>₸{order.total_price.toLocaleString()}</Text>
                <Text style={styles.orderStatus}>{order.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '45%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 5 },
  statTitle: { fontSize: 12, color: '#666', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  orderId: { fontSize: 14, fontWeight: '600' },
  orderCustomer: { fontSize: 12, color: '#666', marginTop: 2 },
  orderTotal: { fontSize: 14, fontWeight: 'bold', color: '#FF69B4' },
  orderStatus: { fontSize: 12, color: '#333', fontStyle: 'italic', marginTop: 2 },
});

export default AdminDashboardScreen;
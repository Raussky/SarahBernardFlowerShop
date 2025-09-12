import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const StatCard = ({ icon, title, value, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    newOrders: 0,
    revenueToday: 0,
    activeOrders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    revenue7days: 0,
    bestseller: '...',
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState({ labels: [], datasets: [{ data: [] }] });
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(255, 105, 180, ${opacity})`, // Pink color
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#FF69B4',
    },
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // --- Parallel fetching for performance ---
      const [
        newOrdersRes,
        revenueTodayRes,
        activeOrdersRes,
        totalOrdersRes,
        totalRevenueRes,
        revenue7daysRes,
        bestsellerRes,
        recentOrdersRes,
        dailyRevenueRes,
        orderStatusRes,
      ] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', todayISO),
        supabase.from('orders').select('total_price').gte('created_at', todayISO),
        supabase.from('orders').select('id', { count: 'exact' }).in('status', ['pending', 'processing', 'shipping']),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('orders').select('total_price'),
        supabase.from('orders').select('total_price').gte('created_at', sevenDaysAgoISO),
        supabase.rpc('get_bestseller_last_30_days'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('created_at, total_price').gte('created_at', thirtyDaysAgoISO),
        supabase.from('orders').select('status', { count: 'exact' }),
      ]);

      // --- Process results ---
      const totalRevenueToday = revenueTodayRes.data?.reduce((sum, order) => sum + order.total_price, 0) || 0;
      const totalRevenueAllTime = totalRevenueRes.data?.reduce((sum, order) => sum + order.total_price, 0) || 0;
      const totalRevenue7days = revenue7daysRes.data?.reduce((sum, order) => sum + order.total_price, 0) || 0;
      const bestsellerData = bestsellerRes.data;
      const bestseller = bestsellerData && bestsellerData.length > 0 
        ? `${bestsellerData[0].product_name} (${bestsellerData[0].total_quantity} шт.)` 
        : 'Нет данных';

      setStats({
        newOrders: newOrdersRes.count || 0,
        revenueToday: totalRevenueToday,
        activeOrders: activeOrdersRes.count || 0,
        totalOrders: totalOrdersRes.count || 0,
        totalRevenue: totalRevenueAllTime,
        revenue7days: totalRevenue7days,
        bestseller: bestseller,
      });
      setRecentOrders(recentOrdersRes.data || []);

      // Process daily revenue for chart
      const dailyData = {};
      dailyRevenueRes.data?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ru-RU');
        dailyData[date] = (dailyData[date] || 0) + order.total_price;
      });

      const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
      const labels = sortedDates.map(date => date.substring(0, 5)); // e.g., 01.01
      const data = sortedDates.map(date => dailyData[date]);

      setDailyRevenue({
        labels: labels.slice(-7), // Show last 7 days for brevity
        datasets: [{ data: data.slice(-7) }],
      });

      // Process order status distribution for chart
      const statusCounts = {};
      orderStatusRes.data?.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const pieChartColors = ['#FF69B4', '#FFC0CB', '#FFDAB9', '#E0BBE4', '#957DAD'];
      const statusChartData = Object.keys(statusCounts).map((status, index) => ({
        name: status,
        population: statusCounts[status],
        color: pieChartColors[index % pieChartColors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      }));
      setOrderStatusData(statusChartData);

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
          <StatCard icon="cash-outline" title="Выручка сегодня" value={`₸${stats.revenueToday.toLocaleString()}`} color="#4CAF50" />
          <StatCard icon="trending-up-outline" title="Выручка за 7 дней" value={`₸${stats.revenue7days.toLocaleString()}`} color="#4CAF50" />
          <StatCard icon="hourglass-outline" title="Активных заказов" value={stats.activeOrders} color="#FFC107" />
          <StatCard icon="stats-chart-outline" title="Всего заказов" value={stats.totalOrders} color="#9C27B0" />
          <StatCard icon="wallet-outline" title="Выручка (все время)" value={`₸${stats.totalRevenue.toLocaleString()}`} color="#E91E63" />
          <StatCard icon="star-outline" title="Хит продаж (30 дней)" value={stats.bestseller} color="#FF9800" />
        </View>

        {dailyRevenue.labels.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Выручка за последние 7 дней</Text>
            <LineChart
              data={dailyRevenue}
              width={width - 40} // from react-native
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          </View>
        )}

        {orderStatusData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Распределение заказов по статусам</Text>
            <PieChart
              data={orderStatusData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute
              style={styles.chartStyle}
            />
          </View>
        )}

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
    minHeight: 120,
    justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: 'bold', marginVertical: 5, textAlign: 'center' },
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
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default AdminDashboardScreen;
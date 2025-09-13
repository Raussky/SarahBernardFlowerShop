import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../src/integrations/supabase/client';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../src/components/AdminHeader';

const AdminDashboardScreen = () => {
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_dashboard_analytics');
    if (!error) setAnalytics(data);

    const { data: chartApiData, error: chartError } = await supabase.rpc('get_sales_chart_data');
    if (!chartError) {
      const labels = chartApiData.map(item => new Date(item.sale_day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
      const dataPoints = chartApiData.map(item => item.total_revenue);
      setChartData({
        labels,
        datasets: [{ data: dataPoints }],
      });
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FF69B4" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeader title="Сводка" />
        
        <View style={styles.grid}>
          <View style={styles.card}>
            <Ionicons name="cash-outline" size={24} color="#4CAF50" />
            <Text style={styles.cardValue}>₸{analytics?.total_revenue ? analytics.total_revenue.toLocaleString() : 0}</Text>
            <Text style={styles.cardLabel}>Общая выручка</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="receipt-outline" size={24} color="#2196F3" />
            <Text style={styles.cardValue}>{analytics?.total_orders || 0}</Text>
            <Text style={styles.cardLabel}>Всего заказов</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="hourglass-outline" size={24} color="#FFC107" />
            <Text style={styles.cardValue}>{analytics?.pending_orders || 0}</Text>
            <Text style={styles.cardLabel}>Новых заказов</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="star-outline" size={24} color="#FF69B4" />
            <Text style={styles.cardValue} numberOfLines={1}>{analytics?.best_selling_product_name || 'N/A'}</Text>
            <Text style={styles.cardLabel}>Хит продаж</Text>
          </View>
        </View>

        <Text style={styles.chartTitle}>Динамика продаж</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const chartConfig = {
  backgroundColor: "#e26a00",
  backgroundGradientFrom: "#fb8c00",
  backgroundGradientTo: "#ffa726",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 15, alignItems: 'center' },
  cardValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 8 },
  cardLabel: { fontSize: 14, color: '#666' },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  chart: { marginVertical: 8, borderRadius: 16 },
});

export default AdminDashboardScreen;
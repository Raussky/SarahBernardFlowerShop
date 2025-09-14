import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
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
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'

  const fetchAnalytics = async () => {
    setLoading(true);
    
    const endDate = new Date();
    let startDate = new Date();
    
    if (timeRange === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (timeRange === 'year') {
      startDate.setFullYear(endDate.getFullYear() - 1);
    }

    const { data, error } = await supabase.rpc('get_dashboard_analytics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });
    if (!error) setAnalytics(data);

    const { data: chartApiData, error: chartError } = await supabase.rpc('get_sales_chart_data', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });
    if (!chartError && chartApiData) {
      const labels = chartApiData.map(item => new Date(item.sale_day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
      const dataPoints = chartApiData.map(item => item.total_revenue);
      setChartData({
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{ data: dataPoints.length > 0 ? dataPoints : [0] }],
      });
    } else {
      setChartData({
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      });
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [timeRange])
  );

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FF69B4" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHeader title="Сводка" />
        
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity style={[styles.timeRangeButton, timeRange === 'week' && styles.activeButton]} onPress={() => setTimeRange('week')}>
            <Text style={[styles.timeRangeText, timeRange === 'week' && styles.activeText]}>Неделя</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.timeRangeButton, timeRange === 'month' && styles.activeButton]} onPress={() => setTimeRange('month')}>
            <Text style={[styles.timeRangeText, timeRange === 'month' && styles.activeText]}>Месяц</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.timeRangeButton, timeRange === 'year' && styles.activeButton]} onPress={() => setTimeRange('year')}>
            <Text style={[styles.timeRangeText, timeRange === 'year' && styles.activeText]}>Год</Text>
          </TouchableOpacity>
        </View>
        
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
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 105, 180, ${opacity})`, // Pink color for the line
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Black color for labels
  style: { borderRadius: 16 },
  propsForDots: { r: "6", strokeWidth: "2", stroke: "#FF69B4" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 15,
  },
  timeRangeText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#999',
  },
  activeButton: {
    backgroundColor: '#FF69B4',
  },
  activeText: {
    color: '#fff',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 15, alignItems: 'center' },
  cardValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 8 },
  cardLabel: { fontSize: 14, color: '#666' },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  chart: { marginVertical: 8, borderRadius: 16 },
});

export default AdminDashboardScreen;
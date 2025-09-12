import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminCategoriesScreen from '../screens/admin/AdminCategoriesScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';

const Tab = createBottomTabNavigator();
const AdminStack = createStackNavigator();

const OrdersStack = () => (
  <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="AdminOrdersList" component={AdminOrdersScreen} />
    <AdminStack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
  </AdminStack.Navigator>
);

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Сводка' }} />
      <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ title: 'Заказы' }} />
      <Tab.Screen name="Products" component={AdminProductsScreen} options={{ title: 'Товары' }} />
      <Tab.Screen name="Categories" component={AdminCategoriesScreen} options={{ title: 'Категории' }} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
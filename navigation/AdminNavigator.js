import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminCategoriesScreen from '../screens/admin/AdminCategoriesScreen';
import AdminBannersScreen from '../screens/admin/AdminBannersScreen'; // Import new screen

const Tab = createBottomTabNavigator();

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Banners') { // New tab for Banners
            iconName = focused ? 'image' : 'image-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Сводка' }} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} options={{ title: 'Заказы' }} />
      <Tab.Screen name="Products" component={AdminProductsScreen} options={{ title: 'Товары' }} />
      <Tab.Screen name="Categories" component={AdminCategoriesScreen} options={{ title: 'Категории' }} />
      <Tab.Screen name="Banners" component={AdminBannersScreen} options={{ title: 'Баннеры' }} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
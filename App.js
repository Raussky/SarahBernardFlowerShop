import 'react-native-get-random-values'; // Must be at the top
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './screens/HomeScreen';
import SavedScreen from './screens/SavedScreen';
import BasketScreen from './screens/BasketScreen';
import ProductScreen from './screens/ProductScreen';
import LoginScreen from './screens/LoginScreen';
import CategoryScreen from './screens/CategoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProductScreen from './screens/EditProductScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import EditProfileScreen from './screens/EditProfileScreen'; // New import

// Import Admin Screens & Navigator
import AdminNavigator from './navigation/AdminNavigator';
import AdminOrderDetailScreen from './screens/admin/AdminOrderDetailScreen';

// Import Providers
import { ToastProvider } from './src/components/ToastProvider';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 5,
          right: 5,
          backgroundColor: '#fff',
          borderRadius: 35,
          height:80,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedScreen}
        options={{
          tabBarLabel: 'Избранное',
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Basket" 
        component={BasketScreen}
        options={{
          tabBarLabel: 'Корзина',
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Product" component={ProductScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Admin" component={AdminNavigator} />
              <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
              <Stack.Screen name="Category" component={CategoryScreen} />
              <Stack.Screen name="EditProduct" component={EditProductScreen} />
              <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
              <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} /> {/* New screen */}
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
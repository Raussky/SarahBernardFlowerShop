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
import AdminScreen from './screens/AdminScreen';
import CategoryScreen from './screens/CategoryScreen';
import ProfileScreen from './screens/ProfileScreen';

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
          backgroundColor: '#fff',
          borderTopWidth: 0, // Remove top border
          height: 60,
          paddingBottom: 5,
          elevation: 0, // for Android
          shadowOpacity: 0, // for iOS
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
              <Stack.Screen name="Admin" component={AdminScreen} />
              <Stack.Screen name="Category" component={CategoryScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
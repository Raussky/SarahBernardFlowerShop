import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './screens/HomeScreen';
import SavedScreen from './screens/SavedScreen';
import BasketScreen from './screens/BasketScreen';
import ProductScreen from './screens/ProductScreen';
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen';
import CategoryScreen from './screens/CategoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Cart Context
export const CartContext = React.createContext();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 5,
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Basket" 
        component={BasketScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [cart, setCart] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadCart();
    loadSaved();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) setCart(JSON.parse(cartData));
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const loadSaved = async () => {
    try {
      const savedData = await AsyncStorage.getItem('saved');
      if (savedData) setSaved(JSON.parse(savedData));
    } catch (error) {
      console.error('Error loading saved:', error);
    }
  };

  const addToCart = async (item) => {
    const newCart = [...cart, item];
    setCart(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = async (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const toggleSaved = async (item) => {
    let newSaved;
    if (saved.find(i => i.id === item.id)) {
      newSaved = saved.filter(i => i.id !== item.id);
    } else {
      newSaved = [...saved, item];
    }
    setSaved(newSaved);
    await AsyncStorage.setItem('saved', JSON.stringify(newSaved));
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      saved, 
      addToCart, 
      removeFromCart, 
      toggleSaved,
      isAdmin,
      setIsAdmin 
    }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Product" component={ProductScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Category" component={CategoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CartContext.Provider>
  );
}
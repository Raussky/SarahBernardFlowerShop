import React, { createContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from './screens/HomeScreen';
import SavedScreen from './screens/SavedScreen';
import BasketScreen from './screens/BasketScreen';
import ProfileScreen from './screens/ProfileScreen';
import CategoryScreen from './screens/CategoryScreen';
import ProductScreen from './screens/ProductScreen';
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen';
import SearchScreen from './screens/SearchScreen';

// Create contexts
export const CartContext = createContext();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Basket') {
            iconName = focused ? 'basket' : 'basket-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Basket" component={BasketScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [cartItems, setCartItems] = useState([]);
  const [saved, setSaved] = useState([]);
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load data on app start
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cartItems');
      const savedFavorites = await AsyncStorage.getItem('saved');
      const savedProducts = await AsyncStorage.getItem('products');
      const adminStatus = await AsyncStorage.getItem('isAdmin');
      
      if (savedCart) setCartItems(JSON.parse(savedCart));
      if (savedFavorites) setSaved(JSON.parse(savedFavorites));
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (adminStatus === 'true') setIsAdmin(true);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addToCart = async (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    let updatedCart;
    if (existingItem) {
      updatedCart = cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cartItems, { ...product, quantity: 1 }];
    }
    
    setCartItems(updatedCart);
    await AsyncStorage.setItem('cartItems', JSON.stringify(updatedCart));
  };

  const removeFromCart = async (productId) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    await AsyncStorage.setItem('cartItems', JSON.stringify(updatedCart));
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }
    
    const updatedCart = cartItems.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    setCartItems(updatedCart);
    await AsyncStorage.setItem('cartItems', JSON.stringify(updatedCart));
  };

  const toggleSaved = async (product) => {
    const isAlreadySaved = saved.find(item => item.id === product.id);
    
    let updatedSaved;
    if (isAlreadySaved) {
      updatedSaved = saved.filter(item => item.id !== product.id);
    } else {
      updatedSaved = [...saved, product];
    }
    
    setSaved(updatedSaved);
    await AsyncStorage.setItem('saved', JSON.stringify(updatedSaved));
  };

  const addProduct = async (product) => {
    const newProduct = {
      ...product,
      id: Date.now(),
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const updateProduct = async (productId, updatedProduct) => {
    const updatedProducts = products.map(product => 
      product.id === productId ? { ...product, ...updatedProduct } : product
    );
    setProducts(updatedProducts);
    await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const deleteProduct = async (productId) => {
    const updatedProducts = products.filter(product => product.id !== productId);
    setProducts(updatedProducts);
    await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const clearCart = async () => {
    setCartItems([]);
    await AsyncStorage.removeItem('cartItems');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const contextValue = {
    cartItems,
    saved,
    products,
    isAdmin,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleSaved,
    addProduct,
    updateProduct,
    deleteProduct,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    setIsAdmin,
  };

  return (
    <CartContext.Provider value={contextValue}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Category" component={CategoryScreen} />
          <Stack.Screen name="Product" component={ProductScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CartContext.Provider>
  );
}

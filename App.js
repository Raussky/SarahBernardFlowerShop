import 'react-native-get-random-values'; // Must be at the top
import React, { useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
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
import EditProfileScreen from './screens/EditProfileScreen';
import AllCategoriesScreen from './screens/AllCategoriesScreen';
import UserOrderDetailScreen from './screens/UserOrderDetailScreen';
import ComboScreen from './screens/ComboScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import AddressesScreen from './screens/AddressesScreen';
import EditAddressScreen from './screens/EditAddressScreen';
import NotificationsSettingsScreen from './screens/NotificationsSettingsScreen';
import SearchScreen from './screens/SearchScreen';
import FilterResultsScreen from './screens/FilterResultsScreen';

// Import Admin Screens & Navigator
import AdminNavigator from './navigation/AdminNavigator';

// Import Providers
import { ToastProvider } from './src/components/ToastProvider';
import { CartContext, CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CartIconWithBadge = ({ color }) => {
  const { cart } = useContext(CartContext);
  const itemCount = cart.length;

  return (
    <View>
      <Ionicons name="cart-outline" size={24} color={color} />
      {itemCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      )}
    </View>
  );
};

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
          tabBarIcon: ({ color }) => <CartIconWithBadge color={color} />,
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
 const [fontsLoaded] = useFonts({
   'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
   'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
   'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
   'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
 });

 if (!fontsLoaded) {
   return <ActivityIndicator size="large" color="#FF69B4" />;
 }

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
              <Stack.Screen name="Category" component={CategoryScreen} />
              <Stack.Screen name="EditProduct" component={EditProductScreen} />
              <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
              <Stack.Screen name="UserOrderDetail" component={UserOrderDetailScreen} />
              <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
              <Stack.Screen name="Combo" component={ComboScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="Addresses" component={AddressesScreen} />
              <Stack.Screen name="EditAddress" component={EditAddressScreen} />
              <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="FilterResults" component={FilterResultsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -10,
    top: -5,
    backgroundColor: '#FF69B4',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
import 'react-native-gesture-handler';
import 'react-native-get-random-values'; // Must be at the top
import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import utilities
import ErrorBoundary from './src/components/ErrorBoundary';
import { logger } from './src/utils/logger';
import { initSentry } from './src/utils/sentry';
import { TAB_BAR_HEIGHT, TAB_BAR_BORDER_RADIUS, TAB_BAR_BOTTOM_OFFSET } from './src/config/device';

// Initialize Sentry for error tracking
initSentry();

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
import AllCombosScreen from './screens/AllCombosScreen';
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
import { AnimationProvider } from './src/context/AnimationContext';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://575c605e7e544440d892f8c0a14ec67e@o4510284357042176.ingest.de.sentry.io/4510284358287440',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CartIconWithBadge = ({ color, focused }) => {
  const { cart } = useContext(CartContext);
  const itemCount = cart.length;

  return (
    <View>
      <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
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
          bottom: TAB_BAR_BOTTOM_OFFSET, // Use adaptive bottom offset
          left: 10, // Slightly larger margin for better edge spacing
          right: 10, // Slightly larger margin for better edge spacing
          backgroundColor: '#fff',
          borderRadius: TAB_BAR_BORDER_RADIUS,
          height: TAB_BAR_HEIGHT,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
          borderTopWidth: 0,
          // Additional Android-specific styling for better Samsung compatibility
          paddingBottom: 0,
          paddingTop: 5,
          ...Platform.select({
            android: {
              // Android specific adjustments
              height: TAB_BAR_HEIGHT + 10, // Slightly taller for Android
              paddingBottom: 5,
            },
            ios: {
              height: TAB_BAR_HEIGHT,
            }
          })
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        // Ensure tab bar items are properly centered
        tabBarIconStyle: {
          marginTop: 5,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedScreen}
        options={{
          tabBarLabel: 'Избранное',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "heart" : "heart-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Basket" 
        component={BasketScreen}
        options={{
          tabBarLabel: 'Корзина',
          tabBarIcon: ({ color, focused }) => <CartIconWithBadge color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function App() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <AnimationProvider>
                <NavigationContainer
                  onReady={() => logger.info('Navigation ready')}
                  onStateChange={(state) => {
                    // Track screen views
                    const currentRoute = state?.routes[state.index];
                    if (currentRoute) {
                      logger.trackScreen(currentRoute.name);
                    }
                  }}
                >
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
                    <Stack.Screen name="AllCombos" component={AllCombosScreen} />
                    <Stack.Screen name="Combo" component={ComboScreen} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} />
                    <Stack.Screen name="Addresses" component={AddressesScreen} />
                    <Stack.Screen name="EditAddress" component={EditAddressScreen} />
                    <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
                    <Stack.Screen name="Search" component={SearchScreen} />
                    <Stack.Screen name="FilterResults" component={FilterResultsScreen} />
                  </Stack.Navigator>
                </NavigationContainer>
              </AnimationProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
});

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -8,
    top: -3,
    backgroundColor: '#FF69B4',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
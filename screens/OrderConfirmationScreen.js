import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const OrderConfirmationScreen = ({ navigation, route }) => {
  const { orderId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle-outline" size={120} color="#4CAF50" />
        <Text style={styles.title}>Заказ успешно оформлен!</Text>
        <Text style={styles.subtitle}>
          Ваш заказ <Text style={styles.orderIdText}>#{orderId.substring(0, 8)}</Text> принят.
          Мы свяжемся с вами в ближайшее время для подтверждения.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Main', { screen: 'Home' })}
        >
          <Text style={styles.buttonText}>Вернуться на главную</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <Text style={styles.buttonSecondaryText}>Посмотреть мои заказы</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
  },
  orderIdText: {
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  button: {
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF69B4',
  },
  buttonSecondaryText: {
    color: '#FF69B4',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen;
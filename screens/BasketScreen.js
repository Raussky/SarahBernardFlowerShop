import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../App';
import * as Linking from 'expo-linking';

const BasketScreen = ({ navigation }) => {
  const { cart, removeFromCart } = useContext(CartContext);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Корзина пуста', 'Добавьте товары в корзину');
      return;
    }

    Alert.alert(
      'Выберите способ оплаты',
      '',
      [
        { text: 'Наличными', onPress: () => handleCashPayment() },
        { text: 'Kaspi перевод', onPress: () => handleKaspiPayment() },
        { text: 'WhatsApp', onPress: () => handleWhatsAppOrder() },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };

  const handleCashPayment = () => {
    Alert.alert('Успешно', 'Заказ оформлен. Оплата при получении');
    // Clear cart after order
  };

  const handleKaspiPayment = () => {
    Alert.alert('Kaspi перевод', 'Номер карты: 4400 4301 2345 6789\nПолучатель: Sarah Bernard');
  };

  const handleWhatsAppOrder = () => {
    const orderDetails = cart.map(item => 
      `${item.name} - ${item.size} стеблей - ₸${item.price}`
    ).join('\n');
    
    const message = `Здравствуйте! Хочу оформить заказ:\n\n${orderDetails}\n\nОбщая сумма: ₸${getTotalPrice().toLocaleString()}`;
    const whatsappUrl = `whatsapp://send?phone=+77001234567&text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Ошибка', 'WhatsApp не установлен');
    });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSize}>Размер: {item.size} стеблей</Text>
        <Text style={styles.itemPrice}>₸{item.price.toLocaleString()}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF69B4" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Корзина</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={100} color="#ddd" />
          <Text style={styles.emptyText}>Корзина пуста</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Перейти к покупкам</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Итого:</Text>
              <Text style={styles.totalPrice}>₸{getTotalPrice().toLocaleString()}</Text>
            </View>
            
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  removeButton: {
    padding: 10,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  checkoutButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BasketScreen;
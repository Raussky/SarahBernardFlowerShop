import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../App';

const BasketScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useContext(CartContext);

  const handleWhatsAppOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Корзина пуста', 'Добавьте товары в корзину для оформления заказа');
      return;
    }

    let orderText = '🌹 *Новый заказ из Sarah Bernard*\n\n';
    orderText += '📋 *Детали заказа:*\n';
    
    cartItems.forEach((item, index) => {
      orderText += `${index + 1}. ${item.name}\n`;
      orderText += `   Количество: ${item.quantity}\n`;
      orderText += `   Цена: ₸${item.price.toLocaleString()}\n`;
      orderText += `   Сумма: ₸${(item.price * item.quantity).toLocaleString()}\n\n`;
    });

    orderText += `💰 *Общая сумма: ₸${getCartTotal().toLocaleString()}*\n\n`;
    orderText += '📞 Пожалуйста, свяжитесь со мной для подтверждения заказа.';

    const phoneNumber = '+77001234567'; // Replace with actual WhatsApp number
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(orderText)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Ошибка', 'WhatsApp не установлен на устройстве');
      }
    });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/80/FFB6C1/FFFFFF?text=Flower' }} style={styles.itemImage} />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₸{item.price.toLocaleString()}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={20} color="#FF69B4" />
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#FF69B4" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemActions}>
        <Text style={styles.itemTotal}>₸{(item.price * item.quantity).toLocaleString()}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyCart = () => (
    <View style={styles.emptyCart}>
      <Ionicons name="basket-outline" size={80} color="#ccc" />
      <Text style={styles.emptyCartTitle}>Корзина пуста</Text>
      <Text style={styles.emptyCartText}>Добавьте товары из каталога</Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Перейти к покупкам</Text>
      </TouchableOpacity>
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Корзина</Text>
        </View>
        <EmptyCart />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Корзина ({cartItems.length})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearButton}>Очистить</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Общая сумма:</Text>
          <Text style={styles.totalAmount}>₸{getCartTotal().toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleWhatsAppOrder}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.orderButtonText}>Оформить заказ</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    color: '#FF69B4',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  orderButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BasketScreen;

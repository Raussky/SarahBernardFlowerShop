import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert, // Keep Alert for WhatsApp system error
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../App';
import * as Linking from 'expo-linking';
import { useToast } from '../src/components/ToastProvider'; // New import

const DELIVERY_COST = 500; // Fixed delivery cost

const BasketScreen = ({ navigation }) => {
  const { cart, clearCart } = useContext(CartContext);
  const { showToast } = useToast();

  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'delivery' or 'pickup'
  const [paymentMethod, setPaymentMethod] = useState('kaspi'); // 'kaspi' or 'cash'
  const [customerName, setCustomerName] = useState('Рауан'); // Pre-fill with example data
  const [customerPhone, setCustomerPhone] = useState('87089217812'); // Pre-fill with example data
  const [customerAddress, setCustomerAddress] = useState('17-44-42'); // Pre-fill with example data
  const [orderComment, setOrderComment] = useState('');

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    const subtotal = getSubtotal();
    const totalDeliveryCost = deliveryMethod === 'delivery' ? DELIVERY_COST : 0;
    return subtotal + totalDeliveryCost;
  };

  const handleClearCart = () => {
    Alert.alert(
      'Очистить корзину?',
      'Вы уверены, что хотите удалить все товары из корзины?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Очистить', onPress: () => {
            clearCart();
            showToast('Корзина очищена', 'info');
        }},
      ]
    );
  };

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) {
      showToast('Корзина пуста. Добавьте товары для заказа.', 'error');
      return;
    }
    if (!customerName || !customerPhone || (deliveryMethod === 'delivery' && !customerAddress)) {
      showToast('Пожалуйста, заполните все обязательные поля для заказа.', 'error');
      return;
    }

    const orderDetails = cart.map(item => 
      `- ${item.name} (${item.quantity || 1} шт.) - ${item.price.toLocaleString()} ₸`
    ).join('\n');
    
    const message = `*Новый заказ*\n\n` +
                    `*Имя:* ${customerName}\n` +
                    `*Телефон:* ${customerPhone}\n` +
                    `*Способ получения:* ${deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}\n` +
                    (deliveryMethod === 'delivery' && customerAddress ? `*Адрес:* ${customerAddress}\n` : '') +
                    `*Способ оплаты:* ${paymentMethod === 'kaspi' ? 'Kaspi Перевод' : 'Наличными'}\n` +
                    (orderComment ? `*Комментарий:* ${orderComment}\n` : '') +
                    `\n*Товары:*\n${orderDetails}\n\n` +
                    `*Подытог:* ${getSubtotal().toLocaleString()} ₸\n` +
                    `*Доставка:* ${deliveryMethod === 'delivery' ? DELIVERY_COST.toLocaleString() : 0} ₸\n` +
                    `*Итого к оплате:* ${getTotalPrice().toLocaleString()} ₸`;

    const whatsappUrl = `whatsapp://send?phone=+77001234567&text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl).then(() => {
      showToast('Заказ отправлен в WhatsApp!', 'success');
      clearCart(); // Clear cart after successful order
    }).catch(() => {
      Alert.alert('Ошибка', 'WhatsApp не установлен на вашем устройстве');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Корзина</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={20} color="#FF69B4" />
              <Text style={styles.clearButtonText}>Очистить</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Delivery Method */}
            <Text style={styles.sectionTitle}>Способ получения</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  deliveryMethod === 'delivery' && styles.activeToggleButton,
                  { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }
                ]}
                onPress={() => setDeliveryMethod('delivery')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  deliveryMethod === 'delivery' && styles.activeToggleButtonText
                ]}>Доставка</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  deliveryMethod === 'pickup' && styles.activeToggleButton,
                  { borderTopRightRadius: 12, borderBottomRightRadius: 12 }
                ]}
                onPress={() => setDeliveryMethod('pickup')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  deliveryMethod === 'pickup' && styles.activeToggleButtonText
                ]}>Самовывоз</Text>
              </TouchableOpacity>
            </View>

            {/* Your Details */}
            <Text style={styles.sectionTitle}>Ваши данные</Text>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Имя"
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Телефон"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>
              {deliveryMethod === 'delivery' && (
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Адрес"
                    value={customerAddress}
                    onChangeText={setCustomerAddress}
                    placeholderTextColor="#999"
                  />
                </View>
              )}
              <View style={styles.inputContainer}>
                <Ionicons name="chatbox-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Комментарий к заказу (необязательно)"
                  value={orderComment}
                  onChangeText={setOrderComment}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Payment Method */}
            <Text style={styles.sectionTitle}>Способ оплаты</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  paymentMethod === 'kaspi' && styles.activeToggleButton,
                  { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }
                ]}
                onPress={() => setPaymentMethod('kaspi')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  paymentMethod === 'kaspi' && styles.activeToggleButtonText
                ]}>Kaspi Перевод</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  paymentMethod === 'cash' && styles.activeToggleButton,
                  { borderTopRightRadius: 12, borderBottomRightRadius: 12 }
                ]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  paymentMethod === 'cash' && styles.activeToggleButtonText
                ]}>Наличными</Text>
              </TouchableOpacity>
            </View>

            {/* Order Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Подытог</Text>
                <Text style={styles.summaryValue}>₸{getSubtotal().toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Доставка</Text>
                <Text style={styles.summaryValue}>₸{deliveryMethod === 'delivery' ? DELIVERY_COST.toLocaleString() : 0}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Итого</Text>
                <Text style={styles.totalPrice}>₸{getTotalPrice().toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {cart.length > 0 && (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppOrder}>
              <Text style={styles.whatsappButtonText}>Отправить в WhatsApp</Text>
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#FF69B4',
    marginLeft: 5,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 100, // Ensure space for the bottom bar
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeToggleButton: {
    backgroundColor: '#66BB6A', // Green color from image
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeToggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
    width: '100%',
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BasketScreen;
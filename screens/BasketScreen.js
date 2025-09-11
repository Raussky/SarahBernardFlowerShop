import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../src/context/CartContext';
import { AuthContext } from '../src/context/AuthContext';
import * as Linking from 'expo-linking';
import { useToast } from '../src/components/ToastProvider';
import { DELIVERY_COST, WHATSAPP_PHONE } from '../src/config/constants';
import { supabase } from '../src/integrations/supabase/client';

const BasketScreen = ({ navigation }) => {
  const { cart, clearCart, updateItemQuantity, removeFromCart } = useContext(CartContext);
  const { user, profile } = useContext(AuthContext);
  const { showToast } = useToast();

  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('kaspi');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderComment, setOrderComment] = useState('');

  useEffect(() => {
    if (profile) {
      setCustomerName(profile.first_name || '');
    } else if (user) {
      setCustomerName(user.email || '');
    }
  }, [profile, user]);

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
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

  const handleWhatsAppOrder = async () => {
    if (!customerName || !customerPhone || (deliveryMethod === 'delivery' && !customerAddress)) {
      showToast('Пожалуйста, заполните все обязательные поля для заказа.', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Ваша корзина пуста.', 'error');
      return;
    }

    const subtotal = getSubtotal();
    const total = getTotalPrice();

    try {
      // 1. Insert order into Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: deliveryMethod === 'delivery' ? customerAddress : null,
          delivery_method: deliveryMethod,
          payment_method: paymentMethod,
          order_comment: orderComment,
          total_price: total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_variant_id: item.variantId,
        product_name: item.name || item.nameRu,
        product_image: item.image,
        variant_size: item.size,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));

      const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems);
      if (orderItemsError) throw orderItemsError;

      // 3. Decrement stock
      const itemsToDecrement = cart.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      }));
      const { error: decrementError } = await supabase.rpc('decrement_stock', { items_to_decrement: itemsToDecrement });
      if (decrementError) {
        console.error("Stock decrement error:", decrementError);
        // In a real app, you might want to handle this more gracefully, e.g., by cancelling the order.
        // For now, we'll just log it and proceed.
        showToast('Ошибка при обновлении остатков', 'error');
      }

      // 4. Send WhatsApp message
      const orderDetails = cart.map(item => 
        `- ${item.name || item.nameRu} (Размер: ${item.size}, ${item.quantity} шт.) - ${(item.price * item.quantity).toLocaleString()} ₸`
      ).join('\n');
      
      const message = `*Новый заказ #${orderData.id.substring(0, 8)}*\n\n` +
                      `*Имя:* ${customerName}\n` +
                      `*Телефон:* ${customerPhone}\n` +
                      `*Способ получения:* ${deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}\n` +
                      (deliveryMethod === 'delivery' && customerAddress ? `*Адрес:* ${customerAddress}\n` : '') +
                      `*Способ оплаты:* ${paymentMethod === 'kaspi' ? 'Kaspi Перевод' : 'Наличными'}\n` +
                      (orderComment ? `*Комментарий:* ${orderComment}\n` : '') +
                      `\n*Товары:*\n${orderDetails}\n\n` +
                      `*Подытог:* ${subtotal.toLocaleString()} ₸\n` +
                      `*Доставка:* ${deliveryMethod === 'delivery' ? DELIVERY_COST.toLocaleString() : 0} ₸\n` +
                      `*Итого к оплате:* ${total.toLocaleString()} ₸`;

      const whatsappUrl = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
      
      Linking.openURL(whatsappUrl).then(() => {
        showToast('Заказ отправлен в WhatsApp и сохранен!', 'success');
        clearCart();
        navigation.navigate('Home');
      }).catch(() => {
        Alert.alert('Ошибка', 'WhatsApp не установлен на вашем устройстве, но ваш заказ успешно сохранен. Мы скоро с вами свяжемся.');
        clearCart();
        navigation.navigate('Home');
      });

    } catch (error) {
      console.error("Error placing order:", error);
      showToast(`Ошибка при оформлении заказа: ${error.message}`, 'error');
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name || item.nameRu}</Text>
        <Text style={styles.itemSize}>Размер: {item.size}</Text>
        <Text style={styles.itemPrice}>₸{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.quantityControl}>
        <TouchableOpacity onPress={() => updateItemQuantity(item.cartItemId, item.quantity - 1)}>
          <Ionicons name="remove-circle-outline" size={28} color="#FF69B4" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateItemQuantity(item.cartItemId, item.quantity + 1)}>
          <Ionicons name="add-circle-outline" size={28} color="#FF69B4" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => removeFromCart(item.cartItemId)}>
        <Ionicons name="trash-outline" size={24} color="#999" />
      </TouchableOpacity>
    </View>
  );

  const renderOrderFormInputs = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Способ получения</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, deliveryMethod === 'delivery' && styles.activeToggleButton]}
          onPress={() => setDeliveryMethod('delivery')}
        >
          <Text style={[styles.toggleButtonText, deliveryMethod === 'delivery' && styles.activeToggleButtonText]}>Доставка</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, deliveryMethod === 'pickup' && styles.activeToggleButton]}
          onPress={() => setDeliveryMethod('pickup')}
        >
          <Text style={[styles.toggleButtonText, deliveryMethod === 'pickup' && styles.activeToggleButtonText]}>Самовывоз</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Ваши данные</Text>
      <View style={styles.inputGroup}>
        <TextInput style={styles.input} placeholder="Имя" value={customerName} onChangeText={setCustomerName} />
        <TextInput style={styles.input} placeholder="Телефон" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
        {deliveryMethod === 'delivery' && (
          <TextInput style={styles.input} placeholder="Адрес" value={customerAddress} onChangeText={setCustomerAddress} />
        )}
        <TextInput style={styles.input} placeholder="Комментарий к заказу" value={orderComment} onChangeText={setOrderComment} />
      </View>

      <Text style={styles.sectionTitle}>Способ оплаты</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, paymentMethod === 'kaspi' && styles.activeToggleButton]}
          onPress={() => setPaymentMethod('kaspi')}
        >
          <Text style={[styles.toggleButtonText, paymentMethod === 'kaspi' && styles.activeToggleButtonText]}>Kaspi Перевод</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, paymentMethod === 'cash' && styles.activeToggleButton]}
          onPress={() => setPaymentMethod('cash')}
        >
          <Text style={[styles.toggleButtonText, paymentMethod === 'cash' && styles.activeToggleButtonText]}>Наличными</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Корзина</Text>
          {cart.length > 0 && (
            <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={20} color="#FF69B4" />
              <Text style={styles.clearButtonText}>Очистить</Text>
            </TouchableOpacity>
          )}
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={100} color="#FF69B4" />
            <Text style={styles.emptyText}>
              Ваша корзина пуста. Добавьте что-нибудь красивое!
            </Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.shopButtonText}>Перейти к покупкам</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={item => item.cartItemId}
              contentContainerStyle={styles.listContainer}
              ListFooterComponent={renderOrderFormInputs}
            />
            <View style={styles.fixedFooter}>
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
              <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppOrder}>
                <Text style={styles.whatsappButtonText}>Отправить в WhatsApp</Text>
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  clearButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE4E1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  clearButtonText: { color: '#FF69B4', marginLeft: 5, fontWeight: '600' },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999', marginTop: 20, marginBottom: 30, textAlign: 'center', paddingHorizontal: 40 },
  shopButton: { backgroundColor: '#FF69B4', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  shopButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 260
  },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  itemSize: { fontSize: 12, color: '#666', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#666' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantityText: { fontSize: 18, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  deleteButton: { marginLeft: 15, padding: 5 },
  formContainer: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  toggleContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: '#FF69B4', overflow: 'hidden' },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  activeToggleButton: { backgroundColor: '#FF69B4' },
  toggleButtonText: { fontSize: 16, color: '#FF69B4', fontWeight: '600' },
  activeToggleButtonText: { color: '#fff' },
  inputGroup: { gap: 10 },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 16 },
  fixedFooter: { 
    position: 'absolute', 
    bottom: 80,
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 10,
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0', 
  },
  summaryContainer: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 16, color: '#666' },
  summaryValue: { fontSize: 16, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#FF69B4' },
  whatsappButton: { 
    backgroundColor: '#25D366', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 15, 
    borderRadius: 25, 
    gap: 10,
    marginTop: 15,
  },
  whatsappButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default BasketScreen;
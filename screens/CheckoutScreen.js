import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../src/context/CartContext';
import { AuthContext } from '../src/context/AuthContext';
import * as Linking from 'expo-linking';
import { useToast } from '../src/components/ToastProvider';
import { DELIVERY_COST, WHATSAPP_PHONE, ERROR_MESSAGES, DELIVERY_METHODS } from '../src/config/constants';
import { supabase } from '../src/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import MaskInput from 'react-native-mask-input';
import PrimaryButton from '../src/components/PrimaryButton';
import TimePickerModal from '../src/components/TimePickerModal';
import WhatsappInfoModal from '../src/components/WhatsappInfoModal';
import { validateName, validatePhoneNumber, validateAddress, sanitizeString } from '../src/utils/validation';
import { logger } from '../src/utils/logger';

const CheckoutScreen = ({ navigation }) => {
  const { cart, clearCart } = useContext(CartContext);
  const { user, profile } = useContext(AuthContext);
  const { showToast } = useToast();

  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('kaspi');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderComment, setOrderComment] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [deliveryTimeError, setDeliveryTimeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isWhatsappInfoModalVisible, setIsWhatsappInfoModalVisible] = useState(false);

  useEffect(() => {
    if (profile) {
      setCustomerName(profile.first_name || '');
      setCustomerPhone(profile.phone_number || '');
    } else if (user) {
      setCustomerName(user.email || '');
    }

    const fetchDefaultAddress = async () => {
      if (user) {
        const { data } = await supabase
          .from('addresses')
          .select('address_line1')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        
        if (data && data.address_line1) {
          setCustomerAddress(data.address_line1);
        }
      }
    };

    fetchDefaultAddress();
  }, [profile, user]);

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setPhoneError('');
    setAddressError('');
    setDeliveryTimeError('');

    // Validate name using utility
    const nameValidation = validateName(customerName);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error);
      isValid = false;
    }

    // Validate phone using utility
    const phoneValidation = validatePhoneNumber(customerPhone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error);
      isValid = false;
    }

    // Validate address for delivery
    if (deliveryMethod === DELIVERY_METHODS.DELIVERY) {
      const addressValidation = validateAddress(customerAddress);
      if (!addressValidation.isValid) {
        setAddressError(addressValidation.error);
        isValid = false;
      }

      if (!deliveryTime.trim()) {
        setDeliveryTimeError('Выберите время доставки');
        isValid = false;
      }
    }

    if (!isValid) {
      showToast('Пожалуйста, заполните все обязательные поля корректно.', 'error');
      logger.warn('Checkout form validation failed', {
        nameValid: nameValidation.isValid,
        phoneValid: phoneValidation.isValid,
        context: 'CheckoutScreen'
      });
    }
    return isValid;
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      // This safely handles all three cases:
      // 1. Guest cart item (product): item.product_variants.price
      // 2. Guest cart item (combo): item.combos.price
      // 3. Logged-in user cart item: item.product_variants?.price or item.combos?.price
      const price = item.product_variants?.price || item.combos?.price || 0;
      return total + price * item.quantity;
    }, 0);
  };
  const getTotalPrice = () => getSubtotal() + (deliveryMethod === 'delivery' ? DELIVERY_COST : 0);
 
  const finalizeOrder = (orderId) => {
    clearCart();
    setCurrentStep(2);
    navigation.replace('OrderConfirmation', { orderId });
  };

  const getErrorMessage = (error) => {
    logger.error('Error during checkout', error, {
      context: 'CheckoutScreen',
      deliveryMethod,
      paymentMethod,
      cartItemsCount: cart.length
    });

    if (error.message.includes('Network request failed')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return 'Ошибка базы данных: Пожалуйста, попробуйте еще раз.';
    }
    if (error.message.includes('decrement_stock') || error.message.includes('decrement_stock_from_combo')) {
      return ERROR_MESSAGES.INSUFFICIENT_STOCK;
    }
    return ERROR_MESSAGES.ORDER_FAILED;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm() || cart.length === 0) {
      if (cart.length === 0) showToast('Ваша корзина пуста.', 'error');
      return;
    }

    setIsSubmitting(true);
    const subtotal = getSubtotal();
    const total = getTotalPrice();
    const newOrderId = uuidv4();

    try {
      // Sanitize all user inputs before sending to database
      const orderData = {
        id: newOrderId,
        user_id: user?.id || null,
        customer_name: sanitizeString(customerName),
        customer_phone: sanitizeString(customerPhone),
        customer_address: deliveryMethod === 'delivery' ? sanitizeString(customerAddress) : null,
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        order_comment: sanitizeString(orderComment),
        delivery_time: deliveryMethod === 'delivery' ? deliveryTime : null,
        total_price: total,
        status: 'pending',
      };

      logger.info('Creating order', {
        orderId: newOrderId,
        deliveryMethod,
        paymentMethod,
        itemCount: cart.length,
        total,
        context: 'CheckoutScreen'
      });
      const { error: orderError } = await supabase.from('orders').insert(orderData);
      if (orderError) throw orderError;

      const orderItems = cart.map(item => {
        const isCombo = !!item.combo_id;
        const price = item.product_variants?.price || item.combos?.price || 0;

        // Unified logic for all cart item types
        const comboId = item.combo_id || item.combos?.id || null;
        
        // For guest cart items, the variant's product_id is nested differently
        const productId = isCombo
          ? item.combo_id || item.combos?.id
          : item.product_variants?.product_id || item.product_variants?.id;
        
        // For guest cart items, the variantId is on the item directly
        const productVariantId = isCombo
          ? null
          : item.product_variant_id || item.product_variants?.variantId || item.product_variants?.id;

        return {
          order_id: newOrderId,
          combo_id: comboId,
          product_id: productId,
          product_variant_id: productVariantId,
          product_name: item.combos?.name || item.product_variants?.products?.name || item.product_variants?.name || 'Unknown Product',
          product_image: item.combos?.image || item.product_variants?.products?.image || item.product_variants?.image,
          variant_size: !isCombo ? item.product_variants?.size : null,
          quantity: item.quantity,
          price_at_purchase: price,
        };
      });
      const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems);
      if (orderItemsError) throw orderItemsError;

      // Update stock and purchase counts
      // Update stock and purchase counts
      const productsToUpdate = cart.filter(item => !!item.product_variant_id).map(item => ({ variant_id: item.product_variant_id, quantity: item.quantity }));
      if (productsToUpdate.length > 0) {
        const { error: decrementError } = await supabase.rpc('decrement_stock', { items_to_decrement: productsToUpdate });
        if (decrementError) logger.error('Stock decrement error', decrementError, { context: 'CheckoutScreen', orderId: newOrderId });
        const { error: incrementError } = await supabase.rpc('increment_purchase_counts', { items: productsToUpdate });
        if (incrementError) logger.error('Purchase count increment error', incrementError, { context: 'CheckoutScreen', orderId: newOrderId });
      }

      const combosToUpdate = cart.filter(item => !!item.combo_id);
      for (const combo of combosToUpdate) {
        const { error: comboDecrementError } = await supabase.rpc('decrement_stock_from_combo', { p_combo_id: (combo.combos?.id || combo.combo_id), p_quantity: combo.quantity });
        if (comboDecrementError) logger.error('Combo stock decrement error', comboDecrementError, { context: 'CheckoutScreen', orderId: newOrderId, comboId: combo.combo_id });
      }

      const orderDetails = cart.map(item => {
        const isCombo = !!item.combo_id;
        const price = item.product_variants?.price || item.combos?.price || 0;
        const name = item.combos?.name || item.product_variants?.products?.name || 'Unknown';
        const size = item.product_variants?.size;
        return isCombo
          ? `- ${name} (Комбо, ${item.quantity} шт.) - ${(price * item.quantity).toLocaleString()} ₸`
          : `- ${name} (Размер: ${size}, ${item.quantity} шт.) - ${(price * item.quantity).toLocaleString()} ₸`;
      }).join('\n');
      
      const message = `*Новый заказ #${newOrderId.substring(0, 8)}*\n\n` +
                      `*Имя:* ${customerName}\n` +
                      `*Телефон:* ${customerPhone}\n` +
                      `*Способ получения:* ${deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}\n` +
                      (deliveryMethod === 'delivery' ? `*Адрес:* ${customerAddress}\n` : '') +
                      (deliveryMethod === 'delivery' ? `*Время доставки:* ${deliveryTime}\n` : '') +
                      `*Способ оплаты:* ${paymentMethod === 'kaspi' ? 'Kaspi Перевод' : 'Наличными'}\n` +
                      (orderComment ? `*Комментарий:* ${orderComment}\n` : '') +
                      `\n*Товары:*\n${orderDetails}\n\n` +
                      `*Подытог:* ${subtotal.toLocaleString()} ₸\n` +
                      `*Доставка:* ${deliveryMethod === 'delivery' ? DELIVERY_COST.toLocaleString() : 0} ₸\n` +
                      `*Итого к оплате:* ${total.toLocaleString()} ₸`;

      const whatsappUrl = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
      
      try {
        await Linking.openURL(whatsappUrl);
        showToast('Заказ отправлен в WhatsApp и сохранен!', 'success');
        finalizeOrder(newOrderId);
      } catch {
        Alert.alert(
          'WhatsApp не установлен',
          `Ваш заказ успешно сохранен, и мы свяжемся с вами в ближайшее время. Вы также можете позвонить нам по номеру ${WHATSAPP_PHONE}.`,
          [
            { text: 'ОК', style: 'cancel', onPress: () => finalizeOrder(newOrderId) },
            {
              text: 'Позвонить',
              onPress: () => {
                Linking.openURL(`tel:${WHATSAPP_PHONE}`);
                finalizeOrder(newOrderId);
              }
            },
          ]
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const phoneMask = ['+', '7', ' ', '(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/];
 
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={isSubmitting}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Оформление заказа</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          {['Данные', 'Подтверждение'].map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[styles.progressDot, currentStep >= index + 1 && styles.activeProgressDot]} />
              <Text style={[styles.progressText, currentStep >= index + 1 && styles.activeProgressText]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Scrollable Form */}
          <ScrollView 
            style={styles.scrollViewContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              
              {/* Delivery Method */}
              <Text style={styles.sectionTitle}>Способ получения</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, deliveryMethod === 'delivery' && styles.activeToggleButton]}
                  onPress={() => setDeliveryMethod('delivery')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.toggleButtonText, deliveryMethod === 'delivery' && styles.activeToggleButtonText]}>Доставка</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, deliveryMethod === 'pickup' && styles.activeToggleButton]}
                  onPress={() => setDeliveryMethod('pickup')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.toggleButtonText, deliveryMethod === 'pickup' && styles.activeToggleButtonText]}>Самовывоз</Text>
                </TouchableOpacity>
              </View>
   
              {/* Customer Data */}
              <Text style={styles.sectionTitle}>Ваши данные</Text>
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, nameError ? styles.inputWrapperError : {}]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Имя"
                    value={customerName}
                    onChangeText={(text) => { setCustomerName(text); setNameError(''); }}
                    placeholderTextColor="#999"
                    editable={!isSubmitting}
                  />
                  {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
                </View>
                
                <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : {}]}>
                  <MaskInput
                    style={styles.input}
                    placeholder="Телефон"
                    value={customerPhone}
                    onChangeText={(masked, unmasked) => { setCustomerPhone(masked); setPhoneError(''); }}
                    mask={phoneMask}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                    editable={!isSubmitting}
                  />
                  {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
                </View>
                
                {deliveryMethod === 'delivery' && (
                  <>
                    <View style={[styles.inputWrapper, addressError ? styles.inputWrapperError : {}]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Адрес"
                        value={customerAddress}
                        onChangeText={(text) => { setCustomerAddress(text); setAddressError(''); }}
                        placeholderTextColor="#999"
                        editable={!isSubmitting}
                      />
                      {!!addressError && <Text style={styles.errorText}>{addressError}</Text>}
                    </View>
                    
                    {/* Delivery Time Picker */}
                    <View style={[styles.inputWrapper, deliveryTimeError ? styles.inputWrapperError : {}]}>
                      <TouchableOpacity
                        style={styles.input}
                        onPress={() => setIsTimePickerVisible(true)}
                        disabled={isSubmitting}
                      >
                        <Text style={deliveryTime ? styles.inputText : styles.placeholderText}>
                          {deliveryTime || "Выберите время доставки"}
                        </Text>
                      </TouchableOpacity>
                      {!!deliveryTimeError && <Text style={styles.errorText}>{deliveryTimeError}</Text>}
                    </View>
                  </>
                )}
                
                <TextInput
                  style={styles.input}
                  placeholder="Комментарий к заказу"
                  value={orderComment}
                  onChangeText={setOrderComment}
                  placeholderTextColor="#999"
                  editable={!isSubmitting}
                  multiline
                />
              </View>
   
              {/* Payment Method */}
              <Text style={styles.sectionTitle}>Способ оплаты</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, paymentMethod === 'kaspi' && styles.activeToggleButton]}
                  onPress={() => setPaymentMethod('kaspi')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.toggleButtonText, paymentMethod === 'kaspi' && styles.activeToggleButtonText]}>Kaspi Перевод</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, paymentMethod === 'cash' && styles.activeToggleButton]}
                  onPress={() => setPaymentMethod('cash')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.toggleButtonText, paymentMethod === 'cash' && styles.activeToggleButtonText]}>Наличными</Text>
                </TouchableOpacity>
              </View>
              
            </View>
            <View style={styles.buttonContainer}>
            <PrimaryButton
              title="Отправить в WhatsApp"
              onPress={() => setIsWhatsappInfoModalVisible(true)}
              loading={isSubmitting}
              icon="logo-whatsapp"
            />
            </View>
          </ScrollView>
          
        </View>

        {/* Summary Footer - Fixed at bottom */}
        <View style={styles.summaryFooter}>
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
        </View>

      </KeyboardAvoidingView>

      {/* Modals */}
      <TimePickerModal
        isVisible={isTimePickerVisible}
        onClose={() => setIsTimePickerVisible(false)}
        onSelectTime={(time) => {
          setDeliveryTime(time);
          setDeliveryTimeError('');
          setIsTimePickerVisible(false);
        }}
      />
      
      <WhatsappInfoModal
        isVisible={isWhatsappInfoModalVisible}
        onClose={() => setIsWhatsappInfoModalVisible(false)}
        onConfirm={() => {
          setIsWhatsappInfoModalVisible(false);
          handlePlaceOrder();
        }}
      />
      
    </SafeAreaView>
  );
};
 
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  
  keyboardContainer: {
    flex: 1,
  },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  
  progressBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  progressStep: {
    alignItems: 'center',
  },
  
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginBottom: 5,
  },
  
  activeProgressDot: {
    backgroundColor: '#FF69B4',
  },
  
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  
  activeProgressText: {
    fontWeight: 'bold',
    color: '#FF69B4',
  },

  content: {
    flex: 1,
    flexDirection: 'column',
  },
  
  scrollViewContainer: {
    flex: 1,
  },
  
  scrollContent: { 
    padding: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  
  formContainer: {},
  
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    marginTop: 10 
  },
  
  toggleContainer: { 
    flexDirection: 'row', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#FF69B4', 
    overflow: 'hidden',
    marginBottom: 20,
  },
  
  toggleButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  
  activeToggleButton: { 
    backgroundColor: '#FF69B4' 
  },
  
  toggleButtonText: { 
    fontSize: 16, 
    color: '#FF69B4', 
    fontWeight: '600' 
  },
  
  activeToggleButtonText: { 
    color: '#fff' 
  },
  
  inputGroup: { 
    gap: 10,
    marginBottom: 20,
  },
  
  inputWrapper: { 
    marginBottom: 10 
  },
  
  input: { 
    backgroundColor: '#f5f5f5', 
    padding: 15, 
    borderRadius: 10, 
    fontSize: 16 
  },
  
  inputWrapperError: { 
    borderColor: '#FF0000', 
    borderWidth: 1, 
    borderRadius: 10 
  },
  
  errorText: { 
    color: '#FF0000', 
    fontSize: 12, 
    marginTop: 5, 
    marginLeft: 15 
  },
  
  inputText: { 
    fontSize: 16, 
    color: '#333' 
  },
  
  placeholderText: { 
    fontSize: 16, 
    color: '#999' 
  },

  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  
  summaryFooter: {
    backgroundColor: '#fff', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0',
  },
  
  summaryContainer: { 
    backgroundColor: '#f9f9f9', 
    borderRadius: 12, 
    padding: 15 
  },
  
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  
  summaryLabel: { 
    fontSize: 16, 
    color: '#666' 
  },
  
  summaryValue: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  totalRow: { 
    borderTopWidth: 1, 
    borderTopColor: '#eee', 
    paddingTop: 8, 
    marginTop: 4 
  },
  
  totalLabel: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  
  totalPrice: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FF69B4' 
  },
});
 
export default CheckoutScreen;
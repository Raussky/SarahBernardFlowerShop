import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../src/context/CartContext';
import { useToast } from '../src/components/ToastProvider';
import { DELIVERY_COST } from '../src/config/constants';
import { supabase } from '../src/integrations/supabase/client';
import PrimaryButton from '../src/components/PrimaryButton';
import { FONTS } from '../src/config/theme';
import EmptyState from '../src/components/EmptyState';

const BasketScreen = ({ navigation }) => {
  const { cart, clearCart, updateItemQuantity, removeFromCart } = useContext(CartContext);
  const { showToast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);

  const getSubtotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const getTotalPrice = () => getSubtotal() + DELIVERY_COST; // Assuming delivery is default for summary

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

  const handleProductPress = async (item) => {
    if (item.type === 'combo') {
      navigation.navigate('Combo', { comboId: item.id });
      return;
    }
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*, categories(name, name_en), product_variants(*)')
        .eq('id', item.id)
        .single();
      
      if (error) throw error;

      if (product) {
        navigation.navigate('Product', { product });
      } else {
        showToast('Товар не найден', 'error');
      }
    } catch (error) {
      showToast('Не удалось открыть товар', 'error');
    } finally {
      setIsNavigating(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleProductPress(item)} activeOpacity={0.7} disabled={isNavigating}>
      <View style={styles.cartItem}>
        {isNavigating && <ActivityIndicator style={StyleSheet.absoluteFill} color="#FF69B4" />}
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name || item.nameRu}</Text>
          {item.type === 'combo' ? (
           <Text style={styles.itemSize}>Комбо-набор</Text>
          ) : (
           <Text style={styles.itemSize}>Размер: {item.size}</Text>
          )}
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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
        <EmptyState
          icon="cart-outline"
          title="Ваша корзина пуста"
          message="Добавьте что-нибудь красивое, чтобы сделать заказ!"
          buttonText="Перейти к покупкам"
          onButtonPress={() => navigation.navigate('Main', { screen: 'Home' })}
        />
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={item => item.cartItemId}
            contentContainerStyle={styles.listContainer}
          />
          <View style={styles.fixedFooter}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Подытог</Text>
                <Text style={styles.summaryValue}>₸{getSubtotal().toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Доставка (примерно)</Text>
                <Text style={styles.summaryValue}>₸{DELIVERY_COST.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Итого</Text>
                <Text style={styles.totalPrice}>₸{getTotalPrice().toLocaleString()}</Text>
              </View>
            </View>
            <PrimaryButton
              title="Перейти к оформлению"
              onPress={() => navigation.navigate('Checkout')}
              icon="arrow-forward"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold },
  clearButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE4E1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  clearButtonText: { color: '#FF69B4', marginLeft: 5, fontFamily: FONTS.semiBold },
  listContainer: { paddingHorizontal: 20, paddingBottom: 260 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  itemSize: { fontSize: 12, color: '#666', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#666' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantityText: { fontSize: 18, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  deleteButton: { marginLeft: 15, padding: 5 },
  fixedFooter: { position: 'absolute', bottom: 80, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  summaryContainer: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15, marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 16, color: '#666' },
  summaryValue: { fontSize: 16, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#FF69B4' },
});

export default BasketScreen;
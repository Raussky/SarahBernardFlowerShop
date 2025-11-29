import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  // Memoize expensive calculations
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = item.product_variants?.price || item.combos?.price || 0;
      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return subtotal + DELIVERY_COST;
  }, [subtotal]);

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
    const productDetails = item.product_variants?.products || item.combos;
    if (!productDetails) return;

    if (item.combo_id) {
      navigation.navigate('Combo', { comboId: productDetails.id });
    } else {
      navigation.navigate('Product', { product: productDetails });
    }
  };

  const renderCartItem = ({ item }) => {
    const productDetails = item.product_variants?.products || item.combos;
    const variantDetails = item.product_variants;
    const price = variantDetails?.price || productDetails?.price || 0;

    if (!productDetails) {
      return <View style={styles.cartItem}><Text>Товар не найден</Text></View>;
    }

    return (
      <TouchableOpacity onPress={() => handleProductPress(item)} activeOpacity={0.7}>
        <View style={styles.cartItem}>
          <Image source={{ uri: item.combos?.image || item.product_variants?.products?.image }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.itemName} numberOfLines={1}>{productDetails.name}</Text>
            {item.combo_id ? (
              <Text style={styles.itemSize}>Комбо-набор</Text>
            ) : (
              <Text style={styles.itemSize}>Размер: {variantDetails?.size}</Text>
            )}
            <Text style={styles.itemPrice}>₸{price.toLocaleString()}</Text>
          </View>
          <View style={styles.quantityControl}>
            <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity - 1)}>
              <Ionicons name="remove-circle-outline" size={28} color="#FF69B4" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity + 1)}>
              <Ionicons name="add-circle-outline" size={28} color="#FF69B4" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => removeFromCart(item.id)}>
            <Ionicons name="trash-outline" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: 260 + insets.bottom }
            ]}
          />
          <View style={[
            styles.fixedFooter,
            { bottom: 80 + insets.bottom }
          ]}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Подытог</Text>
                <Text style={styles.summaryValue}>₸{subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Доставка (примерно)</Text>
                <Text style={styles.summaryValue}>₸{DELIVERY_COST.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Итого</Text>
                <Text style={styles.totalPrice}>₸{totalPrice.toLocaleString()}</Text>
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
  listContainer: { paddingHorizontal: 20 },
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
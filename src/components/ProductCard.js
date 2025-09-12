import React, { useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';

const { width } = Dimensions.get('window');

const ProductCard = ({ product, navigation }) => {
  const { toggleSaved, saved } = useContext(CartContext);
  const isSaved = saved.find(i => i.id === product.id);

  const displayPrice = product.product_variants && product.product_variants.length > 0
    ? product.product_variants[0].price
    : 0;

  const isOutOfStock = !product.product_variants || product.product_variants.every(v => v.stock_quantity <= 0);

  const cardScale = useRef(new Animated.Value(1)).current;
  const handleCardPressIn = () => {
    Animated.spring(cardScale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handleCardPressOut = () => {
    Animated.spring(cardScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const heartScale = useRef(new Animated.Value(1)).current;
  const handleHeartPressIn = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.productCard, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Product', { product })}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        activeOpacity={0.9}
        disabled={isOutOfStock}
      >
        <Image source={{ uri: product.image }} style={styles.productImage} />
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Нет в наличии</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name || product.name_ru}</Text>
          <Text style={styles.productDesc} numberOfLines={1}>{product.categories?.name || 'Категория'}</Text>
          <Text style={styles.productPrice}>₸{displayPrice.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.heartIcon}
        onPress={() => {
          handleHeartPressIn();
          toggleSaved(product);
        }}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={24}
            color={isSaved ? "#FF69B4" : "#fff"}
          />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
        onPress={() => navigation.navigate('Product', { product })}
        disabled={isOutOfStock}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  outOfStockText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontWeight: 'bold',
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#0F172A',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 24,
  },
});

export default ProductCard;
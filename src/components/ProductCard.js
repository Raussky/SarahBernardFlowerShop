import React, { useContext, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { useToast } from './ToastProvider';
import { FONTS } from '../config/theme';
import VariantSelectorModal from './VariantSelectorModal';
import { AnimationContext } from '../context/AnimationContext';

const { width } = Dimensions.get('window');

const ProductCard = ({ product, navigation }) => {
  const { toggleSaved, saved, addToCart } = useContext(CartContext);
  const { startAddToCartAnimation } = useContext(AnimationContext);
  const { showToast } = useToast();
  const isSaved = saved.find(i => i.id === product.id);
  const imageRef = useRef(null);

  const [isModalVisible, setModalVisible] = useState(false);

  const displayPrice = product.product_variants && product.product_variants.length > 0
    ? product.product_variants[0].price
    : 0;

  const isOutOfStock = !product.product_variants || product.product_variants.every(v => v.stock_quantity <= 0);
  const hasSingleVariant = product.product_variants && product.product_variants.length === 1;
  const singleVariant = hasSingleVariant ? product.product_variants[0] : null;

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

  const handleAddToCart = (item) => {
    imageRef.current.measure((_fx, _fy, _w, _h, px, py) => {
      startAddToCartAnimation({ x: px, y: py }, item.image);
    });
    setTimeout(() => {
      addToCart(item);
      showToast('Товар добавлен в корзину', 'success');
    }, 500); // Delay cart update to allow animation to start
  };

  const handleAddToCartPress = () => {
    if (isOutOfStock) return;

    if (hasSingleVariant && singleVariant) {
      handleAddToCart({
        id: product.id,
        name: product.name,
        nameRu: product.name_ru,
        image: product.image,
        size: singleVariant.size,
        price: singleVariant.price,
        variantId: singleVariant.id,
        stock_quantity: singleVariant.stock_quantity,
      });
    } else {
      setModalVisible(true);
    }
  };

  return (
    <>
      <Animated.View style={[styles.productCard, { transform: [{ scale: cardScale }] }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Product', { product })}
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          activeOpacity={0.9}
          disabled={isOutOfStock}
        >
            <Animated.View ref={imageRef}>
              <Image source={{ uri: product.image }} style={styles.productImage} transition={300} />
            </Animated.View>
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          style={[styles.addToCartButton, isOutOfStock && styles.addButtonDisabled]}
          onPress={handleAddToCartPress}
          disabled={isOutOfStock}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
      
      <VariantSelectorModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        product={product}
        onAddToCart={handleAddToCart}
      />
    </>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
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
    zIndex: 10,
    elevation: 10,
  },
  productInfo: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 50, // Add more padding at the bottom for the absolute positioned button
  },
  productName: {
    fontSize: 16, // Slightly larger
    fontFamily: FONTS.bold, // Bolder
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 12, // Slightly smaller
    color: '#999', // Lighter color
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18, // Larger
    fontFamily: FONTS.bold,
    color: '#FF69B4', // Brand color
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#333',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
});

export default ProductCard;
import React, { useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';

const { width } = Dimensions.get('window');

const ProductCard = ({ product, navigation }) => {
  const { toggleSaved, saved } = useContext(CartContext);
  const isSaved = saved.find(i => i.id === product.id);

  // Use the price from the first variant as the display price
  const displayPrice = product.product_variants && product.product_variants.length > 0
    ? product.product_variants[0].price
    : 0;

  // Animation for card press
  const cardScale = useRef(new Animated.Value(1)).current;
  const handleCardPressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const handleCardPressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Animation for heart icon press
  const heartScale = useRef(new Animated.Value(1)).current;
  const handleHeartPressIn = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.productCard, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} // Make TouchableOpacity cover the whole card for press
        onPress={() => navigation.navigate('Product', { product })}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        activeOpacity={1} // Control opacity via Animated.View
      >
        <Image source={{ uri: product.image }} style={styles.productImage} />
        <TouchableOpacity 
          style={styles.heartIcon}
          onPress={(e) => {
            e.stopPropagation();
            handleHeartPressIn(); // Trigger heart animation
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
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name || product.name_ru}</Text>
          <Text style={styles.productDesc} numberOfLines={1}>{product.categories?.name || 'Категория'}</Text>
          <Text style={styles.productPrice}>₸{displayPrice.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('Product', { product })}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
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
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 24,
  },
});

export default ProductCard;
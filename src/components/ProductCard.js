import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
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

  return (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('Product', { product })}
    >
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <TouchableOpacity 
        style={styles.heartIcon}
        onPress={(e) => {
          e.stopPropagation();
          toggleSaved(product);
        }}
      >
        <Ionicons 
          name={isSaved ? "heart" : "heart-outline"} 
          size={24} 
          color={isSaved ? "#FF69B4" : "#fff"} 
        />
      </TouchableOpacity>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{product.name || product.name_ru}</Text>
        <Text style={styles.productDesc} numberOfLines={1}>{product.description || `Категория`}</Text>
        <Text style={styles.productPrice}>₸{displayPrice.toLocaleString()}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => navigation.navigate('Product', { product })}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  productDesc: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#1e3a8a',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default ProductCard;
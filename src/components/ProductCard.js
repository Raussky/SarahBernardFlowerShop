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
        <Text style={styles.productDesc} numberOfLines={1}>{product.categories?.name_en || 'Category'}</Text>
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
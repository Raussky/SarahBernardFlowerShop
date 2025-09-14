import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const RecommendedProductCard = ({ item, onAddToCart }) => {
  const displayPrice = item.product_variants && item.product_variants.length > 0
    ? item.product_variants[0].price
    : 0;

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} transition={300} />
      <Text style={styles.name} numberOfLines={1}>{item.name || item.name_ru}</Text>
      <View style={styles.bottomRow}>
        <Text style={styles.price}>₸{displayPrice.toLocaleString()}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(item)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 10,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF69B4',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecommendedProductCard;
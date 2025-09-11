import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../App';

const ProductScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const { addToCart, toggleSaved, saved } = useContext(CartContext);
  const [selectedSize, setSelectedSize] = useState('M');
  
  const isSaved = saved.find(item => item.id === product.id);

  const sizes = [
    { id: 'S', name: 'Маленький', price: product.price || 5000 },
    { id: 'M', name: 'Средний', price: (product.price || 5000) * 1.5 },
    { id: 'L', name: 'Большой', price: (product.price || 5000) * 2 },
  ];

  const selectedSizeData = sizes.find(s => s.id === selectedSize);

  const handleAddToCart = () => {
    const productWithSize = {
      ...product,
      size: selectedSize,
      price: selectedSizeData.price,
      name: `${product.name} (${selectedSizeData.name})`
    };
    
    addToCart(productWithSize);
    Alert.alert('Добавлено!', 'Товар добавлен в корзину');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleSaved(product)}>
          <Ionicons 
            name={isSaved ? "heart" : "heart-outline"} 
            size={24} 
            color="#FF69B4" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Image 
          source={{ uri: product.image || 'https://via.placeholder.com/400/FFB6C1/FFFFFF?text=Flower' }} 
          style={styles.productImage} 
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>
            {product.description || 'Красивый букет цветов высшего качества. Идеально подходит для подарка.'}
          </Text>

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= 4 ? "#FFD700" : "#DDD"}
                />
              ))}
            </View>
            <Text style={styles.rating}>4.8 (124 отзыва)</Text>
          </View>

          <View style={styles.sizesContainer}>
            <Text style={styles.sizeTitle}>Выберите размер:</Text>
            <View style={styles.sizes}>
              {sizes.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={[
                    styles.sizeButton,
                    selectedSize === size.id && styles.selectedSize
                  ]}
                  onPress={() => setSelectedSize(size.id)}
                >
                  <Text style={[
                    styles.sizeText,
                    selectedSize === size.id && styles.selectedSizeText
                  ]}>
                    {size.name}
                  </Text>
                  <Text style={[
                    styles.sizePrice,
                    selectedSize === size.id && styles.selectedSizeText
                  ]}>
                    ₸{size.price.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Детали:</Text>
            <View style={styles.detailItem}>
              <Ionicons name="flower-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Свежие цветы</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="car-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Быстрая доставка</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Гарантия качества</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Цена:</Text>
          <Text style={styles.price}>₸{selectedSizeData.price.toLocaleString()}</Text>
        </View>
        
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="basket-outline" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Добавить в корзину</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  content: {
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  sizesContainer: {
    marginBottom: 20,
  },
  sizeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  sizes: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  selectedSize: {
    borderColor: '#FF69B4',
    backgroundColor: '#FF69B4',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sizePrice: {
    fontSize: 12,
    color: '#666',
  },
  selectedSizeText: {
    color: '#fff',
  },
  details: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    gap: 15,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  addToCartButton: {
    backgroundColor: '#FF69B4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductScreen;

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../src/context/CartContext';
import { useToast } from '../src/components/ToastProvider';

const { width } = Dimensions.get('window');

const ProductScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const { addToCart } = useContext(CartContext);
  const { showToast } = useToast();
  
  const variants = product.product_variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants.length > 0 ? variants[0] : null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    product.image,
    'https://via.placeholder.com/400/FFB6C1/FFFFFF?text=Image2',
    'https://via.placeholder.com/400/FFC0CB/FFFFFF?text=Image3',
  ];

  const handleAddToCart = () => {
    if (!selectedVariant) {
      showToast('Выберите вариант товара', 'error');
      return;
    }
    const item = {
      id: product.id,
      name: product.name,
      nameRu: product.name_ru,
      image: product.image,
      size: selectedVariant.size,
      price: selectedVariant.price,
    };
    addToCart(item);
    showToast('Товар добавлен в корзину', 'success');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.productTitle}>{product.name || product.name_ru}</Text>

        <View style={styles.imageContainer}>
          <Image source={{ uri: images[currentImageIndex] }} style={styles.mainImage} />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailContainer}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.thumbnail,
                  currentImageIndex === index && styles.activeThumbnail
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.productInfo}>
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product details</Text>
            <Text style={styles.description}>
              {product.description || 'Красивый букет для любого случая.'}
            </Text>
          </View>

          {variants.length > 0 && (
            <View style={styles.sizeSection}>
              <Text style={styles.sectionTitle}>Варианты</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {variants.map((variant) => (
                  <TouchableOpacity
                    key={variant.id}
                    onPress={() => setSelectedVariant(variant)}
                    style={[
                      styles.sizeButton,
                      selectedVariant?.id === variant.id && styles.selectedSize
                    ]}
                  >
                    <Text style={[
                      styles.sizeText,
                      selectedVariant?.id === variant.id && styles.selectedSizeText
                    ]}>
                      {variant.size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>₸{(selectedVariant?.price || 0).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
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
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  mainImage: {
    width: width - 40,
    height: width - 40,
    alignSelf: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  thumbnailContainer: {
    paddingHorizontal: 20,
  },
  thumbnail: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  activeThumbnail: {
    borderColor: '#FF69B4',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  productInfo: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sizeSection: {
    marginBottom: 25,
  },
  sizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  selectedSize: {
    backgroundColor: '#FF69B4',
  },
  sizeText: {
    fontSize: 16,
    color: '#666',
  },
  selectedSizeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#999',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: '#FF69B4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductScreen;
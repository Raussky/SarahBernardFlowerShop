import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../src/context/CartContext';
import { useToast } from '../src/components/ToastProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../src/integrations/supabase/client';
import RecommendedProductCard from '../src/components/RecommendedProductCard';

const { width } = Dimensions.get('window');

const ProductScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const { addToCart } = useContext(CartContext);
  const { showToast } = useToast();
  
  const variants = product.product_variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants.length > 0 ? variants[0] : null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const fetchRecommended = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .neq('id', product.id)
        .limit(5);
      
      if (!error && data) {
        setRecommended(data);
      }
    };

    fetchRecommended();
  }, [product.id]);

  // Use only the product's main image for now. If multiple images are needed,
  // a new table for product images would be required in Supabase.
  const images = [product.image]; 

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
      variantId: selectedVariant.id, // Pass variant ID for order items
    };
    addToCart(item);
    showToast('Товар добавлен в корзину', 'success');
  };

  const handleAddRecommendedToCart = (item) => {
    if (item.product_variants && item.product_variants.length > 0) {
        const variant = item.product_variants[0];
        const cartItem = {
            id: item.id,
            name: item.name,
            nameRu: item.name_ru,
            image: item.image,
            size: variant.size,
            price: variant.price,
            variantId: variant.id, // Pass variant ID for order items
        };
        addToCart(cartItem);
        showToast(`${item.name || item.name_ru} добавлен в корзину`, 'success');
    } else {
        showToast('У этого товара нет вариантов', 'info');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Детали товара</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.productTitle}>{product.name || product.name_ru}</Text>

        <View style={styles.imageContainer}>
          <Image source={{ uri: images[currentImageIndex] }} style={styles.mainImage} />
          {images.length > 1 && ( // Only show thumbnails if there's more than one image
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
          )}
        </View>

        <View style={styles.productInfo}>
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

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Детали продукта</Text>
            <Text style={styles.description}>
              {product.description || 'Красивый букет для любого случая.'}
            </Text>
          </View>

          {recommended.length > 0 && (
            <View style={styles.recommendedSection}>
              <Text style={styles.sectionTitle}>Добавить к заказу?</Text>
              <FlatList
                data={recommended}
                renderItem={({ item }) => (
                  <RecommendedProductCard 
                    item={item} 
                    onAddToCart={handleAddRecommendedToCart} 
                  />
                )}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Итоговая цена</Text>
          <Text style={styles.totalPrice}>₸{(selectedVariant?.price || 0).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButtonWrapper} onPress={handleAddToCart}>
          <LinearGradient
            colors={['#FFC0CB', '#FF69B4']}
            style={styles.addToCartButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            <Text style={styles.addToCartText}>В корзину</Text>
          </LinearGradient>
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
    borderRadius: 20,
    marginBottom: 15,
  },
  thumbnailContainer: {
    paddingHorizontal: 20,
  },
  thumbnail: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 2,
  },
  activeThumbnail: {
    borderColor: '#FF69B4',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  productInfo: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding to avoid overlap with bottom bar
  },
  detailsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  sizeSection: {
    marginBottom: 25,
  },
  sizeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginRight: 15,
  },
  selectedSize: {
    backgroundColor: '#FF69B4',
    transform: [{ scale: 1.1 }],
  },
  sizeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  selectedSizeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  recommendedSection: {
    marginBottom: 25,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30, // Safe area padding
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 0.8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  addToCartButtonWrapper: {
    flex: 1.2,
    borderRadius: 30,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductScreen;
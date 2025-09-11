import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert, // Keep Alert for WhatsApp error, as it's a system-level issue
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../App';
import * as Linking from 'expo-linking';
import { useToast } from '../src/components/ToastProvider'; // New import

const { width } = Dimensions.get('window');

const ProductScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const { addToCart, toggleSaved, saved } = useContext(CartContext);
  const { showToast } = useToast(); // Use toast hook
  const [selectedSize, setSelectedSize] = useState(15);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isSaved = saved.find(i => i.id === product.id);

  const sizes = [
    { stems: 10, price: 10900 },
    { stems: 15, price: 16350 },
    { stems: 25, price: 27250 },
    { stems: 40, price: 43600 },
    { stems: '40+', price: 50000 },
  ];

  const additionalProducts = [
    {
      id: 101,
      name: 'Red Velvet Bouquet',
      price: 19500,
      image: 'https://via.placeholder.com/150/FF69B4/FFFFFF?text=Velvet',
    },
    {
      id: 102,
      name: 'Red & White Royal B...',
      price: 14599,
      image: 'https://via.placeholder.com/150/FFB6C1/FFFFFF?text=Royal',
    },
  ];

  const images = [
    product.image,
    'https://via.placeholder.com/400/FFB6C1/FFFFFF?text=Image2',
    'https://via.placeholder.com/400/FFC0CB/FFFFFF?text=Image3',
    'https://via.placeholder.com/400/FFE4E1/FFFFFF?text=Image4',
    'https://via.placeholder.com/400/FFF0F5/FFFFFF?text=Image5',
  ];

  const calculatePrice = () => {
    const sizePrice = sizes.find(s => s.stems === selectedSize)?.price || sizes[1].price;
    return sizePrice;
  };

  const handleAddToCart = () => {
    const item = {
      ...product,
      size: selectedSize,
      price: calculatePrice(),
      quantity: 1,
    };
    addToCart(item);
    showToast('Товар добавлен в корзину', 'success'); // Replaced Alert with toast
  };

  const handleWhatsAppOrder = () => {
    const message = `Здравствуйте! Хочу заказать:\n${product.name}\nРазмер: ${selectedSize} стеблей\nЦена: ₸${calculatePrice().toLocaleString()}`;
    const whatsappUrl = `whatsapp://send?phone=+77001234567&text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Ошибка', 'WhatsApp не установлен на вашем устройстве'); // Keep Alert for system error
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Basket</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Product Title */}
        <Text style={styles.productTitle}>Белая Роза</Text>

        {/* Image Gallery */}
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

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>White Chrysanthemums and Purple Roses</Text>
          
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product details</Text>
            <Text style={styles.description}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim.
            </Text>
            <TouchableOpacity>
              <Text style={styles.readMore}>Read more.</Text>
            </TouchableOpacity>
          </View>

          {/* Size Selection */}
          <View style={styles.sizeSection}>
            <Text style={styles.sectionTitle}>Sizes (Stems)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sizes.map((size) => (
                <TouchableOpacity
                  key={size.stems}
                  onPress={() => setSelectedSize(size.stems)}
                  style={[
                    styles.sizeButton,
                    selectedSize === size.stems && styles.selectedSize
                  ]}
                >
                  <Text style={[
                    styles.sizeText,
                    selectedSize === size.stems && styles.selectedSizeText
                  ]}>
                    {size.stems}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Add to Order Section */}
          <View style={styles.addToOrderSection}>
            <Text style={styles.sectionTitle}>Добавить к заказу?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {additionalProducts.map((item) => (
                <View key={item.id} style={styles.additionalProduct}>
                  <Image source={{ uri: item.image }} style={styles.additionalImage} />
                  <TouchableOpacity 
                    style={styles.heartSmall}
                    onPress={() => toggleSaved(item)}
                  >
                    <Ionicons name="heart-outline" size={20} color="#FF69B4" />
                  </TouchableOpacity>
                  <Text style={styles.additionalName}>{item.name}</Text>
                  <Text style={styles.additionalBrand}>Men's Fashion</Text>
                  <View style={styles.additionalPriceRow}>
                    <Text style={styles.additionalPrice}>₸{item.price.toLocaleString()}</Text>
                    <TouchableOpacity style={styles.addSmallButton}>
                      <Text style={styles.addSmallText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>₸{calculatePrice().toLocaleString()}</Text>
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
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
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
  readMore: {
    color: '#FF69B4',
    marginTop: 5,
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
  addToOrderSection: {
    marginBottom: 100,
  },
  additionalProduct: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
  },
  additionalImage: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    marginBottom: 10,
  },
  heartSmall: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
  },
  additionalName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  additionalBrand: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  additionalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addSmallButton: {
    backgroundColor: '#1e3a8a',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSmallText: {
    color: '#fff',
    fontSize: 18,
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
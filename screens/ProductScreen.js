import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
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
  const initialProduct = route.params.product;
  const [product, setProduct] = useState(initialProduct);
  const { addToCart } = useContext(CartContext);
  const { showToast } = useToast();
  
  const variants = product.product_variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants.length > 0 ? variants[0] : null);
  const [recommended, setRecommended] = useState([]);

  const isVariantOutOfStock = selectedVariant?.stock_quantity <= 0;

  const addToCartButtonScale = useRef(new Animated.Value(1)).current;
  const imageScrollX = useRef(new Animated.Value(0)).current;

  const handleAddToCartPressIn = () => {
    Animated.spring(addToCartButtonScale, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handleAddToCartPressOut = () => {
    Animated.spring(addToCartButtonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const fetchProductDetails = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)') // Fetch product_images
      .eq('id', initialProduct.id)
      .single();
    
    if (!error && data) {
      setProduct(data);
      // Reselect variant if it still exists
      const currentSelectedId = selectedVariant?.id;
      const newVariants = data.product_variants || [];
      const newSelectedVariant = newVariants.find(v => v.id === currentSelectedId) || (newVariants.length > 0 ? newVariants[0] : null);
      setSelectedVariant(newSelectedVariant);
    }
  }, [initialProduct.id, selectedVariant]);

  useEffect(() => {
    const channel = supabase
      .channel(`public:product:${initialProduct.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `id=eq.${initialProduct.id}` }, fetchProductDetails)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants', filter: `product_id=eq.${initialProduct.id}` }, fetchProductDetails)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images', filter: `product_id=eq.${initialProduct.id}` }, fetchProductDetails) // Listen for image changes
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialProduct.id, fetchProductDetails]);

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

  const handleAddToCart = () => {
    if (!selectedVariant) {
      showToast('Выберите вариант товара', 'error');
      return;
    }
    if (isVariantOutOfStock) {
      showToast('Этого товара нет в наличии', 'error');
      return;
    }
    const item = {
      id: product.id,
      name: product.name,
      nameRu: product.name_ru,
      image: product.image,
      size: selectedVariant.size,
      price: selectedVariant.price,
      variantId: selectedVariant.id,
      stock_quantity: selectedVariant.stock_quantity,
    };
    addToCart(item);
    showToast('Товар добавлен в корзину', 'success');
  };

  const handleAddRecommendedToCart = (item) => {
    if (item.product_variants && item.product_variants.length > 0) {
        const variant = item.product_variants[0];
        if (variant.stock_quantity <= 0) {
          showToast(`${item.name || item.name_ru} закончился`, 'info');
          return;
        }
        const cartItem = {
            id: item.id,
            name: item.name,
            nameRu: item.name_ru,
            image: item.image,
            size: variant.size,
            price: variant.price,
            variantId: variant.id,
            stock_quantity: variant.stock_quantity,
        };
        addToCart(cartItem);
        showToast(`${item.name || item.name_ru} добавлен в корзину`, 'success');
    } else {
        showToast('У этого товара нет вариантов', 'info');
    }
  };

  const allImages = [{ id: 'main', image_url: product.image }, ...(product.product_images || [])];

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

        <View style={styles.imageGalleryContainer}>
          <FlatList
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: imageScrollX } } }],
              { useNativeDriver: false }
            )}
            renderItem={({ item }) => (
              <Image source={{ uri: item.image_url }} style={[styles.galleryImage, { width: width - 40 }]} />
            )}
            contentContainerStyle={styles.galleryListContent}
          />
          {allImages.length > 1 && (
            <View style={styles.imagePaginationDots}>
              {allImages.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const dotWidth = imageScrollX.interpolate({
                  inputRange,
                  outputRange: [8, 16, 8],
                  extrapolate: 'clamp',
                });
                const opacity = imageScrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });
                return (
                  <Animated.View
                    key={i.toString()}
                    style={[styles.imageDot, { width: dotWidth, opacity }]}
                  />
                );
              })}
            </View>
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
                      selectedVariant?.id === variant.id && styles.selectedSize,
                      variant.stock_quantity <= 0 && styles.disabledSize,
                    ]}
                    disabled={variant.stock_quantity <= 0}
                  >
                    <Text style={[
                      styles.sizeText,
                      selectedVariant?.id === variant.id && styles.selectedSizeText,
                      variant.stock_quantity <= 0 && styles.disabledSizeText,
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
            {product.description && <Text style={styles.description}>{product.description}</Text>}
            
            {product.composition && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>Состав букета</Text>
                <Text style={styles.detailBlockText}>{product.composition}</Text>
              </View>
            )}
            {product.size_info && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>Размер</Text>
                <Text style={styles.detailBlockText}>{product.size_info}</Text>
              </View>
            )}
            {product.care_instructions && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>Рекомендации по уходу</Text>
                <Text style={styles.detailBlockText}>{product.care_instructions}</Text>
              </View>
            )}
            {!product.description && !product.composition && !product.size_info && !product.care_instructions && (
              <Text style={styles.description}>Красивый букет для любого случая.</Text>
            )}
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
        <TouchableOpacity
          style={styles.addToCartButtonWrapper}
          onPress={handleAddToCart}
          onPressIn={handleAddToCartPressIn}
          onPressOut={handleAddToCartPressOut}
          activeOpacity={0.8}
          disabled={isVariantOutOfStock}
        >
          <Animated.View style={{ transform: [{ scale: addToCartButtonScale }] }}>
            <LinearGradient
              colors={isVariantOutOfStock ? ['#ccc', '#aaa'] : ['#FFC0CB', '#FF69B4']}
              style={styles.addToCartButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={isVariantOutOfStock ? "close-circle-outline" : "cart-outline"} size={24} color="#fff" />
              <Text style={styles.addToCartText}>{isVariantOutOfStock ? 'Нет в наличии' : 'В корзину'}</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  productTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  
  imageGalleryContainer: { marginBottom: 20 },
  galleryListContent: { paddingHorizontal: 20 },
  galleryImage: { height: width - 40, alignSelf: 'center', borderRadius: 20, marginBottom: 15, resizeMode: 'cover' },
  imagePaginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -10,
  },
  imageDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#FF69B4',
    marginHorizontal: 4,
  },

  productInfo: { paddingHorizontal: 20, paddingBottom: 120 },
  detailsSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  description: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 15 },
  
  detailBlock: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  detailBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  detailBlockText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  sizeSection: { marginBottom: 25 },
  sizeButton: { minWidth: 50, height: 50, paddingHorizontal: 15, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', marginRight: 15 },
  selectedSize: { backgroundColor: '#FF69B4', transform: [{ scale: 1.1 }] },
  disabledSize: { backgroundColor: '#f5f5f5', opacity: 0.5 },
  sizeText: { fontSize: 16, color: '#666', fontWeight: '500' },
  selectedSizeText: { color: '#fff', fontWeight: 'bold' },
  disabledSizeText: { textDecorationLine: 'line-through' },
  recommendedSection: { marginBottom: 25 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 15, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flex: 0.8 },
  totalLabel: { fontSize: 14, color: '#999', marginBottom: 2 },
  totalPrice: { fontSize: 26, fontWeight: 'bold' },
  addToCartButtonWrapper: { flex: 1.2, borderRadius: 30, shadowColor: '#FF69B4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10 },
  addToCartButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30, gap: 10 },
  addToCartText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ProductScreen;
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
import { getProductDetails, getRecommendedProducts } from '../src/services/api';
import RecommendedProductCard from '../src/components/RecommendedProductCard';
import { FONTS } from '../src/config/theme';

const { width } = Dimensions.get('window');

const ProductScreen = ({ navigation, route }) => {
  const initialProduct = route.params.product;
  const [product, setProduct] = useState(initialProduct);
  const { addToCart } = useContext(CartContext);
  const { showToast } = useToast();
  
  const variants = product?.product_variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants.length > 0 ? variants[0] : null);
  const [recommended, setRecommended] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isVariantOutOfStock = selectedVariant?.stock_quantity <= 0;

  const addToCartButtonScale = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleAddToCartPressIn = () => {
    Animated.spring(addToCartButtonScale, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handleAddToCartPressOut = () => {
    Animated.spring(addToCartButtonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const fetchProductDetails = useCallback(async () => {
    const { data, error } = await getProductDetails(initialProduct.id);
    
    if (error) {
      showToast('Ошибка загрузки деталей товара', 'error');
      setProduct(null);
    } else if (data) {
      setProduct(data);
      const currentSelectedId = selectedVariant?.id;
      const newVariants = data.product_variants || [];
      const newSelectedVariant = newVariants.find(v => v.id === currentSelectedId) || (newVariants.length > 0 ? newVariants[0] : null);
      setSelectedVariant(newSelectedVariant);

      const images = data.product_images ? data.product_images.map(img => img.image_url) : [];
      if (data.image && !images.includes(data.image)) {
        images.unshift(data.image);
      }
      setProductImages(images);
    } else {
      setProduct(null);
      showToast('Товар не найден', 'error');
    }
  }, [initialProduct.id, selectedVariant, showToast]);

  useEffect(() => {
    fetchProductDetails();

    const channel = supabase
      .channel(`public:product:${initialProduct.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `id=eq.${initialProduct.id}` }, fetchProductDetails)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants', filter: `product_id=eq.${initialProduct.id}` }, fetchProductDetails)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images', filter: `product_id=eq.${initialProduct.id}` }, fetchProductDetails)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialProduct.id, fetchProductDetails]);

  useEffect(() => {
    const fetchRecommended = async () => {
      if (!product?.id) return;
      const { data, error } = await getRecommendedProducts(product.id);
      if (!error && data) {
        setRecommended(data);
      }
    };
    if (product) {
      fetchRecommended();
    }
  }, [product?.id]); // Depend on product.id

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

  const onScrollEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const renderImageItem = ({ item }) => (
    <Image source={{ uri: item }} style={styles.carouselImage} />
  );

  const handleScrollEnd = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 40));
    setActiveImageIndex(index);
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Детали товара</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="flower-outline" size={80} color="#999" />
          <Text style={styles.emptyStateText}>Товар не найден или был удален.</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
            <Text style={styles.shopButtonText}>Вернуться на главную</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

        <View style={styles.imageCarouselContainer}>
          {productImages.length > 0 ? (
            <>
              <FlatList
                data={productImages}
                renderItem={renderImageItem}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScrollEvent}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
                contentContainerStyle={styles.carouselContentContainer}
              />
              <View style={styles.paginationDots}>
                {productImages.map((_, index) => {
                  const inputRange = [(index - 1) * (width - 40), index * (width - 40), (index + 1) * (width - 40)];
                  const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  });
                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.8, 1.2, 0.8],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={index}
                      style={[styles.dot, { opacity, transform: [{ scale }] }]}
                    />
                  );
                })}
              </View>
            </>
          ) : (
            <Image source={{ uri: product.image }} style={styles.mainImage} />
          )}
        </View>

        <View style={styles.productInfo}>
          {variants.length > 0 && (
            <View style={styles.sizeSection}>
              <Text style={styles.sectionTitle}>Варианты</Text>
             <View style={styles.variantsContainer}>
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
                   {variant.stock_quantity <= 0 && (
                     <View style={styles.outOfStockBadge}>
                       <Text style={styles.outOfStockBadgeText}>Нет</Text>
                     </View>
                   )}
                 </TouchableOpacity>
               ))}
             </View>
            </View>
          )}

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Детали продукта</Text>
            <Text style={styles.description}>
              {product.description || 'Красивый букет для любого случая.'}
            </Text>
            {product.composition && (
              <View style={styles.detailRow}>
                <Ionicons name="flower-outline" size={18} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Состав:</Text> {product.composition}</Text>
              </View>
            )}
            {product.size_info && (
              <View style={styles.detailRow}>
                <Ionicons name="resize-outline" size={18} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Размер:</Text> {product.size_info}</Text>
              </View>
            )}
            {product.care_instructions && (
              <View style={styles.detailRow}>
                <Ionicons name="leaf-outline" size={18} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Уход:</Text> {product.care_instructions}</Text>
              </View>
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
                contentContainerStyle={styles.recommendedListContent}
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
  headerTitle: { fontSize: 18, fontFamily: FONTS.semiBold },
  productTitle: { fontSize: 24, fontFamily: FONTS.bold, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  imageCarouselContainer: { marginBottom: 20, position: 'relative' },
  carouselImage: { width: width - 40, height: width - 40, borderRadius: 20, marginHorizontal: 10 },
  carouselContentContainer: { paddingHorizontal: 10 },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    width: '100%',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#FF69B4',
    marginHorizontal: 4,
  },
  mainImage: { width: width - 40, height: width - 40, alignSelf: 'center', borderRadius: 20, marginBottom: 15 },
  productInfo: { paddingHorizontal: 20, paddingBottom: 120 },
  detailsSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  description: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailIcon: { marginRight: 8 },
  detailText: { fontSize: 14, color: '#666' },
  detailLabel: { fontWeight: '600' },
  sizeSection: { marginBottom: 25 },
  variantsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sizeButton: { minWidth: 80, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  selectedSize: { backgroundColor: '#FFE4E1', borderColor: '#FF69B4' },
  disabledSize: { backgroundColor: '#f5f5f5', opacity: 0.5 },
  sizeText: { fontSize: 16, color: '#666', fontWeight: '500' },
  selectedSizeText: { color: '#FF69B4', fontWeight: 'bold' },
  disabledSizeText: { color: '#ccc' },
  outOfStockBadge: {
   position: 'absolute',
   top: -5,
   right: -5,
   backgroundColor: '#D32F2F',
   borderRadius: 10,
   paddingHorizontal: 5,
   paddingVertical: 2,
  },
  outOfStockBadgeText: {
   color: '#fff',
   fontSize: 8,
   fontWeight: 'bold',
  },
  recommendedSection: { marginBottom: 25 },
  recommendedListContent: { paddingRight: 20 }, // Added for horizontal scroll
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 15, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flex: 0.8 },
  totalLabel: { fontSize: 14, color: '#999', marginBottom: 2 },
  totalPrice: { fontSize: 26, fontWeight: 'bold' },
  addToCartButtonWrapper: { flex: 1.2, borderRadius: 30, shadowColor: '#FF69B4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10 },
  addToCartButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30, gap: 10 },
  addToCartText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductScreen;
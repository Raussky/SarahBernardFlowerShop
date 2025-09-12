import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';
import { DEFAULT_CITY } from '../src/config/constants';
import SkeletonLoader from '../src/components/SkeletonLoader';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]); // New state for recommended
  const [banners, setBanners] = useState([]); // New state for banners
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Все');

  const fetchData = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .limit(4);
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, categories(name, name_en), product_variants(*)')
        .order('created_at', { ascending: false });
      if (productsError) throw productsError;
      setProducts(productsData);

      // Fetch banners
      const { data: bannersData, error: bannersError } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (bannersError) throw bannersError;
      setBanners(bannersData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('public:home_screen_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => fetchData()) // Listen to banner changes
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    let currentFiltered = products;

    if (searchText) {
      const lowercasedSearchText = searchText.toLowerCase();
      currentFiltered = currentFiltered.filter(product =>
        product.name?.toLowerCase().includes(lowercasedSearchText) ||
        product.name_ru?.toLowerCase().includes(lowercasedSearchText) ||
        product.categories?.name?.toLowerCase().includes(lowercasedSearchText)
      );
    }

    if (activeFilter !== 'Все') {
      currentFiltered = currentFiltered.filter(product =>
        product.categories?.name === activeFilter
      );
    }

    setFilteredProducts(currentFiltered);

    // Logic for recommended products:
    // Get product IDs from filteredProducts (bestsellers) to exclude them from recommendations
    const bestsellerIds = new Set(currentFiltered.slice(0, 4).map(p => p.id));
    const nonBestsellerProducts = products.filter(p => !bestsellerIds.has(p.id));

    // Sort non-bestsellers by purchase_count descending, then randomly
    const sortedRecommended = [...nonBestsellerProducts]
      .sort((a, b) => (b.purchase_count || 0) - (a.purchase_count || 0))
      .sort(() => Math.random() - 0.5); // Add some randomness for variety

    setRecommendedProducts(sortedRecommended.slice(0, 4)); // Limit to 4 recommended
  }, [searchText, activeFilter, products]);

  const renderBestsellerFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
      {['Все', ...categories.map(cat => cat.name)].map(filter => (
        <TouchableOpacity 
          key={filter}
          style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
          onPress={() => setActiveFilter(filter)}
        >
          <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderBannerItem = ({ item }) => (
    <ImageBackground
      source={{ uri: item.image_url }}
      style={styles.banner}
      imageStyle={{ borderRadius: 15 }}
    >
      <View style={styles.bannerContent}>
        {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
        {item.subtitle && <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>}
        <TouchableOpacity style={styles.shopButton}>
          <Text style={styles.shopButtonText}>В магазин</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View>
                <SkeletonLoader width={80} height={15} borderRadius={4} style={{ marginBottom: 5 }} />
                <SkeletonLoader width={120} height={20} borderRadius={4} />
              </View>
              <SkeletonLoader width={40} height={40} borderRadius={20} />
            </View>
            <View style={styles.headerBottomRow}>
              <SkeletonLoader width={'75%'} height={48} borderRadius={12} />
              <SkeletonLoader width={48} height={48} borderRadius={12} />
            </View>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <SkeletonLoader width={'90%'} height={180} borderRadius={15} style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 25 }} />
          <Text style={styles.sectionTitle}>Категории</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={styles.categoryItem}>
                <SkeletonLoader width={70} height={70} borderRadius={35} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={50} height={12} borderRadius={4} />
              </View>
            ))}
          </ScrollView>
          <Text style={styles.sectionTitle}>Бест Селлеры</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            {[...Array(3)].map((_, i) => (
              <SkeletonLoader key={i} width={80} height={30} borderRadius={20} style={{ marginRight: 10 }} />
            ))}
          </ScrollView>
          <View style={styles.productRow}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={styles.productCardSkeleton}>
                <SkeletonLoader width={'100%'} height={180} borderRadius={15} />
                <View style={{ padding: 12 }}>
                  <SkeletonLoader width={'80%'} height={15} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={'60%'} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width={'50%'} height={16} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
          <SkeletonLoader width={'90%'} height={120} borderRadius={15} style={{ marginHorizontal: 20, marginBottom: 25 }} />
          <Text style={styles.sectionTitle}>Рекомендовано для Вас</Text>
          <View style={styles.productRow}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={styles.productCardSkeleton}>
                <SkeletonLoader width={'100%'} height={180} borderRadius={15} />
                <View style={{ padding: 12 }}>
                  <SkeletonLoader width={'80%'} height={15} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={'60%'} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width={'50%'} height={16} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.locationLabel}>Локация</Text>
              <TouchableOpacity style={styles.locationRow}>
                <Ionicons name="location" size={20} color="#fff" />
                <Text style={styles.locationText}>{DEFAULT_CITY}</Text>
                <Ionicons name="chevron-down" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerBottomRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Искать здесь..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#999"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {banners.length > 0 ? (
          <FlatList
            data={banners}
            renderItem={renderBannerItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={width - 40 + 20} // Item width + margin
            decelerationRate="fast"
            contentContainerStyle={styles.bannersListContainer}
          />
        ) : (
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=2070&auto=format&fit=crop' }}
            style={styles.banner}
            imageStyle={{ borderRadius: 15 }}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>SARAH BERNARD</Text>
              <Text style={styles.bannerSubtitle}>
                Сделайте каждый момент ярче{'\n'}
                с идеальным цветком.
              </Text>
              <TouchableOpacity style={styles.shopButton}>
                <Text style={styles.shopButtonText}>В магазин</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        )}

        <Text style={styles.sectionTitle}>Категории</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryItem}
              onPress={() => navigation.navigate('Category', { category })}
            >
              <View style={styles.categoryIcon}>
                {category.image_url ? (
                  <Image 
                    source={{ uri: category.image_url }} 
                    style={styles.categoryImage} 
                  />
                ) : (
                  <Text style={styles.categoryEmoji}>{category.icon || '💐'}</Text>
                )}
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.bestsellerSection}>
          <Text style={styles.sectionTitle}>Бест Селлеры</Text>
          {renderBestsellerFilters()}
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts.slice(0, 4)}
              renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyResultsText}>Нет товаров, соответствующих вашему запросу.</Text>
          )}
        </View>

        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1562690868-c610169441c3?q=80&w=2070&auto=format&fit=crop' }}
          style={styles.specialOfferBanner}
          imageStyle={{ borderRadius: 15 }}
        >
          <Text style={styles.offerTitle}>Специальное предложение</Text>
          <Text style={styles.offerSubtitle}>Скидка 25% на ваш первый заказ!</Text>
        </ImageBackground>

        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>Рекомендовано для Вас</Text>
          {recommendedProducts.length > 0 ? (
            <FlatList
              data={recommendedProducts}
              renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyResultsText}>Нет рекомендованных товаров.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  headerSafeArea: { backgroundColor: '#FF69B4', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  locationLabel: { color: '#fff', fontSize: 12, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  notificationButton: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 48, borderRadius: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  clearSearchButton: { padding: 5 }, // New style for clear search button
  filterButton: { backgroundColor: '#fff', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bannersListContainer: { // New style for FlatList of banners
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },
  banner: { 
    width: width - 40, // Adjust width for padding
    marginRight: 20, // Space between banners
    borderRadius: 15, 
    padding: 20, 
    minHeight: 180, 
    justifyContent: 'center' 
  },
  bannerContent: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  bannerSubtitle: { fontSize: 14, color: '#fff', marginBottom: 15, lineHeight: 20 },
  shopButton: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  shopButtonText: { color: '#FF69B4', fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15 },
  categoriesContainer: { paddingHorizontal: 20, marginBottom: 25 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryIcon: { width: 70, height: 70, borderRadius: 35, marginBottom: 8, overflow: 'hidden', backgroundColor: '#FFE4E1', justifyContent: 'center', alignItems: 'center' },
  categoryImage: { width: '100%', height: '100%' },
  categoryEmoji: { fontSize: 30 },
  categoryName: { fontSize: 12, color: '#666' },
  bestsellerSection: { marginBottom: 20 },
  filterScrollView: { paddingHorizontal: 20, marginBottom: 15 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 10 },
  activeFilterTab: { backgroundColor: '#FF69B4' },
  filterText: { color: '#666' },
  activeFilterText: { color: '#fff', fontWeight: 'bold' },
  specialOfferBanner: { marginHorizontal: 20, borderRadius: 15, padding: 30, marginBottom: 25, minHeight: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE4E1' },
  offerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  offerSubtitle: { fontSize: 14, color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, marginTop: 5 },
  recommendedSection: { marginBottom: 20 },
  productRow: { justifyContent: 'space-between', paddingHorizontal: 20 },
  emptyResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  productCardSkeleton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
});

export default HomeScreen;
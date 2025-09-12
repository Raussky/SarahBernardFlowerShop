import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';
import { DEFAULT_CITY } from '../src/config/constants';
import SkeletonLoader from '../src/components/SkeletonLoader';

const { width } = Dimensions.get('window');

const categoryImageMap = {
  '💐': 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?w=500&q=80',
  '🎁': 'https://images.unsplash.com/photo-1513201099705-4874684e20d8?w=500&q=80',
  '🧸': 'https://images.unsplash.com/photo-1575397429859-1d52b176dbb4?w=500&q=80',
  '🎂': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&q=80',
};

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]); // Renamed from recommended
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Все');

  const scrollX = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .limit(4);
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      // Fetch Bestsellers (ordered by purchase_count)
      const { data: bestsellersData, error: bestsellersError } = await supabase
        .from('products')
        .select('*, categories(name, name_en), product_variants(*)')
        .filter('is_archived', 'is', 'false')
        .order('purchase_count', { ascending: false })
        .limit(8); // Limit to a reasonable number
      if (bestsellersError) throw bestsellersError;
      setBestsellers(bestsellersData);

      // Fetch New Arrivals (ordered by created_at)
      const { data: newArrivalsData, error: newArrivalsError } = await supabase
        .from('products')
        .select('*, categories(name, name_en), product_variants(*)')
        .filter('is_archived', 'is', 'false')
        .order('created_at', { ascending: false })
        .limit(8); // Limit to a reasonable number
      if (newArrivalsError) throw newArrivalsError;
      setNewArrivals(newArrivalsData);

      // Fetch Banners
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
      .channel('public:home_data_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const getFilteredBestsellers = () => {
    let currentFiltered = bestsellers;

    if (searchText) {
      const lowercasedSearchText = searchText.toLowerCase();
      currentFiltered = currentFiltered.filter(product =>
        product.name?.toLowerCase().includes(lowercasedSearchText) ||
        product.name_ru?.toLowerCase().includes(lowercasedSearchText) ||
        product.categories?.name?.toLowerCase().includes(lowercasedSearchText) ||
        product.categories?.name_en?.toLowerCase().includes(lowercasedSearchText)
      );
    }

    if (activeFilter !== 'Все') {
      currentFiltered = currentFiltered.filter(product =>
        product.categories?.name === activeFilter || product.categories?.name_en === activeFilter
      );
    }
    return currentFiltered;
  };

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
          <Text style={styles.sectionTitle}>Новинки</Text>
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
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {banners.length > 0 ? (
        <FlatList
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          renderItem={({ item }) => (
            <ImageBackground
              source={{ uri: item.image_url }}
              style={[styles.banner, { width: width - 40 }]}
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
          )}
          contentContainerStyle={styles.bannerCarouselContainer}
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
      {banners.length > 1 && (
        <View style={styles.paginationDots}>
          {banners.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i.toString()}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>
      )}

      {/* Main ScrollView starts here */}
      <ScrollView showsVerticalScrollIndicator={false}>
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
                <Image 
                  source={{ uri: categoryImageMap[category.icon] || 'https://via.placeholder.com/70' }} 
                  style={styles.categoryImage} 
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.bestsellerSection}>
          <Text style={styles.sectionTitle}>Бест Селлеры</Text>
          {renderBestsellerFilters()}
          {getFilteredBestsellers().length > 0 ? (
            <FlatList
              data={getFilteredBestsellers()}
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
          <Text style={styles.sectionTitle}>Новинки</Text>
          {newArrivals.length > 0 ? (
            <FlatList
              data={newArrivals}
              renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyResultsText}>Нет новых товаров.</Text>
          )}
        </View>
      </ScrollView> {/* Main ScrollView ends here */}
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
  filterButton: { backgroundColor: '#fff', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bannerCarouselContainer: { paddingHorizontal: 20, paddingVertical: 20 },
  banner: { borderRadius: 15, padding: 20, minHeight: 180, justifyContent: 'center', marginRight: 20 },
  bannerContent: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  bannerSubtitle: { fontSize: 14, color: '#fff', marginBottom: 15, lineHeight: 20 },
  shopButton: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  shopButtonText: { color: '#FF69B4', fontWeight: 'bold' },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -10, // Adjust to position below the banner
    marginBottom: 15,
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#FF69B4',
    marginHorizontal: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15 },
  categoriesContainer: { paddingHorizontal: 30, marginBottom: 25 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryIcon: { width: 70, height: 70, borderRadius: 35, marginBottom: 8, overflow: 'hidden', backgroundColor: '#FFE4E1' },
  categoryImage: { width: '100%', height: '100%' },
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
  productRow: { justifyContent: 'space-between', paddingHorizontal: 15 }, // Removed padding here as FlatList contentContainerStyle handles it
  emptyResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  productCardSkeleton: {
    width: (width - 60) / 2, // Adjust to match ProductCard width
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
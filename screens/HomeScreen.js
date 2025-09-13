import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';
import SkeletonLoader from '../src/components/SkeletonLoader';
import MainBanner from '../src/components/MainBanner';
import { FONTS } from '../src/config/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [readyShowcase, setReadyShowcase] = useState([]);
  const [combos, setCombos] = useState([]);
  const [weeklyPicks, setWeeklyPicks] = useState([]);
  const [premiumBouquets, setPremiumBouquets] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const showcaseLayoutY = useRef(0);
  const handleFilterApply = async (filters) => {
    setFilterModalVisible(false);
    setLoading(true);
    const { data, error } = await supabase.rpc('filter_products', {
      p_category_ids: filters.categories,
      p_min_price: filters.priceRange[0],
      p_max_price: filters.priceRange[1],
      p_sort_column: filters.sortBy,
      p_sort_direction: filters.sortDirection,
    });
    setLoading(false);
    if (!error) {
      navigation.navigate('FilterResults', { filteredProducts: data });
    }
   };

  const fetchData = useCallback(async () => {
    try {
      const [
        categoriesRes,
        bannersRes,
        bestSellersRes,
        readyShowcaseRes,
        combosRes,
        weeklyPicksRes,
        premiumBouquetsRes,
        recommendedRes
      ] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('banners').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.rpc('get_best_sellers', { limit_count: 10 }),
        supabase.rpc('get_products_by_category_name', { category_name_param: 'Готовая ветрина', limit_count: 10 }),
        supabase.from('combos').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('products').select('*, categories(name, name_en), product_variants(*)').eq('is_weekly_pick', true).order('created_at', { ascending: false }),
        supabase.rpc('get_products_by_category_name', { category_name_param: 'Премиум букеты', limit_count: 10 }),
        supabase.from('products').select('*, categories(name, name_en), product_variants(*)').limit(10)
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      setCategories(categoriesRes.data);

      if (bannersRes.error) throw bannersRes.error;
      setBanners(bannersRes.data);

      if (bestSellersRes.error) throw bestSellersRes.error;
      setBestSellers(bestSellersRes.data);

      if (readyShowcaseRes.error) throw readyShowcaseRes.error;
      setReadyShowcase(readyShowcaseRes.data);

      if (combosRes.error) throw combosRes.error;
      setCombos(combosRes.data);

      if (weeklyPicksRes.error) throw weeklyPicksRes.error;
      setWeeklyPicks(weeklyPicksRes.data);

      if (premiumBouquetsRes.error) throw premiumBouquetsRes.error;
      setPremiumBouquets(premiumBouquetsRes.data);
      
      if (recommendedRes.error) throw recommendedRes.error;
      setRecommendedProducts(recommendedRes.data.sort(() => Math.random() - 0.5));

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    const channel = supabase
      .channel('public:home_screen_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleShopNowPress = () => {
    if (scrollViewRef.current && showcaseLayoutY.current) {
      scrollViewRef.current.scrollTo({ y: showcaseLayoutY.current, animated: true });
    }
  };

  const handleBannerPress = (banner) => {
    if (banner.target_type === 'product' && banner.target_id) {
      supabase.from('products').select('*, product_variants(*)').eq('id', banner.target_id).single()
        .then(({ data, error }) => {
          if (error) console.error("Error fetching product for banner:", error);
          if (data) navigation.navigate('Product', { product: data });
        });
    } else if (banner.target_type === 'category' && banner.target_id) {
      supabase.from('categories').select('*').eq('id', banner.target_id).single()
        .then(({ data, error }) => {
          if (error) console.error("Error fetching category for banner:", error);
          if (data) navigation.navigate('Category', { category: data });
        });
    }
  };

  const renderBannerItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleBannerPress(item)} activeOpacity={0.8} style={{ width: width - 40, marginRight: 20 }}>
      <ImageBackground source={{ uri: item.image_url }} style={styles.banner} imageStyle={{ borderRadius: 15 }}>
        <View style={styles.bannerContent}>
          {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
          {item.subtitle && <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>}
          <TouchableOpacity style={styles.shopButton}>
            <Text style={styles.shopButtonText}>В магазин</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
          <View style={styles.header}>
            <SkeletonLoader width={150} height={22} borderRadius={4} />
            <View style={styles.headerIcons}>
              <SkeletonLoader width={24} height={24} borderRadius={4} />
              <SkeletonLoader width={24} height={24} borderRadius={4} style={{marginLeft: 15}} />
            </View>
          </View>
        </SafeAreaView>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <SkeletonLoader width={width} height={250} />
          <View style={{ paddingHorizontal: 20, marginTop: 25 }}>
            <SkeletonLoader width={150} height={20} borderRadius={4} style={{ marginBottom: 15 }} />
            <View style={{ flexDirection: 'row' }}>
              {[...Array(4)].map((_, i) => <SkeletonLoader key={i} width={70} height={90} borderRadius={15} style={{ marginRight: 20 }} />)}
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, marginTop: 25 }}>
            <SkeletonLoader width={200} height={20} borderRadius={4} style={{ marginBottom: 15 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonLoader width={(width - 50) / 2} height={250} borderRadius={15} />
              <SkeletonLoader width={(width - 50) / 2} height={250} borderRadius={15} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
       <View style={styles.header}>
         <View style={styles.headerTopRow}>
           <Image source={require('../assets/logo-white.png')} style={styles.logo} />
           <TouchableOpacity style={styles.notificationButton}>
             <Ionicons name="notifications-outline" size={24} color="#333" />
           </TouchableOpacity>
         </View>
         <View style={styles.headerBottomRow}>
           <TouchableOpacity style={styles.searchContainer} onPress={() => navigation.navigate('Search')}>
             <Ionicons name="search" size={20} color="#999" />
             <Text style={styles.searchInputPlaceholder}>Search here...</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
             <Ionicons name="options-outline" size={24} color="#333" />
           </TouchableOpacity>
         </View>
       </View>
      </SafeAreaView>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
       <MainBanner onShopNowPress={handleShopNowPress} />
 
       <Text style={styles.sectionTitle}>Категории</Text>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
         {categories.filter(c => ['Готовые букеты', 'игрушки', 'торты', 'сладости'].includes(c.name)).map(category => (
           <TouchableOpacity key={category.id} style={styles.categoryItem} onPress={() => navigation.navigate('Category', { category })}>
             <View style={styles.categoryIcon}>
               {category.image_url ? <Image source={{ uri: category.image_url }} style={styles.categoryImage} /> : <Text style={styles.categoryEmoji}>{category.icon || '💐'}</Text>}
             </View>
             <Text style={styles.categoryName}>{category.name}</Text>
           </TouchableOpacity>
         ))}
         <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate('AllCategories')}>
           <View style={styles.categoryIcon}><Ionicons name="grid-outline" size={30} color="#FF69B4" /></View>
           <Text style={styles.categoryName}>Все</Text>
         </TouchableOpacity>
       </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Бест Селлеры</Text>
        {bestSellers.length > 0 ? (
          <FlatList data={bestSellers} renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />} keyExtractor={item => `bs-${item.id}`} numColumns={2} columnWrapperStyle={styles.productRow} scrollEnabled={false} />
        ) : (
          <Text style={styles.emptySectionText}>Хитов продаж пока нет.</Text>
        )}
      </View>

      <View style={styles.section} onLayout={(event) => { showcaseLayoutY.current = event.nativeEvent.layout.y; }}>
        <Text style={styles.sectionTitle}>Готовая ветрина</Text>
        {readyShowcase.length > 0 ? (
          <FlatList data={readyShowcase} renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />} keyExtractor={item => `rs-${item.id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} />
          ) : (
            <Text style={styles.emptySectionText}>Товаров в этой категории пока нет.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Выгодные комбо</Text>
        {combos.length > 0 ? (
          <FlatList
            data={combos}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.comboCard} onPress={() => navigation.navigate('Combo', { comboId: item.id })}>
                <Image source={{ uri: item.image || 'https://placehold.co/600x400' }} style={styles.comboImage} />
                <Text style={styles.comboName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.comboPrice}>₸{item.price.toLocaleString()}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => `cb-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        ) : (
          <Text style={styles.emptySectionText}>Комбо-наборов пока нет.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Недельная подборка</Text>
        {weeklyPicks.length > 0 ? (
          <FlatList data={weeklyPicks} renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />} keyExtractor={item => `wp-${item.id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} />
        ) : (
          <Text style={styles.emptySectionText}>Подборки на эту неделю пока нет.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Премиум букеты</Text>
        {premiumBouquets.length > 0 ? (
          <FlatList data={premiumBouquets} renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />} keyExtractor={item => `pb-${item.id}`} numColumns={2} columnWrapperStyle={styles.productRow} scrollEnabled={false} />
        ) : (
          <Text style={styles.emptySectionText}>Премиум букетов пока нет.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Рекомендовано для Вас</Text>
        {recommendedProducts.length > 0 ? (
          <FlatList data={recommendedProducts} renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />} keyExtractor={item => `rec-${item.id}`} numColumns={2} columnWrapperStyle={styles.productRow} scrollEnabled={false} />
        ) : (
          <Text style={styles.emptySectionText}>Нет рекомендованных товаров.</Text>
        )}
      </View>
     </ScrollView>
     <Modal
       animationType="slide"
       transparent={true}
       visible={filterModalVisible}
       onRequestClose={() => setFilterModalVisible(false)}
     >
       <View style={styles.modalContainer}>
         <View style={styles.modalContent}>
           <ScrollView>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Фильтры</Text>
               <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                 <Ionicons name="close" size={24} color="#333" />
               </TouchableOpacity>
             </View>
             <Text style={styles.filterLabel}>Категории</Text>
             <View style={styles.categoriesContainerModal}>
               {categories.map((category) => (
                 <TouchableOpacity
                   key={category.id}
                   style={[
                     styles.categoryButton,
                     selectedCategories.includes(category.id) && styles.categoryButtonSelected,
                   ]}
                   onPress={() => {
                     const newSelectedCategories = selectedCategories.includes(category.id)
                       ? selectedCategories.filter((id) => id !== category.id)
                       : [...selectedCategories, category.id];
                     setSelectedCategories(newSelectedCategories);
                   }}
                 >
                   <Text
                     style={[
                       styles.categoryButtonText,
                       selectedCategories.includes(category.id) && styles.categoryButtonTextSelected,
                     ]}
                   >
                     {category.name}
                   </Text>
                 </TouchableOpacity>
               ))}
             </View>
             <Text style={styles.filterLabel}>Цена: ₸{priceRange[0]} - ₸{priceRange[1]}</Text>
             <Slider
               style={{width: '100%', height: 40}}
               minimumValue={0}
               maximumValue={50000}
               step={1000}
               value={priceRange[1]}
               onValueChange={(value) => setPriceRange([priceRange[0], value])}
               minimumTrackTintColor="#FF69B4"
               maximumTrackTintColor="#000000"
             />
             <Text style={styles.filterLabel}>Сортировать по</Text>
             <View style={styles.sortContainer}>
               <TouchableOpacity
                 style={[styles.sortButton, sortBy === 'created_at' && styles.sortButtonSelected]}
                 onPress={() => setSortBy('created_at')}
               >
                 <Text style={[styles.sortButtonText, sortBy === 'created_at' && styles.sortButtonTextSelected]}>
                   Новизне
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.sortButton, sortBy === 'price' && styles.sortButtonSelected]}
                 onPress={() => setSortBy('price')}
               >
                 <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextSelected]}>
                   Цене
                 </Text>
               </TouchableOpacity>
             </View>
             <View style={styles.sortContainer}>
               <TouchableOpacity
                 style={[styles.sortButton, sortDirection === 'asc' && styles.sortButtonSelected]}
                 onPress={() => setSortDirection('asc')}
               >
                 <Text style={[styles.sortButtonText, sortDirection === 'asc' && styles.sortButtonTextSelected]}>
                   Возрастанию
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.sortButton, sortDirection === 'desc' && styles.sortButtonSelected]}
                 onPress={() => setSortDirection('desc')}
               >
                 <Text style={[styles.sortButtonText, sortDirection === 'desc' && styles.sortButtonTextSelected]}>
                   Убыванию
                 </Text>
               </TouchableOpacity>
             </View>
             <TouchableOpacity
               style={styles.applyButton}
               onPress={() =>
                 handleFilterApply({
                   priceRange: priceRange,
                   categories: selectedCategories,
                   sortBy: sortBy,
                   sortDirection: sortDirection,
                 })
               }
             >
               <Text style={styles.applyButtonText}>Применить</Text>
             </TouchableOpacity>
           </ScrollView>
         </View>
       </View>
     </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  headerSafeArea: { backgroundColor: '#FF69B4', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  logo: { width: 150, height: 30, resizeMode: 'contain' },
  notificationButton: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 48, borderRadius: 12 },
  searchInputPlaceholder: { marginLeft: 10, fontSize: 16, color: '#999' },
  filterButton: { backgroundColor: '#fff', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mainBanner: { height: 250, justifyContent: 'center', padding: 20 },
  bannerTextContainer: { maxWidth: '70%' },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  bannerSubtitle: { fontSize: 14, color: '#333', marginTop: 10, marginBottom: 20 },
  shopNowButton: { backgroundColor: '#B99976', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, alignSelf: 'flex-start' },
  shopNowButtonText: { color: '#fff', fontWeight: 'bold' },
  bannersListContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 25 },
  banner: { width: '100%', borderRadius: 15, padding: 20, minHeight: 180, justifyContent: 'center' },
  bannerContent: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10 },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: -15, marginBottom: 10 },
  dot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#FF69B4', marginHorizontal: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontFamily: FONTS.bold, marginHorizontal: 20, marginBottom: 15 },
  categoriesContainer: { paddingHorizontal: 20, marginBottom: 25 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryIcon: { width: 70, height: 70, borderRadius: 35, marginBottom: 8, overflow: 'hidden', backgroundColor: '#FFE4E1', justifyContent: 'center', alignItems: 'center' },
  categoryImage: { width: '100%', height: '100%' },
  categoryEmoji: { fontSize: 30 },
  categoryName: { fontSize: 12, color: '#666' },
  comboCard: { width: 160, marginRight: 15, backgroundColor: '#fff', borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, overflow: 'hidden' },
  emptySectionText: { paddingHorizontal: 20, color: '#999', textAlign: 'center' },
  comboImage: { width: '100%', height: 100 },
  comboName: { fontSize: 14, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  comboPrice: { fontSize: 14, fontWeight: 'bold', color: '#333', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 4 },
  productRow: { justifyContent: 'space-between', paddingHorizontal: 20 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  filterLabel: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  categoriesContainerModal: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryButtonSelected: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4',
  },
  categoryButtonText: {
    color: '#333',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  sortButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
  },
  sortButtonSelected: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4',
  },
  sortButtonText: {
    color: '#333',
  },
  sortButtonTextSelected: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
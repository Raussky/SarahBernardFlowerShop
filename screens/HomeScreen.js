import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';

// Mapping for category icons to images
const categoryImageMap = {
  '💐': 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?w=500&q=80',
  '🎁': 'https://images.unsplash.com/photo-1513201099705-4874684e20d8?w=500&q=80',
  '🧸': 'https://images.unsplash.com/photo-1575397429859-1d52b176dbb4?w=500&q=80',
  '🎂': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&q=80',
};

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .limit(4);
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, categories(name_en), product_variants(*)')
          .limit(8);
        if (productsError) throw productsError;
        setProducts(productsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderBestsellerFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
      {['All', 'Bouquets', 'Flowers', 'Gifts'].map(filter => (
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
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
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
                <Text style={styles.locationText}>Актау</Text>
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
                placeholder="Search here..."
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=2070&auto=format&fit=crop' }}
          style={styles.banner}
          imageStyle={{ borderRadius: 15 }}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>SARAH BERNARD</Text>
            <Text style={styles.bannerSubtitle}>
              Brighten every moment with the{'\n'}
              perfect bloom.
            </Text>
            <TouchableOpacity style={styles.shopButton}>
              <Text style={styles.shopButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <Text style={styles.sectionTitle}>Categories</Text>
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
              <Text style={styles.categoryName}>{category.name_en}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.bestsellerSection}>
          <Text style={styles.sectionTitle}>Бест Селлеры</Text>
          {renderBestsellerFilters()}
          <FlatList
            data={products.slice(0, 4)}
            renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
          />
        </View>

        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1562690868-c610169441c3?q=80&w=2070&auto=format&fit=crop' }}
          style={styles.specialOfferBanner}
          imageStyle={{ borderRadius: 15 }}
        >
          <Text style={styles.offerTitle}>Special Offer</Text>
          <Text style={styles.offerSubtitle}>Get 25% off on your first order!</Text>
        </ImageBackground>

        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          <FlatList
            data={products}
            renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
          />
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
  filterButton: { backgroundColor: '#fff', width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  banner: { marginHorizontal: 20, borderRadius: 15, padding: 20, marginBottom: 25, minHeight: 180, marginTop: 20, justifyContent: 'center' },
  bannerContent: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  bannerSubtitle: { fontSize: 14, color: '#fff', marginBottom: 15, lineHeight: 20 },
  shopButton: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  shopButtonText: { color: '#FF69B4', fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15 },
  categoriesContainer: { paddingHorizontal: 20, marginBottom: 25 },
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
  specialOfferBanner: { marginHorizontal: 20, borderRadius: 15, padding: 30, marginBottom: 25, minHeight: 120, justifyContent: 'center', alignItems: 'center' },
  offerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  offerSubtitle: { fontSize: 14, color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, marginTop: 5 },
  recommendedSection: { marginBottom: 20 },
  productRow: { justifyContent: 'space-between', paddingHorizontal: 20 },
});

export default HomeScreen;
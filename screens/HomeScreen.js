import React, a from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = a.useState('');
  const [categories, setCategories] = a.useState([]);
  const [products, setProducts] = a.useState([]);
  const [loading, setLoading] = a.useState(true);

  a.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .limit(4);
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        // Fetch products with variants and category name
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

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>SARAH BERNARD</Text>
            <Text style={styles.bannerSubtitle}>
              Brighten every moment with the{'\n'}
              perfect bloom. Explore stunning{'\n'}
              flowers for every occasion.
            </Text>
            <TouchableOpacity style={styles.shopButton}>
              <Text style={styles.shopButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name_en}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerSafeArea: {
    backgroundColor: '#FF69B4',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    backgroundColor: '#FFB6C1',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    minHeight: 150,
    marginTop: 20,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 15,
    lineHeight: 20,
  },
  shopButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  shopButtonText: {
    color: '#FF69B4',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 30,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
  },
  recommendedSection: {
    marginBottom: 20,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
});

export default HomeScreen;
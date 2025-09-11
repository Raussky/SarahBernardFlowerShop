import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../App';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { getCartItemsCount } = useContext(CartContext);
  const [searchText, setSearchText] = useState('');

  const categories = [
    { id: 1, name: 'Roses', nameRu: 'Розы', icon: '🌹' },
    { id: 2, name: 'Lilies', nameRu: 'Лилии', icon: '🌺' },
    { id: 3, name: 'Tulips', nameRu: 'Тюльпаны', icon: '🌷' },
    { id: 4, name: 'Daisies', nameRu: 'Ромашки', icon: '🌼' },
    { id: 5, name: 'Bouquets', nameRu: 'Букеты', icon: '💐' },
    { id: 6, name: 'Gifts', nameRu: 'Подарки', icon: '🎁' },
  ];

  const featuredProducts = [
    {
      id: 1,
      name: 'Красные розы букет',
      price: 15000,
      image: 'https://via.placeholder.com/300/FF69B4/FFFFFF?text=Red+Roses',
      rating: 4.8,
      reviews: 124,
    },
    {
      id: 2,
      name: 'Белые лилии',
      price: 12000,
      image: 'https://via.placeholder.com/300/FFB6C1/FFFFFF?text=White+Lilies',
      rating: 4.9,
      reviews: 89,
    },
    {
      id: 3,
      name: 'Весенний микс',
      price: 18000,
      image: 'https://via.placeholder.com/300/FFC0CB/FFFFFF?text=Spring+Mix',
      rating: 4.7,
      reviews: 156,
    },
  ];

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('Category', { category: item })}
    >
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryEmoji}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.nameRu}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => navigation.navigate('Product', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>
        <Text style={styles.featuredPrice}>₸{item.price.toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.heartButton}>
        <Ionicons name="heart-outline" size={20} color="#FF69B4" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Добро пожаловать!</Text>
          <Text style={styles.storeName}>Sarah Bernard</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Basket')}
          >
            <Ionicons name="basket-outline" size={24} color="#333" />
            {getCartItemsCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getCartItemsCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск цветов..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
            onFocus={() => navigation.navigate('Search')}
          />
          <TouchableOpacity>
            <Ionicons name="mic-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Весенняя скидка</Text>
            <Text style={styles.promoSubtitle}>До 30% на все букеты</Text>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Смотреть</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: 'https://via.placeholder.com/120/FF69B4/FFFFFF?text=🌸' }}
            style={styles.promoImage}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Категории</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Все</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Рекомендуемые</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Все</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredProducts}
            renderItem={renderFeaturedProduct}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredContainer}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="settings-outline" size={24} color="#FF69B4" />
            <Text style={styles.quickActionText}>Админ панель</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="help-circle-outline" size={24} color="#FF69B4" />
            <Text style={styles.quickActionText}>Помощь</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="call-outline" size={24} color="#FF69B4" />
            <Text style={styles.quickActionText}>Связаться</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF69B4',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  promoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFE4E1',
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 15,
    padding: 20,
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  promoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  promoButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  promoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#FFE4E1',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  featuredContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  featuredCard: {
    width: width * 0.6,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 3,
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  reviews: {
    fontSize: 12,
    color: '#999',
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f9f9f9',
    marginTop: 20,
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;

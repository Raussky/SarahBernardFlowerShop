import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCTS, CATEGORIES } from '../data/products';
import ProductCard from '../src/components/ProductCard';

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');

  const categories = CATEGORIES.slice(0, 4);
  const products = PRODUCTS.slice(0, 4);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color="#FF69B4" />
            <Text style={styles.location}>Актау</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </View>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

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
              <Text style={styles.categoryName}>{category.nameEn}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabs}
          >
            {['All', 'Bouquets', 'Flowers', 'Indoor'].map((tab, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.filterTab, index === 1 && styles.activeTab]}
              >
                <Text style={[styles.filterTabText, index === 1 && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={products}
            renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.specialOffer}>
          <Text style={styles.offerTitle}>Special Offer</Text>
          <Text style={styles.offerText}>Get 20% off on orders above ₸50</Text>
          <TouchableOpacity style={styles.claimButton}>
            <Text style={styles.claimButtonText}>Claim Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>More For You</Text>
          <FlatList
            data={products.slice().reverse()}
            renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
            keyExtractor={item => `${item.id}-2`}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
          />
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
    paddingBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  filterButton: {
    backgroundColor: '#f5f5f5',
    padding: 5,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  banner: {
    backgroundColor: '#FFB6C1',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    minHeight: 150,
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
  filterTabs: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#FF69B4',
  },
  filterTabText: {
    color: '#666',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  specialOffer: {
    backgroundColor: '#FF69B4',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  offerText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 15,
  },
  claimButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  claimButtonText: {
    color: '#FF69B4',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
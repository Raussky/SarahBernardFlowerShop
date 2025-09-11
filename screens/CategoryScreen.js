import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCTS_DATA } from '../data/products';

const CategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  // Get products for this category
  const categoryProducts = {
    'Розы': [
      { id: 1, name: 'Розы китай', price: 500, image: 'https://via.placeholder.com/200/FF69B4/FFFFFF?text=Rose' },
      { id: 2, name: 'Роза голландия', price: 700, image: 'https://via.placeholder.com/200/FFB6C1/FFFFFF?text=Holland' },
      { id: 3, name: 'Роза микс', price: 600, image: 'https://via.placeholder.com/200/FFC0CB/FFFFFF?text=Mix' },
      { id: 4, name: 'Метр роза', price: 1000, image: 'https://via.placeholder.com/200/FFE4E1/FFFFFF?text=Meter' },
      { id: 5, name: 'Кустовой', price: 1600, image: 'https://via.placeholder.com/200/FFF0F5/FFFFFF?text=Bush' },
      { id: 6, name: 'Джульетта', price: 1800, image: 'https://via.placeholder.com/200/FF1493/FFFFFF?text=Juliet' },
    ],
    'Лилии': [
      { id: 7, name: 'Белая лилия', price: 2500, image: 'https://via.placeholder.com/200/FFFFFF/FF69B4?text=Lily' },
      { id: 8, name: 'Розовая лилия', price: 2500, image: 'https://via.placeholder.com/200/FFB6C1/FFFFFF?text=Pink' },
    ],
    'Тюльпаны': [
      { id: 9, name: 'Красные тюльпаны', price: 400, image: 'https://via.placeholder.com/200/FF0000/FFFFFF?text=Tulip' },
      { id: 10, name: 'Желтые тюльпаны', price: 400, image: 'https://via.placeholder.com/200/FFFF00/333333?text=Yellow' },
    ],
    'Ромашки': [
      { id: 11, name: 'Полевые ромашки', price: 300, image: 'https://via.placeholder.com/200/FFFFFF/333333?text=Daisy' },
      { id: 12, name: 'Садовые ромашки', price: 400, image: 'https://via.placeholder.com/200/F0F0F0/333333?text=Garden' },
    ],
  };

  const products = categoryProducts[category.nameRu] || [];

  const subCategories = [
    { id: 'all', name: 'Все' },
    { id: 'popular', name: 'Популярные' },
    { id: 'new', name: 'Новинки' },
    { id: 'sale', name: 'Скидки' },
  ];

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('Product', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <TouchableOpacity style={styles.heartIcon}>
        <Ionicons name="heart-outline" size={20} color="#FF69B4" />
      </TouchableOpacity>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₸{item.price.toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.nameRu || category.name}</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Category Icon */}
      <View style={styles.categoryHeader}>
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryEmoji}>{category.icon}</Text>
        </View>
        <Text style={styles.categoryDescription}>
          Выберите из нашей коллекции {category.nameRu?.toLowerCase() || category.name.toLowerCase()}
        </Text>
      </View>

      {/* Sub Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.subCategoriesContainer}
      >
        {subCategories.map((sub) => (
          <TouchableOpacity
            key={sub.id}
            style={[
              styles.subCategoryButton,
              selectedSubCategory === sub.id && styles.activeSubCategory
            ]}
            onPress={() => setSelectedSubCategory(sub.id)}
          >
            <Text style={[
              styles.subCategoryText,
              selectedSubCategory === sub.id && styles.activeSubCategoryText
            ]}>
              {sub.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.productCount}>{products.length} товаров</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Сортировка</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryEmoji: {
    fontSize: 40,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  subCategoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    maxHeight: 50,
  },
  subCategoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeSubCategory: {
    backgroundColor: '#FF69B4',
  },
  subCategoryText: {
    fontSize: 14,
    color: '#666',
  },
  activeSubCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heartIcon: {
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
  productInfo: {
    padding: 12,
    paddingBottom: 40,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#1e3a8a',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryScreen;

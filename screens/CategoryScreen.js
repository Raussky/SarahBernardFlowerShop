import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCTS } from '../data/products';
import ProductCard from '../src/components/ProductCard';

const CategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  const products = PRODUCTS.filter(p => p.category === category.id);

  const subCategories = [
    { id: 'all', name: 'Все' },
    { id: 'popular', name: 'Популярные' },
    { id: 'new', name: 'Новинки' },
    { id: 'sale', name: 'Скидки' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name || category.nameEn}</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryHeader}>
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryEmoji}>{category.icon}</Text>
        </View>
        <Text style={styles.categoryDescription}>
          Выберите из нашей коллекции {category.name?.toLowerCase() || category.nameEn.toLowerCase()}
        </Text>
      </View>

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

      <View style={styles.sortBar}>
        <Text style={styles.productCount}>{products.length} товаров</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Сортировка</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
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
});

export default CategoryScreen;
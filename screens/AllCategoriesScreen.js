import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import SkeletonLoader from '../src/components/SkeletonLoader';
import AnimatedListItem from '../src/components/AnimatedListItem';

const AllCategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error("Error fetching all categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const renderCategoryItem = ({ item, index }) => {
    const handlePress = () => {
      // Special navigation for the "Combos" category
      if (item.name === 'Комбо' || item.name === 'Выгодные комбо') {
        navigation.navigate('AllCombos');
      } else {
        navigation.navigate('Category', { category: item });
      }
    };

    return (
      <AnimatedListItem index={index}>
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={handlePress}
        >
          <View style={styles.categoryIcon}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                placeholder={{ uri: 'https://via.placeholder.com/120' }}
                style={styles.categoryImage}
                transition={300}
              />
            ) : (
              <Text style={styles.categoryEmoji}>{item.icon || '💐'}</Text>
            )}
          </View>
          <Text style={styles.categoryName}>{item.name}</Text>
        </TouchableOpacity>
      </AnimatedListItem>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <SkeletonLoader width={70} height={70} borderRadius={35} style={{ marginBottom: 8 }} />
          <View style={{ width: 24 }} />
        </View>
        <FlatList
          data={[...Array(8)]} // Placeholder for skeleton
          renderItem={({ item, index }) => (
            <View style={styles.categoryItemSkeleton}>
              <SkeletonLoader width={70} height={70} borderRadius={35} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={80} height={12} borderRadius={4} />
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          // columnWrapperStyle={styles.categoryRow} // Removed
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Все категории</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2} // Keep numColumns for FlatList internal logic, but rely on flexWrap for visual layout
        // columnWrapperStyle={styles.categoryRow} // Removed
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={80} color="#999" />
            <Text style={styles.emptyText}>Категории не найдены.</Text>
          </View>
        }
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginLeft: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: '20'
  },
  categoryRow: {
    marginLeft: 25,
  },
  categoryItem: {
    width: '180',
    height: '180',
     // Fixed width for each item
    marginBottom: 25, // Space between rows
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  categoryEmoji: {
    fontSize: 35,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '100%',
  },
  categoryItemSkeleton: {
    width: '45%',
    alignItems: 'center',
    paddingVertical: 15,
    minHeight: 125,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default AllCategoriesScreen;
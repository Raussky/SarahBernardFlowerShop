import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import SkeletonLoader from '../src/components/SkeletonLoader';

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

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => navigation.navigate('Category', { category: item })}
    >
      <View style={styles.categoryIcon}>
        {item.image_url ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.categoryImage} 
          />
        ) : (
          <Text style={styles.categoryEmoji}>{item.icon || '💐'}</Text>
        )}
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <SkeletonLoader width={150} height={20} borderRadius={4} />
          <View style={{ width: 24 }} />
        </View>
        <FlatList
          data={[...Array(8)]} // Placeholder for skeleton
          renderItem={() => (
            <View style={styles.categoryItemSkeleton}>
              <SkeletonLoader width={70} height={70} borderRadius={35} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={80} height={12} borderRadius={4} />
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          numColumns={3}
          columnWrapperStyle={styles.categoryRow}
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
        numColumns={3}
        columnWrapperStyle={styles.categoryRow}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  categoryRow: {
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  categoryItem: {
    alignItems: 'center',
    width: '30%', // Adjust for 3 columns with spacing
    marginHorizontal: 5,
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryEmoji: {
    fontSize: 30,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoryItemSkeleton: {
    alignItems: 'center',
    width: '30%',
    marginHorizontal: 5,
    marginBottom: 15,
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
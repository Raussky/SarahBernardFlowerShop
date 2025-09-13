import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../src/context/CartContext';
import ProductCard from '../src/components/ProductCard';
import { supabase } from '../src/integrations/supabase/client';
import EmptyState from '../src/components/EmptyState';

const SavedScreen = ({ navigation }) => {
  const { saved } = useContext(CartContext);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('Все');
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      setCategories([{ id: 'all', name: 'Все' }, ...data]);
    } catch (error) {
      console.error("Error fetching categories for SavedScreen:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredSaved = React.useMemo(() => {
    if (activeTab === 'Все') {
      return saved;
    }
    return saved.filter(item => item.categories?.name === activeTab);
  }, [saved, activeTab]);

  if (loadingCategories) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Избранное</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.tab, activeTab === category.name && styles.activeTab]}
            onPress={() => setActiveTab(category.name)}
          >
            <Text style={[styles.tabText, activeTab === category.name && styles.activeTabText]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredSaved.length > 0 ? (
        <FlatList
          data={filteredSaved}
          renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
       <EmptyState
         icon="heart-outline"
         title="В избранном пока пусто"
         message="Добавьте товары, которые вам нравятся, чтобы они всегда были под рукой!"
         buttonText="Перейти к покупкам"
         onButtonPress={() => navigation.navigate('Main', { screen: 'Home' })}
       />
      )}
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    maxHeight: 35,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#FF69B4',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SavedScreen;
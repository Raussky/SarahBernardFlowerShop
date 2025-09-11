import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';

const AdminScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category_id: null });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: false });
      if (productsError) throw productsError;
      setProducts(productsData);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id) {
      showToast('Заполните все поля и выберите категорию', 'error');
      return;
    }

    try {
      // 1. Insert into products table
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          name_ru: newProduct.name,
          category_id: newProduct.category_id,
          image: 'https://via.placeholder.com/200/FF69B4/FFFFFF?text=New'
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Insert into product_variants table
      const { error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: productData.id,
          size: 'шт.', // Default size
          price: parseFloat(newProduct.price),
        });

      if (variantError) throw variantError;

      showToast('Товар успешно добавлен', 'success');
      setNewProduct({ name: '', price: '', category_id: null });
      fetchData(); // Refetch data to show the new product

    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteProduct = (id) => {
    Alert.alert(
      'Удалить товар?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
              
              if (error) throw error;

              setProducts(products.filter(p => p.id !== id));
              showToast('Товар удален', 'success');
            } catch (error) {
              showToast(error.message, 'error');
            }
          }}
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Админ панель</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}>
            <Ionicons name="log-out-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Add Product Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Добавить товар</Text>
          <TextInput
            style={styles.input}
            placeholder="Название товара"
            value={newProduct.name}
            onChangeText={(text) => setNewProduct({...newProduct, name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="Цена"
            value={newProduct.price}
            onChangeText={(text) => setNewProduct({...newProduct, price: text})}
            keyboardType="numeric"
          />
          
          <Text style={styles.categoryLabel}>Категория</Text>
          <View style={styles.categorySelector}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  newProduct.category_id === cat.id && styles.selectedCategoryButton
                ]}
                onPress={() => setNewProduct({...newProduct, category_id: cat.id})}
              >
                <Text style={[
                  styles.categoryButtonText,
                  newProduct.category_id === cat.id && styles.selectedCategoryButtonText
                ]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Text style={styles.addButtonText}>Добавить</Text>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Товары</Text>
          {products.map(product => (
            <View key={product.id} style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  ₸{product.product_variants[0]?.price || 'N/A'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteProduct(product.id)}>
                <Ionicons name="trash-outline" size={20} color="#FF69B4" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Заказы</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>Нет активных заказов</Text>
          ) : (
            orders.map(order => (
              <View key={order.id} style={styles.orderItem}>
                <Text>Заказ #{order.id}</Text>
              </View>
            ))
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>152</Text>
              <Text style={styles.statLabel}>Заказов сегодня</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₸850K</Text>
              <Text style={styles.statLabel}>Выручка</Text>
            </View>
          </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#FF69B4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 14,
    color: '#FF69B4',
    marginTop: 5,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  orderItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFE4E1',
    padding: 20,
    borderRadius: 15,
    flex: 0.48,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryButton: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4',
  },
  categoryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
});

export default AdminScreen;
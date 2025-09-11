import React, { useState, useEffect, useContext } from 'react';
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
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../src/context/AuthContext'; // Import AuthContext

const AdminScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category_id: null, description: '', image: '' });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const isFocused = useIsFocused();
  const { profile } = useContext(AuthContext); // Get profile to check for admin status

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, product_variants(*), categories(name)')
        .order('created_at', { ascending: false });
      if (productsError) throw productsError;
      setProducts(productsData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      // Fetch orders (only if admin)
      if (profile?.is_admin) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (ordersError) throw ordersError;
        setOrders(ordersData);
      } else {
        setOrders([]); // Clear orders if not admin
      }

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
          image: newProduct.image || 'https://via.placeholder.com/200/FF69B4/FFFFFF?text=New',
          description: newProduct.description || 'Описание нового товара.',
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
      setNewProduct({ name: '', price: '', category_id: null, description: '', image: '' });
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

  const getDailyOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter(order => new Date(order.created_at) >= today).length;
  };

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0).toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </SafeAreaView>
    );
  }

  if (!profile?.is_admin) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>У вас нет прав администратора для доступа к этой странице.</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.shopButtonText}>Вернуться в профиль</Text>
        </TouchableOpacity>
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
            placeholder="Описание товара"
            value={newProduct.description}
            onChangeText={(text) => setNewProduct({...newProduct, description: text})}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="URL изображения"
            value={newProduct.image}
            onChangeText={(text) => setNewProduct({...newProduct, image: text})}
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
                <Text style={styles.productCategory}>{product.categories?.name || 'Без категории'}</Text>
                <Text style={styles.productPrice}>
                  ₸{product.product_variants[0]?.price.toLocaleString() || 'N/A'}
                </Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
                  style={styles.actionButton}
                >
                  <Ionicons name="create-outline" size={20} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteProduct(product.id)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF69B4" />
                </TouchableOpacity>
              </View>
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
                <Text style={styles.orderId}>Заказ #{order.id.substring(0, 8)}</Text>
                <Text style={styles.orderCustomer}>Клиент: {order.customer_name}</Text>
                <Text style={styles.orderTotal}>Итого: ₸{order.total_price.toLocaleString()}</Text>
                <Text style={styles.orderStatus}>Статус: {order.status}</Text>
              </View>
            ))
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getDailyOrders()}</Text>
              <Text style={styles.statLabel}>Заказов сегодня</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₸{getTotalRevenue()}</Text>
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
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#FF69B4',
    marginTop: 5,
  },
  productActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 5,
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
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 14,
    color: '#FF69B4',
    marginTop: 5,
  },
  orderStatus: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
    marginTop: 5,
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
  shopButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminScreen;
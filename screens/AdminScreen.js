import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert, // Keep Alert for confirmation dialogs
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider'; // New import

const AdminScreen = ({ navigation }) => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Розы китай', price: 500 },
    { id: 2, name: 'Роза голландия', price: 700 },
    { id: 3, name: 'Роза микс', price: 600 },
  ]);

  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [orders, setOrders] = useState([]);
  const { showToast } = useToast(); // Use toast hook

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price) {
      setProducts([...products, {
        id: Date.now(),
        name: newProduct.name,
        price: parseInt(newProduct.price)
      }]);
      setNewProduct({ name: '', price: '' });
      showToast('Товар добавлен', 'success'); // Replaced Alert with toast
    } else {
      showToast('Заполните все поля', 'error'); // Replaced Alert with toast
    }
  };

  const handleDeleteProduct = (id) => {
    Alert.alert( // Keep Alert for confirmation
      'Удалить товар?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', onPress: () => {
          setProducts(products.filter(p => p.id !== id));
          showToast('Товар удален', 'success'); // Use toast after confirmation
        }}
      ]
    );
  };

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
                <Text style={styles.productPrice}>₸{product.price}</Text>
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
});

export default AdminScreen;
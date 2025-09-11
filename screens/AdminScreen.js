import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('isAdmin');
    Alert.alert('Выход', 'Вы вышли из админ панели');
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Админ панель</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Ionicons name="person-circle-outline" size={60} color="#FF69B4" />
          <Text style={styles.welcomeText}>Добро пожаловать в админ панель</Text>
          <Text style={styles.storeInfo}>Sarah Bernard - Управление магазином</Text>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="bag-outline" size={24} color="#FF69B4" />
            <Text style={styles.menuText}>Управление товарами</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="receipt-outline" size={24} color="#FF69B4" />
            <Text style={styles.menuText}>Заказы</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="bar-chart-outline" size={24} color="#FF69B4" />
            <Text style={styles.menuText}>Аналитика</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#FF69B4" />
            <Text style={styles.menuText}>Настройки</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeCard: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 30,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  storeInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  menu: {
    gap: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    gap: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default AdminScreen;

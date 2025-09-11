import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ToastProvider';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Ошибка выхода', error.message);
    } else {
      showToast('Вы успешно вышли', 'info');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профиль</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user ? user.email.charAt(0).toUpperCase() : 'G'}</Text>
          </View>
          <Text style={styles.storeName}>{user ? user.email : 'Гость'}</Text>
          <Text style={styles.storeDescription}>Магазин цветов</Text>
        </View>

        <View style={styles.menu}>
          {user ? (
            <>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('Admin')}
              >
                <Ionicons name="settings-outline" size={24} color="#FF69B4" />
                <Text style={styles.menuText}>Админ панель</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={24} color="#FF69B4" />
                <Text style={styles.menuText}>Выйти</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-in-outline" size={24} color="#FF69B4" />
              <Text style={styles.menuText}>Войти / Регистрация</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#FF69B4" />
            <Text style={styles.menuText}>Помощь</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color="#FF69B4" />
            <Text style={styles.menuText}>О приложении</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 30,
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  storeDescription: {
    fontSize: 16,
    color: '#666',
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

export default ProfileScreen;
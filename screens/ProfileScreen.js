import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ToastProvider';
import { FONTS } from '../src/config/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    if (error) {
      Alert.alert('Ошибка выхода', error.message);
    } else {
      showToast('Вы успешно вышли', 'info');
    }
  };

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : user?.email || 'Гость';
  
  const displayAvatarLetter = profile?.first_name 
    ? profile.first_name.charAt(0).toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() || 'G';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профиль</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{displayAvatarLetter}</Text>
            )}
          </View>
          <Text style={styles.storeName}>{displayName}</Text>
          <Text style={styles.storeDescription}>Магазин цветов</Text>
        </View>

        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupTitle}>Мой аккаунт</Text>
          {user ? (
            <>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="person-circle-outline" size={24} color="#FF69B4" />
                <Text style={styles.menuText}>Редактировать профиль</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity 
               style={styles.menuItem}
               onPress={() => navigation.navigate('Addresses')}
              >
               <Ionicons name="location-outline" size={24} color="#FF69B4" />
               <Text style={styles.menuText}>Мои адреса</Text>
               <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              {profile?.is_admin ? (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('Admin')}
                >
                  <Ionicons name="settings-outline" size={24} color="#FF69B4" />
                  <Text style={styles.menuText}>Админ панель</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('OrderHistory')}
                >
                  <Ionicons name="receipt-outline" size={24} color="#FF69B4" />
                  <Text style={styles.menuText}>Мои заказы</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('NotificationsSettings')}
              >
                <Ionicons name="notifications-outline" size={24} color="#FF69B4" />
                <Text style={styles.menuText}>Уведомления</Text>
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
        </View>

        {user && (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
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
  menuGroup: {
    marginBottom: 20,
  },
  menuGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    gap: 15,
    marginBottom: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
 signOutButton: {
   marginTop: 20,
   marginBottom: 20,
   backgroundColor: '#FFE4E1',
   padding: 15,
   borderRadius: 12,
   alignItems: 'center',
 },
 signOutButtonText: {
   color: '#D32F2F',
   fontSize: 16,
   fontWeight: '600',
 },
});

export default ProfileScreen;
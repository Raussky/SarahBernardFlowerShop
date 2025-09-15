import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { setDefaultAddress } from '../src/services/addressService';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ToastProvider';
import EmptyState from '../src/components/EmptyState';

const AddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast(); // Assuming useToast is available or should be imported

  const fetchAddresses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [user])
  );

  const handleSetDefault = async (addressId) => {
    const { error } = await setDefaultAddress(addressId, user.id);
    if (error) {
      showToast('Не удалось установить адрес по умолчанию', 'error');
    } else {
      showToast('Адрес по умолчанию обновлен', 'success');
      fetchAddresses(); // Refresh list to show new default
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemWrapper}>
      <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('EditAddress', { address: item })}>
        <Ionicons name={item.is_default ? "star" : "star-outline"} size={24} color={item.is_default ? "#FFC107" : "#ccc"} />
        <Text style={styles.itemText}>{item.address_line1}</Text>
        <Ionicons name="create-outline" size={22} color="#999" />
      </TouchableOpacity>
      {!item.is_default && (
        <TouchableOpacity style={styles.setDefaultButton} onPress={() => handleSetDefault(item.id)}>
          <Text style={styles.setDefaultText}>Сделать основным</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои адреса</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditAddress', {})}>
          <Ionicons name="add" size={28} color="#FF69B4" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{flex: 1}}/>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <EmptyState
              icon="location-outline"
              title="Адреса не найдены"
              message="Добавьте свой адрес, чтобы оформлять доставку еще быстрее."
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  itemWrapper: {
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 15,
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  setDefaultButton: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  setDefaultText: {
    color: '#FF69B4',
    fontWeight: '600',
  }
});

export default AddressesScreen;
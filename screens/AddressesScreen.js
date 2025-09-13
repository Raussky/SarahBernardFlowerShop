import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/context/AuthContext';
import EmptyState from '../src/components/EmptyState';

const AddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const { user } = useAuth();

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id);
    setAddresses(data || []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [user])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('EditAddress', { address: item })}>
      <Text style={styles.itemText}>{item.address_line1}</Text>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16 },
});

export default AddressesScreen;
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useToast } from '../../src/components/ToastProvider';
import EmptyState from '../../src/components/EmptyState';
import AdminHeader from '../../src/components/AdminHeader';

const AdminCombosScreen = ({ navigation }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCombos(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

 useFocusEffect(
   useCallback(() => {
     fetchCombos();
   }, [])
 );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('EditCombo', { comboId: item.id })}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price} ₸</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FF69B4" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title="Комбо-наборы" onAddPress={() => navigation.navigate('EditCombo')} />
      <FlatList
        data={combos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <EmptyState
            title="Нет комбо-наборов"
            message="Добавьте новый комбо-набор, чтобы он появился здесь."
            icon="albums-outline"
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AdminCombosScreen;
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCombos, deleteCombo } from '../../src/services/api';
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
      const { data, error } = await getCombos();
      if (error) {
        showToast(error.message, 'error');
        setCombos([]);
      } else {
        setCombos(data);
      }
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

  const handleDelete = (combo) => {
    Alert.alert(
      'Удалить комбо?',
      `Вы уверены, что хотите удалить "${combo.name}"? Это действие нельзя будет отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: async () => {
            try {
              const { error } = await deleteCombo(combo.id);
              if (error) throw error;
              showToast('Комбо успешно удалено', 'success');
              fetchCombos(); // Refresh the list
            } catch (error) {
              showToast(error.message, 'error');
            }
          }}
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.itemInfoTouchable} onPress={() => navigation.navigate('EditCombo', { comboId: item.id })}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price} ₸</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('EditCombo', { comboId: item.id })} style={styles.actionButton}>
          <Ionicons name="create-outline" size={22} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={22} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    </View>
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
  itemInfoTouchable: {
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    padding: 5,
  },
});

export default AdminCombosScreen;
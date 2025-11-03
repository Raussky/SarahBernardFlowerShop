import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useToast } from '../../src/components/ToastProvider';
import AdminHeader from '../../src/components/AdminHeader';
import { getCategories, deleteCategory, updateCategoryPositions } from '../../src/services/categoryService';
import DraggableFlatList from 'react-native-draggable-flatlist';

const AdminCategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const { showToast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCategories();
      if (error) throw error;
      // Sort by position, fallback to created_at if position is null
      const sortedData = data.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
      setCategories(sortedData);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCategories();
    }
  }, [isFocused]);

  const handleDelete = (category) => {
    Alert.alert('Удалить категорию?', `Вы уверены, что хотите удалить "${category.name}"? Это действие нельзя будет отменить.`, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          // Note: We should add a check if any product is using this category before deleting.
          // For now, we proceed with deletion.
          const { error } = await deleteCategory(category.id);
          if (error) throw error;
          showToast('Категория удалена', 'success');
          fetchCategories();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader title="Категории" onAddPress={() => navigation.navigate('EditCategory')} />
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />
      ) : (
        <DraggableFlatList
          data={categories}
          keyExtractor={item => item.id}
          onDragEnd={async ({ data }) => {
            setCategories(data); // Optimistic update
            const positionsToUpdate = data.map((item, index) => ({
              id_val: item.id,
              position_val: index,
            }));
            const { error } = await updateCategoryPositions(positionsToUpdate);
            if (error) {
              showToast('Ошибка сохранения порядка', 'error');
              fetchCategories(); // Revert on error
            }
          }}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, drag, isActive }) => (
            <TouchableOpacity
              style={[styles.categoryItem, { backgroundColor: isActive ? '#f0f0f0' : '#fff' }]}
              onLongPress={drag}
              disabled={isActive}
            >
              <Ionicons name="menu" size={24} color="#ccc" style={styles.dragHandle} />
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.categoryImage} />
              ) : (
                <Text style={styles.categoryIcon}>{item.icon || '💐'}</Text>
              )}
              <Text style={styles.categoryName}>{item.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => navigation.navigate('EditCategory', { categoryId: item.id })}>
                  <Ionicons name="create-outline" size={22} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { paddingHorizontal: 20 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  dragHandle: { marginRight: 10 },
  categoryIcon: { fontSize: 24, marginRight: 15, width: 40, textAlign: 'center' },
  categoryImage: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  categoryName: { flex: 1, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 15 },
});

export default AdminCategoriesScreen;
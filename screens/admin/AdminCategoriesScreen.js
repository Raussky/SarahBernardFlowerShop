import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';
import { useToast } from '../../src/components/ToastProvider';

const AdminCategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', icon: '' });
  const isFocused = useIsFocused();
  const { showToast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('categories').select('*').order('created_at');
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCategories();
    }
  }, [isFocused]);

  const openModal = (category = { id: null, name: '', icon: '' }) => {
    setCurrentCategory(category);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!currentCategory.name || !currentCategory.icon) {
      showToast('Заполните все поля', 'error');
      return;
    }

    try {
      if (currentCategory.id) { // Update
        const { error } = await supabase.from('categories').update({ name: currentCategory.name, icon: currentCategory.icon }).eq('id', currentCategory.id);
        if (error) throw error;
        showToast('Категория обновлена', 'success');
      } else { // Insert
        const { error } = await supabase.from('categories').insert({ name: currentCategory.name, icon: currentCategory.icon });
        if (error) throw error;
        showToast('Категория добавлена', 'success');
      }
      fetchCategories();
      setModalVisible(false);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить категорию?', 'Это действие нельзя будет отменить.', [
      { text: 'Отмена' },
      { text: 'Удалить', onPress: async () => {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', id);
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Категории</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryName}>{item.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openModal(item)}><Ionicons name="create-outline" size={22} color="#333" /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}><Ionicons name="trash-outline" size={22} color="#FF69B4" /></TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentCategory.id ? 'Редактировать' : 'Добавить'} категорию</Text>
            <TextInput style={styles.input} placeholder="Название (e.g., Букеты)" value={currentCategory.name} onChangeText={text => setCurrentCategory({...currentCategory, name: text})} />
            <TextInput style={styles.input} placeholder="Иконка (один эмодзи, e.g., 💐)" value={currentCategory.icon} onChangeText={text => setCurrentCategory({...currentCategory, icon: text})} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}><Text style={styles.saveButtonText}>Сохранить</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: '#FF69B4', padding: 8, borderRadius: 20 },
  listContent: { paddingHorizontal: 20 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  categoryIcon: { fontSize: 24, marginRight: 15 },
  categoryName: { flex: 1, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 15 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { padding: 10 },
  saveButton: { backgroundColor: '#FF69B4', padding: 10, borderRadius: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default AdminCategoriesScreen;
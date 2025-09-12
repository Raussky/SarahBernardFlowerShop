import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/integrations/supabase/client';
import { useIsFocused } from '@react-navigation/native';
import { useToast } from '../../src/components/ToastProvider';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-url-polyfill/auto';

const AdminBannersScreen = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBanner, setCurrentBanner] = useState({ id: null, image_url: '', title: '', subtitle: '', is_active: true });
  const [uploading, setUploading] = useState(false);
  const isFocused = useIsFocused();
  const { showToast } = useToast();

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      showToast('Ошибка загрузки баннеров', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchBanners();
    }
  }, [isFocused]);

  const openModal = (banner = { id: null, image_url: '', title: '', subtitle: '', is_active: true }) => {
    setCurrentBanner(banner);
    setModalVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Aspect ratio for banners
      quality: 0.8,
    });

    if (!result.canceled) {
      setCurrentBanner(prev => ({ ...prev, image_url: result.assets[0].uri }));
    }
  };

  const uploadImage = async (localUri) => {
    try {
      setUploading(true);
      const response = await fetch(localUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = `banners/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images') // Using the same bucket for simplicity
        .upload(fileName, arrayBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Не удалось загрузить изображение баннера.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentBanner.image_url) {
      showToast('Изображение баннера обязательно.', 'error');
      return;
    }

    try {
      let finalImageUrl = currentBanner.image_url;
      if (currentBanner.image_url.startsWith('file://')) {
        finalImageUrl = await uploadImage(currentBanner.image_url);
      }

      const bannerPayload = {
        image_url: finalImageUrl,
        title: currentBanner.title,
        subtitle: currentBanner.subtitle,
        is_active: currentBanner.is_active,
      };

      if (currentBanner.id) { // Update
        const { error } = await supabase.from('banners').update(bannerPayload).eq('id', currentBanner.id);
        if (error) throw error;
        showToast('Баннер обновлен', 'success');
      } else { // Insert
        const { error } = await supabase.from('banners').insert(bannerPayload);
        if (error) throw error;
        showToast('Баннер добавлен', 'success');
      }
      fetchBanners();
      setModalVisible(false);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить баннер?', 'Это действие нельзя будет отменить.', [
      { text: 'Отмена' },
      { text: 'Удалить', onPress: async () => {
        try {
          const { error } = await supabase.from('banners').delete().eq('id', id);
          if (error) throw error;
          showToast('Баннер удален', 'success');
          fetchBanners();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }}
    ]);
  };

  const renderBannerItem = ({ item }) => (
    <View style={styles.bannerItem}>
      <Image source={{ uri: item.image_url }} style={styles.bannerImage} />
      <View style={styles.bannerInfo}>
        <Text style={styles.bannerTitleText} numberOfLines={1}>{item.title || 'Без заголовка'}</Text>
        <Text style={styles.bannerSubtitleText} numberOfLines={1}>{item.subtitle || 'Без подзаголовка'}</Text>
        <Text style={styles.bannerStatus}>Статус: {item.is_active ? 'Активен' : 'Неактивен'}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openModal(item)}><Ionicons name="create-outline" size={22} color="#333" /></TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}><Ionicons name="trash-outline" size={22} color="#FF69B4" /></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Баннеры</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={banners}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderBannerItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Нет баннеров</Text>}
        />
      )}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentBanner.id ? 'Редактировать' : 'Добавить'} баннер</Text>
            
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {currentBanner.image_url ? <Image source={{ uri: currentBanner.image_url }} style={styles.modalImage} /> : <Ionicons name="camera" size={40} color="#999" />}
              <Text style={styles.imagePickerText}>Нажмите, чтобы выбрать фото</Text>
              {uploading && <ActivityIndicator size="small" color="#FF69B4" style={styles.uploadingIndicator} />}
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="Заголовок" value={currentBanner.title} onChangeText={text => setCurrentBanner({...currentBanner, title: text})} />
            <TextInput style={styles.input} placeholder="Подзаголовок" value={currentBanner.subtitle} onChangeText={text => setCurrentBanner({...currentBanner, subtitle: text})} />
            
            <View style={styles.checkboxContainer}>
              <TouchableOpacity onPress={() => setCurrentBanner(prev => ({ ...prev, is_active: !prev.is_active }))}>
                <Ionicons name={currentBanner.is_active ? "checkbox-outline" : "square-outline"} size={24} color={currentBanner.is_active ? "#4CAF50" : "#999"} />
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Активен</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading}>
                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Сохранить</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  bannerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  bannerImage: { width: 80, height: 45, borderRadius: 5, marginRight: 15, resizeMode: 'cover' },
  bannerInfo: { flex: 1 },
  bannerTitleText: { fontSize: 16, fontWeight: '600' },
  bannerSubtitleText: { fontSize: 12, color: '#666', marginTop: 2 },
  bannerStatus: { fontSize: 12, color: '#999', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  imagePicker: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', height: 120, borderRadius: 12, marginBottom: 20, position: 'relative' },
  modalImage: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' },
  imagePickerText: { color: '#999', marginTop: 5 },
  uploadingIndicator: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -12 }, { translateY: -12 }] },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 10 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkboxLabel: { marginLeft: 10, fontSize: 16, color: '#333' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { padding: 10 },
  saveButton: { backgroundColor: '#FF69B4', padding: 10, borderRadius: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default AdminBannersScreen;
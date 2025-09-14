import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../../src/components/ToastProvider';
import { getCategoryById, upsertCategory } from '../../src/services/api';
import { supabase } from '../../src/integrations/supabase/client'; // Keep for storage ops for now
import { decode } from 'base64-arraybuffer';

const EditCategoryScreen = ({ navigation, route }) => {
  const { categoryId } = route.params || {};
  const { showToast } = useToast();
  const [isNew, setIsNew] = useState(!categoryId);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [image, setImage] = useState(null); // { uri, base64 } or url string

  useEffect(() => {
    if (categoryId) {
      const fetchCategory = async () => {
        setLoading(true);
        const { data, error } = await getCategoryById(categoryId);
        if (error) {
          showToast('Ошибка загрузки категории', 'error');
          navigation.goBack();
        } else {
          setName(data.name);
          setIcon(data.icon || '');
          setImage(data.image_url);
        }
        setLoading(false);
      };
      fetchCategory();
    }
  }, [categoryId]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };
  
  const handleSave = async () => {
    if (!name) {
      showToast('Название категории обязательно', 'error');
      return;
    }
    setSaving(true);
    try {
        let imageUrl = typeof image === 'string' ? image : null;
        if (image && typeof image === 'object' && image.base64) {
            showToast('Загружаем изображение...', 'info');
            const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('categories')
                .upload(fileName, decode(image.base64), { contentType: `image/${fileExt}` });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('categories').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
        }

        const payload = { id: categoryId, name, icon, image_url: imageUrl };
        const { error } = await upsertCategory(payload);

        if (error) throw error;
        showToast(`Категория успешно ${isNew ? 'создана' : 'обновлена'}`, 'success');
        navigation.goBack();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{flex: 1}} size="large" color="#FF69B4" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isNew ? 'Новая категория' : 'Редактировать'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: typeof image === 'string' ? image : image.uri }} style={styles.categoryImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color="#999" />
              <Text style={styles.imagePickerText}>Изображение</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Название категории</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Например, 'Готовые букеты'" />

        <Text style={styles.label}>Иконка (эмодзи)</Text>
        <TextInput style={styles.input} value={icon} onChangeText={setIcon} placeholder="Например, '💐'" />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Сохранить</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontSize: 16, fontWeight: '500', color: '#333', marginTop: 20, marginBottom: 8 },
    input: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, fontSize: 16 },
    imagePicker: { height: 150, width: 150, borderRadius: 75, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', overflow: 'hidden', marginBottom: 20 },
    categoryImage: { width: '100%', height: '100%' },
    imagePickerText: { color: '#999', marginTop: 5 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#f5f5f5', borderTopWidth: 1, borderColor: '#eee' },
    saveButton: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditCategoryScreen;
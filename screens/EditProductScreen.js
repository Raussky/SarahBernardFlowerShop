import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { decode } from 'base-64';
import 'react-native-url-polyfill/auto'; // Required for Supabase Storage

const EditProductScreen = ({ navigation, route }) => {
  const { productId } = route.params;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(!productId);

  // Product state
  const [name, setName] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [sizeInfo, setSizeInfo] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [images, setImages] = useState([]); // Array for multiple images
  const [variants, setVariants] = useState([{ size: 'шт.', price: '', stock_quantity: '99' }]);
  const [initialVariants, setInitialVariants] = useState([]);
  
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*');
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

        if (productId) {
          setIsNewProduct(false);
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*, product_variants(*), product_images(*)') // Fetch gallery images
            .eq('id', productId)
            .single();
          if (productError) throw productError;
          
          setName(productData.name || '');
          setNameRu(productData.name_ru || '');
          setDescription(productData.description || '');
          setComposition(productData.composition || '');
          setSizeInfo(productData.size_info || '');
          setCareInstructions(productData.care_instructions || '');
          setCategoryId(productData.category_id);

          const allImages = [];
          if (productData.image) allImages.push(productData.image);
          if (productData.product_images) {
            productData.product_images.forEach(img => {
              if (!allImages.includes(img.image_url)) {
                allImages.push(img.image_url);
              }
            });
          }
          setImages(allImages);

          if (productData.product_variants && productData.product_variants.length > 0) {
            const formattedVariants = productData.product_variants.map(v => ({
              id: v.id,
              size: v.size,
              price: v.price.toString(),
              stock_quantity: v.stock_quantity.toString(),
            }));
            setVariants(formattedVariants);
            setInitialVariants(formattedVariants);
          }
        }
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', price: '', stock_quantity: '99' }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    } else {
      showToast('Должен быть хотя бы один вариант товара.', 'info');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadImage = async (uri) => {
    try {
      const base64 = await LegacyFileSystem.readAsStringAsync(uri, { encoding: LegacyFileSystem.EncodingType.Base64 });
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Simplified path, removed 'public/'
      const contentType = `image/${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, decode(base64), { 
          contentType,
          upsert: true 
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error('Не удалось получить публичную ссылку после загрузки.');
      }

      return publicUrlData.publicUrl;
    } catch (e) {
      console.error("Ошибка при загрузке изображения:", e);
      showToast(`Ошибка загрузки фото: ${e.message}`, 'error');
      throw e;
    }
  };

  const handleSave = async () => {
    if (!name || !categoryId || variants.some(v => !v.price || !v.size || !v.stock_quantity)) {
      showToast('Пожалуйста, заполните все обязательные поля.', 'error');
      return;
    }
    setSaving(true);
    try {
      const uploadPromises = images.map(imgUri => {
        if (imgUri.startsWith('file://')) {
          return uploadImage(imgUri);
        }
        return Promise.resolve(imgUri);
      });
      const finalImageUrls = await Promise.all(uploadPromises);

      const mainImage = finalImageUrls.length > 0 ? finalImageUrls[0] : null;
      const { data: productData, error: productError } = await supabase
        .from('products')
        .upsert({
          id: productId,
          name,
          name_ru: nameRu,
          description,
          composition,
          size_info: sizeInfo,
          care_instructions: careInstructions,
          category_id: categoryId,
          image: mainImage,
        })
        .select()
        .single();
      if (productError) throw productError;
      const savedProductId = productData.id;

      await supabase.from('product_images').delete().eq('product_id', savedProductId);

      if (finalImageUrls.length > 0) {
        const imagesToInsert = finalImageUrls.map(url => ({
          product_id: savedProductId,
          image_url: url,
        }));
        await supabase.from('product_images').insert(imagesToInsert);
      }

      const variantsToUpsert = variants.map(v => ({
        id: v.id,
        product_id: savedProductId,
        size: v.size,
        price: parseFloat(v.price) || 0,
        stock_quantity: parseInt(v.stock_quantity, 10) || 0,
      }));
      await supabase.from('product_variants').upsert(variantsToUpsert);

      const currentVariantIds = new Set(variants.map(v => v.id).filter(Boolean));
      const variantsToDelete = initialVariants.filter(v => !currentVariantIds.has(v.id));
      for (const variant of variantsToDelete) {
        const { count } = await supabase.from('order_items').select('id', { count: 'exact', head: true }).eq('product_variant_id', variant.id);
        if (count === 0) {
          await supabase.from('product_variants').delete().eq('id', variant.id);
        } else {
          showToast(`Вариант "${variant.size}" не удален, т.к. используется в заказах.`, 'warning');
        }
      }

      showToast(`Товар успешно ${isNewProduct ? 'создан' : 'обновлен'}!`, 'success');
      navigation.goBack();
    } catch (error) {
      console.error("Save error:", error);
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isNewProduct ? 'Новый товар' : 'Редактировать товар'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.label}>Фотографии товара</Text>
          <ScrollView horizontal contentContainerStyle={styles.imageScrollView}>
            {images.map((imgUri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imgUri }} style={styles.productImage} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={24} color="#fff" style={styles.removeImageIcon} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="camera-outline" size={40} color="#999" />
              <Text style={styles.imagePickerText}>Добавить</Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={styles.label}>Название товара (Русский)</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Например, Букет 'Нежность'" />

          <Text style={styles.label}>Название товара (Английский, необязательно)</Text>
          <TextInput style={styles.input} value={nameRu} onChangeText={setNameRu} placeholder="e.g., Bouquet 'Tenderness'" />

          <Text style={styles.label}>Описание</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Краткое описание товара..." />

          <Text style={styles.label}>Состав (необязательно)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={composition} onChangeText={setComposition} multiline placeholder="Например, 5 роз, 3 лилии, зелень..." />

          <Text style={styles.label}>Информация о размере (необязательно)</Text>
          <TextInput style={styles.input} value={sizeInfo} onChangeText={setSizeInfo} placeholder="Например, Высота 40 см, Диаметр 25 см" />

          <Text style={styles.label}>Инструкции по уходу (необязательно)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={careInstructions} onChangeText={setCareInstructions} multiline placeholder="Например, Меняйте воду ежедневно, подрезайте стебли..." />

          <Text style={styles.label}>Категория</Text>
          <View style={styles.categoryContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, categoryId === cat.id && styles.activeCategoryChip]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[styles.categoryText, categoryId === cat.id && styles.activeCategoryText]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Варианты товара</Text>
          {variants.map((variant, index) => (
            <View key={index} style={styles.variantRow}>
              <TextInput style={[styles.variantInput, { flex: 2 }]} value={variant.size} onChangeText={text => handleVariantChange(index, 'size', text)} placeholder="Размер (шт.)" />
              <TextInput style={[styles.variantInput, { flex: 2 }]} value={variant.price} onChangeText={text => handleVariantChange(index, 'price', text)} placeholder="Цена (₸)" keyboardType="numeric" />
              <TextInput style={[styles.variantInput, { flex: 1.5 }]} value={variant.stock_quantity} onChangeText={text => handleVariantChange(index, 'stock_quantity', text)} placeholder="Кол-во" keyboardType="numeric" />
              <TouchableOpacity onPress={() => removeVariant(index)} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={20} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addVariant}>
            <Ionicons name="add" size={20} color="#FF69B4" />
            <Text style={styles.addButtonText}>Добавить вариант</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Сохранить</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  textArea: { height: 100, textAlignVertical: 'top' },
  imageScrollView: { paddingVertical: 10 },
  imageContainer: { marginRight: 10, position: 'relative' },
  productImage: { height: 100, width: 100, borderRadius: 10, backgroundColor: '#e0e0e0' },
  removeImageButton: { position: 'absolute', top: -5, right: -5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12 },
  removeImageIcon: { textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 2 },
  imagePicker: { height: 100, width: 100, borderRadius: 10, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePickerText: { color: '#999', marginTop: 5 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0' },
  activeCategoryChip: { backgroundColor: '#FF69B4' },
  categoryText: { color: '#333' },
  activeCategoryText: { color: '#fff', fontWeight: 'bold' },
  variantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  variantInput: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, flex: 1 },
  removeButton: { padding: 5 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 10, padding: 10 },
  addButtonText: { color: '#FF69B4', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#f5f5f5', borderTopWidth: 1, borderColor: '#eee' },
  saveButton: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditProductScreen;
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-url-polyfill/auto'; // Required for Supabase Storage
import { v4 as uuidv4 } from 'uuid';

const EditProductScreen = ({ navigation, route }) => {
  const { productId } = route.params;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(!productId);

  // Product state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [mainImage, setMainImage] = useState(null); // Main product image
  const [additionalImages, setAdditionalImages] = useState([]); // Array of { id, url } for product_images
  const [variants, setVariants] = useState([{ id: null, size: 'шт.', price: '', stock_quantity: '99' }]);
  const [composition, setComposition] = useState('');
  const [sizeInfo, setSizeInfo] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  
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
            .select('*, product_variants(*), product_images(*)') // Fetch product_images
            .eq('id', productId)
            .single();
          if (productError) throw productError;
          
          setName(productData.name || '');
          setDescription(productData.description || '');
          setMainImage(productData.image || null);
          setAdditionalImages(productData.product_images || []); // Set additional images
          setCategoryId(productData.category_id);
          setComposition(productData.composition || '');
          setSizeInfo(productData.size_info || '');
          setCareInstructions(productData.care_instructions || '');

          if (productData.product_variants && productData.product_variants.length > 0) {
            setVariants(productData.product_variants.map(v => ({ ...v, price: v.price.toString(), stock_quantity: v.stock_quantity.toString() })));
          } else {
            setVariants([{ id: null, size: 'шт.', price: '', stock_quantity: '99' }]);
          }
        } else {
          setIsNewProduct(true);
        }
      } catch (error) {
        showToast(error.message, 'error');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const pickImage = async (isMain = true) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (isMain) {
        setMainImage(result.assets[0].uri);
      } else {
        setAdditionalImages(prev => [...prev, { id: uuidv4(), image_url: result.assets[0].uri, isNew: true }]);
      }
    }
  };

  const uploadImage = async (localUri, folder = 'products') => {
    try {
      const response = await fetch(localUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = `${folder}/${uuidv4()}.jpg`; // Use uuid for unique file names
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
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
      throw new Error("Не удалось загрузить изображение.");
    }
  };

  const handleSaveProduct = async () => {
    if (!name || !categoryId) {
      showToast('Название и категория обязательны.', 'error');
      return;
    }
    setSaving(true);

    try {
      let finalMainImageUrl = mainImage;
      if (mainImage && mainImage.startsWith('file://')) {
        finalMainImageUrl = await uploadImage(mainImage, 'products');
      }

      const productPayload = {
        name,
        description,
        category_id: categoryId,
        image: finalMainImageUrl,
        composition,
        size_info: sizeInfo,
        care_instructions: careInstructions,
      };

      let savedProduct;
      if (isNewProduct) {
        const { data, error } = await supabase.from('products').insert(productPayload).select().single();
        if (error) throw error;
        savedProduct = data;
      } else {
        const { data, error } = await supabase.from('products').update(productPayload).eq('id', productId).select().single();
        if (error) throw error;
        savedProduct = data;
      }

      // Handle product variants
      const existingVariantIds = new Set(variants.filter(v => v.id).map(v => v.id));
      const currentDbVariants = (await supabase.from('product_variants').select('id').eq('product_id', savedProduct.id)).data || [];
      const dbVariantIds = new Set(currentDbVariants.map(v => v.id));

      // Delete variants removed by user
      const variantsToDelete = [...dbVariantIds].filter(id => !existingVariantIds.has(id));
      if (variantsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('product_variants').delete().in('id', variantsToDelete);
        if (deleteError) throw deleteError;
      }

      // Upsert (insert/update) remaining variants
      const variantsToUpsert = variants.map(v => ({
        id: v.id, // Will be null for new variants, existing for updated
        product_id: savedProduct.id,
        size: v.size,
        price: parseFloat(v.price) || 0,
        stock_quantity: parseInt(v.stock_quantity, 10) || 0,
      }));
      const { error: upsertVariantsError } = await supabase.from('product_variants').upsert(variantsToUpsert, { onConflict: 'id' });
      if (upsertVariantsError) throw upsertVariantsError;

      // Handle additional product images
      const existingImageIds = new Set(additionalImages.filter(img => !img.isNew).map(img => img.id));
      const currentDbImages = (await supabase.from('product_images').select('id').eq('product_id', savedProduct.id)).data || [];
      const dbImageIds = new Set(currentDbImages.map(img => img.id));

      // Delete images removed by user
      const imagesToDelete = [...dbImageIds].filter(id => !existingImageIds.has(id));
      if (imagesToDelete.length > 0) {
        const { error: deleteImagesError } = await supabase.from('product_images').delete().in('id', imagesToDelete);
        if (deleteImagesError) throw deleteImagesError;
      }

      // Insert new images
      const newImagesToUpload = additionalImages.filter(img => img.isNew);
      const uploadedImageUrls = await Promise.all(newImagesToUpload.map(img => uploadImage(img.image_url, 'product_images')));
      
      const imagesToInsert = uploadedImageUrls.map(url => ({
        product_id: savedProduct.id,
        image_url: url,
      }));
      if (imagesToInsert.length > 0) {
        const { error: insertImagesError } = await supabase.from('product_images').insert(imagesToInsert);
        if (insertImagesError) throw insertImagesError;
      }

      showToast(isNewProduct ? 'Товар успешно создан' : 'Товар успешно обновлен', 'success');
      navigation.goBack();

    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { id: null, size: '', price: '', stock_quantity: '99' }]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    } else {
      showToast('Должен быть хотя бы один вариант.', 'info');
    }
  };

  const handleRemoveAdditionalImage = (idToRemove) => {
    Alert.alert('Удалить изображение?', 'Вы уверены, что хотите удалить это изображение?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', onPress: () => {
          setAdditionalImages(prev => prev.filter(img => img.id !== idToRemove));
          showToast('Изображение удалено', 'info');
      }},
    ]);
  };

  if (loading) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#FF69B4" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
            <Text style={styles.headerTitle}>{isNewProduct ? 'Новый товар' : 'Редактировать'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Основное изображение</Text>
            <TouchableOpacity onPress={() => pickImage(true)} style={styles.imagePicker}>
              {mainImage ? <Image source={{ uri: mainImage }} style={styles.productImage} /> : <Ionicons name="camera" size={40} color="#999" />}
              <Text style={styles.imagePickerText}>Нажмите, чтобы выбрать основное фото</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Дополнительные изображения</Text>
            <FlatList
              horizontal
              data={additionalImages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.additionalImageContainer}>
                  <Image source={{ uri: item.image_url }} style={styles.additionalImage} />
                  <TouchableOpacity onPress={() => handleRemoveAdditionalImage(item.id)} style={styles.removeImageButton}>
                    <Ionicons name="close-circle" size={24} color="#FF69B4" />
                  </TouchableOpacity>
                </View>
              )}
              ListFooterComponent={
                <TouchableOpacity onPress={() => pickImage(false)} style={styles.addAdditionalImageButton}>
                  <Ionicons name="add" size={30} color="#999" />
                  <Text style={styles.imagePickerText}>Добавить фото</Text>
                </TouchableOpacity>
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.additionalImagesList}
            />

            <Text style={styles.label}>Название товара</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Описание</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />

            <Text style={styles.label}>Категория</Text>
            <View style={styles.categorySelector}>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.categoryButton, categoryId === cat.id && styles.selectedCategoryButton]} onPress={() => setCategoryId(cat.id)}>
                  <Text style={[styles.categoryButtonText, categoryId === cat.id && styles.selectedCategoryButtonText]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Состав</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Например: Роза пионовидная - 5 шт, Эустома - 3 шт" value={composition} onChangeText={setComposition} multiline />

            <Text style={styles.label}>Информация о размере</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Например: Высота 40 см, Ширина 30 см" value={sizeInfo} onChangeText={setSizeInfo} multiline />

            <Text style={styles.label}>Инструкции по уходу</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Например: Меняйте воду каждые 2 дня, подрезайте стебли" value={careInstructions} onChangeText={setCareInstructions} multiline />

            <Text style={styles.label}>Варианты</Text>
            {variants.map((variant, index) => (
              <View key={variant.id || `new-${index}`} style={styles.variantSection}>
                <View style={styles.variantRow}>
                  <View style={styles.variantInputContainer}>
                    <Text style={styles.variantLabel}>Размер</Text>
                    <TextInput style={styles.variantInput} placeholder="шт." value={variant.size} onChangeText={text => { const newVariants = [...variants]; newVariants[index].size = text; setVariants(newVariants); }} />
                  </View>
                  <View style={styles.variantInputContainer}>
                    <Text style={styles.variantLabel}>Цена (₸)</Text>
                    <TextInput style={styles.variantInput} placeholder="0" value={variant.price} onChangeText={text => { const newVariants = [...variants]; newVariants[index].price = text; setVariants(newVariants); }} keyboardType="numeric" />
                  </View>
                  <View style={styles.variantInputContainer}>
                    <Text style={styles.variantLabel}>Остаток</Text>
                    <TextInput style={styles.variantInput} placeholder="99" value={variant.stock_quantity} onChangeText={text => { const newVariants = [...variants]; newVariants[index].stock_quantity = text; setVariants(newVariants); }} keyboardType="numeric" />
                  </View>
                  <TouchableOpacity style={styles.removeVariantButton} onPress={() => handleRemoveVariant(index)}>
                    <Ionicons name="trash-outline" size={22} color="#FF69B4" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addVariantButton} onPress={handleAddVariant}>
              <Ionicons name="add" size={20} color="#FF69B4" />
              <Text style={styles.addVariantText}>Добавить вариант</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Сохранить</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { padding: 20 },
  imagePicker: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', height: 150, borderRadius: 12, marginBottom: 20 },
  productImage: { width: '100%', height: '100%', borderRadius: 12 },
  imagePickerText: { color: '#999', marginTop: 5 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  selectedCategoryButton: { backgroundColor: '#FF69B4' },
  categoryButtonText: { color: '#333' },
  selectedCategoryButtonText: { color: '#fff' },
  
  variantSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  variantInputContainer: {
    flex: 1,
  },
  variantLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 2,
  },
  variantInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  removeVariantButton: {
    padding: 5,
    marginBottom: 5,
  },

  addVariantButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FF69B4', marginTop: 5 },
  addVariantText: { color: '#FF69B4', marginLeft: 5 },
  saveButton: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Additional Images styles
  additionalImagesList: {
    paddingVertical: 10,
  },
  additionalImageContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  addAdditionalImageButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
});

export default EditProductScreen;
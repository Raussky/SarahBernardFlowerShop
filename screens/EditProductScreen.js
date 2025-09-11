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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';
import * as ImagePicker from 'expo-image-picker';

const EditProductScreen = ({ navigation, route }) => {
  const { productId } = route.params;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isNewProduct, setIsNewProduct] = useState(!productId);

  // Product state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [image, setImage] = useState(null);
  const [variants, setVariants] = useState([{ size: 'шт.', price: '', stock_quantity: '99' }]);
  
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
            .select('*, product_variants(*)')
            .eq('id', productId)
            .single();
          if (productError) throw productError;
          
          setName(productData.name || '');
          setDescription(productData.description || '');
          setImage(productData.image || null);
          setCategoryId(productData.category_id);
          if (productData.product_variants && productData.product_variants.length > 0) {
            setVariants(productData.product_variants.map(v => ({ ...v, price: v.price.toString(), stock_quantity: v.stock_quantity.toString() })));
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      showToast('Изображение выбрано. Загрузка на сервер произойдет при сохранении.', 'info');
    }
  };

  const handleSaveProduct = async () => {
    // TODO: Implement image upload to Supabase Storage
    showToast('Сохранение... (загрузка изображения пока не реализована)', 'info');
    // For now, we'll just save the product data without the image
  };

  if (loading) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#FF69B4" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
          <Text style={styles.headerTitle}>{isNewProduct ? 'Новый товар' : 'Редактировать'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? <Image source={{ uri: image }} style={styles.productImage} /> : <Ionicons name="camera" size={40} color="#999" />}
            <Text style={styles.imagePickerText}>Нажмите, чтобы выбрать фото</Text>
          </TouchableOpacity>

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

          <Text style={styles.label}>Варианты</Text>
          {variants.map((variant, index) => (
            <View key={index} style={styles.variantContainer}>
              <TextInput style={styles.variantInput} placeholder="Размер" value={variant.size} onChangeText={text => { const newVariants = [...variants]; newVariants[index].size = text; setVariants(newVariants); }} />
              <TextInput style={styles.variantInput} placeholder="Цена" value={variant.price} onChangeText={text => { const newVariants = [...variants]; newVariants[index].price = text; setVariants(newVariants); }} keyboardType="numeric" />
              <TextInput style={styles.variantInput} placeholder="Остаток" value={variant.stock_quantity} onChangeText={text => { const newVariants = [...variants]; newVariants[index].stock_quantity = text; setVariants(newVariants); }} keyboardType="numeric" />
            </View>
          ))}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
            <Text style={styles.saveButtonText}>Сохранить</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  variantContainer: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  variantInput: { flex: 1, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8, fontSize: 14 },
  saveButton: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditProductScreen;
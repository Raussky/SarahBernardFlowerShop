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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';

const EditProductScreen = ({ navigation, route }) => {
  const { productId } = route.params;
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [image, setImage] = useState('');

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        setLoading(true);
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        setProduct(productData);
        setName(productData.name || productData.name_ru);
        setDescription(productData.description || '');
        setImage(productData.image || '');
        setCategoryId(productData.category_id);
        if (productData.product_variants && productData.product_variants.length > 0) {
          setPrice(productData.product_variants[0].price.toString());
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);

      } catch (error) {
        showToast(error.message, 'error');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCategories();
  }, [productId]);

  const handleSaveProduct = async () => {
    if (!name || !price || !categoryId) {
      showToast('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }

    setLoading(true);
    try {
      // Update product details
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({
          name: name,
          name_ru: name, // Assuming name_ru is same as name for simplicity
          description: description,
          image: image,
          category_id: categoryId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (productUpdateError) throw productUpdateError;

      // Update product variant price (assuming one variant per product for now)
      if (product?.product_variants?.length > 0) {
        const { error: variantUpdateError } = await supabase
          .from('product_variants')
          .update({
            price: parseFloat(price),
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.product_variants[0].id);

        if (variantUpdateError) throw variantUpdateError;
      }

      showToast('Товар успешно обновлен!', 'success');
      navigation.goBack();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Редактировать товар</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Название товара</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Название товара"
          />

          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Описание товара"
            multiline
          />

          <Text style={styles.label}>Цена</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Цена"
          />

          <Text style={styles.label}>URL изображения</Text>
          <TextInput
            style={styles.input}
            value={image}
            onChangeText={setImage}
            placeholder="URL изображения"
          />

          <Text style={styles.label}>Категория</Text>
          <View style={styles.categorySelector}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  categoryId === cat.id && styles.selectedCategoryButton
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  categoryId === cat.id && styles.selectedCategoryButtonText
                ]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
            <Text style={styles.saveButtonText}>Сохранить изменения</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryButton: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4',
  },
  categoryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProductScreen;
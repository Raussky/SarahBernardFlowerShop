import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
 } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../src/components/ToastProvider';
import { supabase } from '../../src/integrations/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import 'react-native-url-polyfill/auto';
import { logger } from '../../src/utils/logger';

const EditComboScreen = ({ navigation, route }) => {
  const { comboId } = route.params || {};
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewCombo, setIsNewCombo] = useState(!comboId);

  // Product Selector Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Combo state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null); // Will store { uri, base64 } for new images or just URL for existing
  const [isActive, setIsActive] = useState(true);
  const [comboItems, setComboItems] = useState([]); // To store { product_variant_id, quantity }

  useEffect(() => {
    const fetchData = async () => {
     try {
       const { data: productsData, error } = await supabase
         .from('products')
         .select('*, product_variants(*)')
         .order('name', { ascending: true });
       if (error) throw error;
       setAllProducts(productsData);
       setFilteredProducts(productsData);

       if (comboId) {
         setIsNewCombo(false);
         const { data: comboData, error: comboError } = await supabase
           .from('combos')
           .select('*, combo_items(*, product_variants(*, products(*)))')
           .eq('id', comboId)
           .single();
         if (comboError) throw comboError;

         setName(comboData.name);
         setDescription(comboData.description || '');
         setPrice(comboData.price.toString());
         setImage(comboData.image);
         setIsActive(comboData.is_active);
         
         const items = comboData.combo_items.map(item => ({
           product_variant_id: item.product_variant_id,
           quantity: item.quantity,
           name: item.product_variants.products.name,
           size: item.product_variants.size,
         }));
         setComboItems(items);
       }
     } catch (error) {
       showToast(error.message, 'error');
     } finally {
       setLoading(false);
     }
    };
    fetchData();
  }, [comboId]);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
      }
    } catch (error) {
      showToast(`Ошибка при выборе изображения: ${error.message}`, 'error');
    }
  };

  const uploadImage = async (base64Data, uri) => {
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;
      const contentType = `image/${fileExt}`;
      const byteArray = decode(base64Data);

      const { error } = await supabase.storage
        .from('combo-images')
        .upload(filePath, byteArray, { contentType, upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('combo-images')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      logger.error('Upload error', error, { context: 'EditComboScreen', uri });
      throw error;
    }
  };

  const handleSave = async () => {
    if (!name || !price || comboItems.length === 0) {
      showToast('Пожалуйста, заполните название, цену и добавьте хотя бы один товар.', 'error');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = typeof image === 'string' ? image : null; // Keep existing image URL if not changed

      // If a new image was picked, upload it
      if (image && typeof image === 'object' && image.base64) {
        showToast('Загружаем изображение...', 'info');
        imageUrl = await uploadImage(image.base64, image.uri);
      }

      const { data: savedCombo, error: comboError } = await supabase
        .from('combos')
        .upsert({
          id: comboId,
          name,
          description,
          price: parseFloat(price),
          image: imageUrl,
          is_active: isActive,
        })
        .select()
        .single();

      if (comboError) throw comboError;

      const savedComboId = savedCombo.id;

      // Delete old items and insert new ones
      await supabase.from('combo_items').delete().eq('combo_id', savedComboId);
      const itemsToInsert = comboItems.map(item => ({
        combo_id: savedComboId,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
      }));
      const { error: itemsError } = await supabase.from('combo_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      showToast(`Комбо успешно ${isNewCombo ? 'создано' : 'обновлено'}!`, 'success');
      navigation.goBack();

    } catch (error) {
      showToast(`Ошибка сохранения: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

 const handleSearch = (text) => {
   setSearchText(text);
   if (!text) {
     setFilteredProducts(allProducts);
     return;
   }
   const lowercasedText = text.toLowerCase();
   const filtered = allProducts.filter(p =>
     p.name?.toLowerCase().includes(lowercasedText) ||
     p.name_ru?.toLowerCase().includes(lowercasedText)
   );
   setFilteredProducts(filtered);
 };

 const handleSelectVariant = (product, variant) => {
   // For now, just add one. Quantity selection can be added later.
   const newItem = {
     product_variant_id: variant.id,
     quantity: 1,
     name: product.name,
     size: variant.size,
   };
   setComboItems([...comboItems, newItem]);
   setIsModalVisible(false);
   setSearchText('');
   setFilteredProducts(allProducts);
 };

const handleRemoveItem = (indexToRemove) => {
  setComboItems(comboItems.filter((_, index) => index !== indexToRemove));
};

 const renderProductSelector = () => (
   <Modal
     visible={isModalVisible}
     animationType="slide"
     onRequestClose={() => setIsModalVisible(false)}
   >
     <SafeAreaView style={{ flex: 1 }}>
       <View style={styles.modalHeader}>
         <TextInput
           style={styles.searchInput}
           placeholder="Поиск товара..."
           value={searchText}
           onChangeText={handleSearch}
         />
         <TouchableOpacity onPress={() => setIsModalVisible(false)}>
           <Ionicons name="close" size={24} color="#333" />
         </TouchableOpacity>
       </View>
       <FlatList
         data={filteredProducts}
         keyExtractor={(item) => item.id.toString()}
         renderItem={({ item }) => (
           <View style={styles.productItem}>
             <Text style={styles.productName}>{item.name}</Text>
             {item.product_variants.map(variant => (
               <TouchableOpacity
                 key={variant.id}
                 style={styles.variantButton}
                 onPress={() => handleSelectVariant(item, variant)}
               >
                 <Text>{variant.size} - {variant.price} ₸</Text>
               </TouchableOpacity>
             ))}
           </View>
         )}
       />
     </SafeAreaView>
   </Modal>
 );

  if (loading) {
    return <ActivityIndicator size="large" color="#FF69B4" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isNewCombo ? 'Новое комбо' : 'Редактировать комбо'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.label}>Название комбо</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Например, 'Романтический вечер'" />

        <Text style={styles.label}>Описание</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Краткое описание комбо..." />
        
        <Text style={styles.label}>Цена (₸)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Например, 15000" keyboardType="decimal-pad" />

        <Text style={styles.label}>Изображение комбо</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: typeof image === 'string' ? image : image.uri }} style={styles.comboImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={30} color="#999" />
              <Text style={styles.imagePickerText}>Выбрать фото</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Товары в наборе</Text>
        {comboItems.map((item, index) => (
           <View key={index} style={styles.comboItem}>
             <Text style={{ flex: 1 }}>{item.name} ({item.size}) x {item.quantity}</Text>
             <TouchableOpacity onPress={() => handleRemoveItem(index)}>
               <Ionicons name="trash-outline" size={20} color="#D32F2F" />
             </TouchableOpacity>
           </View>
         ))}
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
           <Ionicons name="add" size={20} color="#FF69B4" />
           <Text style={styles.addButtonText}>Добавить товар</Text>
         </TouchableOpacity>

      </ScrollView>
      {renderProductSelector()}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 20, 20) }]}>
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
  textArea: { height: 100, textAlignVertical: 'top' },
  imagePicker: {
    height: 150,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  comboImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerText: {
    color: '#999',
    marginTop: 5,
  },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 10, padding: 10 },
  addButtonText: { color: '#FF69B4', fontWeight: 'bold' },
  comboItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, height: 40, backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, marginRight: 10 },
  productItem: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  variantButton: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 5, marginTop: 5 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#f5f5f5', borderTopWidth: 1, borderColor: '#eee' },
  saveButton: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditComboScreen;
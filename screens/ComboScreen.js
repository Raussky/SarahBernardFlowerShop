import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/components/ToastProvider';
import { CartContext } from '../src/context/CartContext';

import PrimaryButton from '../src/components/PrimaryButton';

const ComboScreen = ({ route, navigation }) => {
  const { comboId } = route.params;
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchComboDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('combos')
          .select('*, combo_items(*, product_variants(*, products(*)))')
          .eq('id', comboId)
          .single();
        
        if (error) throw error;
        setCombo(data);
      } catch (error) {
        showToast('Не удалось загрузить информацию о комбо', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchComboDetails();
  }, [comboId]);

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FF69B4" />;
  }

  if (!combo) {
    return (
      <View style={styles.centered}>
        <Text>Комбо не найдено.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: combo.image || 'https://placehold.co/600x400' }} style={styles.image} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={styles.name}>{combo.name}</Text>
          <Text style={styles.description}>{combo.description}</Text>
          
          <Text style={styles.sectionTitle}>Состав набора:</Text>
          {combo.combo_items.map(item => (
            <View key={item.product_variant_id} style={styles.item}>
              <Text style={styles.itemName}>
                {item.product_variants.products.name} ({item.product_variants.size})
              </Text>
              <Text style={styles.itemQuantity}>x {item.quantity}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
       <View style={styles.priceContainer}>
         <Text style={styles.priceLabel}>Цена</Text>
         <Text style={styles.price}>₸{combo.price.toLocaleString()}</Text>
       </View>
       <View style={{flex: 1}}>
         <PrimaryButton
           title="В корзину"
           onPress={() => {
             addToCart(combo, 'combo');
             showToast(`${combo.name} добавлено в корзину!`, 'success');
           }}
         />
       </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300 },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  description: { fontSize: 16, color: '#666', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemName: { fontSize: 16 },
  itemQuantity: { fontSize: 16, color: '#888' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderColor: '#f0f0f0', gap: 15 },
  priceContainer: {},
  priceLabel: { fontSize: 14, color: '#666' },
  price: { fontSize: 22, fontWeight: 'bold' },
});

export default ComboScreen;
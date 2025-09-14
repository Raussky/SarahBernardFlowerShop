import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import EmptyState from '../src/components/EmptyState';

const AllCombosScreen = ({ navigation }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCombos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error) {
        setCombos(data);
      }
      setLoading(false);
    };
    fetchCombos();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.comboCard} onPress={() => navigation.navigate('Combo', { comboId: item.id })}>
      <Image source={{ uri: item.image || 'https://placehold.co/600x400' }} style={styles.comboImage} />
      <View style={styles.cardContent}>
        <Text style={styles.comboName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.comboPrice}>₸{item.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FF69B4" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Выгодные комбо</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={combos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={() => (
          <EmptyState
            icon="albums-outline"
            title="Комбо-наборы не найдены"
            message="Скоро здесь появятся выгодные предложения."
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  listContent: { padding: 20 },
  comboCard: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  comboImage: { width: '100%', height: 120 },
  cardContent: { padding: 10 },
  comboName: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  comboPrice: { fontSize: 14, fontWeight: 'bold', color: '#333' },
});

export default AllCombosScreen;
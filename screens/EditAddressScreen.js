import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ToastProvider';
import PrimaryButton from '../src/components/PrimaryButton';

const EditAddressScreen = ({ navigation, route }) => {
  const { address } = route.params || {};
  const [addressLine1, setAddressLine1] = useState(address?.address_line1 || '');
  const [city, setCity] = useState(address?.city || 'Актау');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!addressLine1) {
      showToast('Пожалуйста, введите адрес', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('addresses').upsert({
      id: address?.id,
      user_id: user.id,
      address_line1: addressLine1,
      city: city,
    });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Адрес сохранен!', 'success');
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    Alert.alert('Удалить адрес?', '', [
      { text: 'Отмена' },
      { text: 'Удалить', onPress: async () => {
        const { error } = await supabase.from('addresses').delete().eq('id', address.id);
        if (error) showToast(error.message, 'error');
        else navigation.goBack();
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{address ? 'Редактировать адрес' : 'Новый адрес'}</Text>
        {address ? (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#D32F2F" />
          </TouchableOpacity>
        ) : <View style={{width: 24}} />}
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Адрес (улица, дом, квартира)</Text>
        <TextInput style={styles.input} value={addressLine1} onChangeText={setAddressLine1} />
        <Text style={styles.label}>Город</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} />
        <PrimaryButton title="Сохранить" onPress={handleSave} loading={loading} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { padding: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
});

export default EditAddressScreen;
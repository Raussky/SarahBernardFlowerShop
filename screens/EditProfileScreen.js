import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-url-polyfill/auto'; // Required for Supabase Storage

const EditProfileScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!user) return null;

    const fileExt = uri.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveProfile = async () => {
    if (!user) {
      showToast('Вы не авторизованы.', 'error');
      return;
    }

    setLoading(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (avatarUrl && avatarUrl.startsWith('file://')) {
        newAvatarUrl = await uploadImage(avatarUrl);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast('Профиль успешно обновлен!', 'success');
      navigation.goBack();
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayAvatarLetter = firstName 
    ? firstName.charAt(0).toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() || 'G';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Редактировать профиль</Text>
            <View style={{ width: 24 }} />
          </View>

          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {avatarUrl && !avatarUrl.startsWith('file://') ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : avatarUrl && avatarUrl.startsWith('file://') ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{displayAvatarLetter}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changeAvatarText}>Изменить фото профиля</Text>

          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ваше имя"
            autoCapitalize="words"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Фамилия</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Ваша фамилия"
            autoCapitalize="words"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Сохранить изменения</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 5,
  },
  changeAvatarText: {
    textAlign: 'center',
    color: '#FF69B4',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
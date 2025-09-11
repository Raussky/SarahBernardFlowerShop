import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContext } from '../App';

const LoginScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { setIsAdmin } = useContext(CartContext);

  const handleAuth = async () => {
    if (isLogin) {
      // Login logic
      if (email === 'admin@sarah.kz' && password === 'admin123') {
        await AsyncStorage.setItem('isAdmin', 'true');
        setIsAdmin(true);
        navigation.navigate('Admin');
      } else {
        Alert.alert('Ошибка', 'Неверный email или пароль');
      }
    } else {
      // Signup logic
      if (!email || !password || !confirmPassword || !storeName) {
        Alert.alert('Ошибка', 'Заполните все поля');
        return;
      }
      
      if (password !== confirmPassword) {
        Alert.alert('Ошибка', 'Пароли не совпадают');
        return;
      }
      
      // Save new admin
      const adminData = {
        email,
        password,
        storeName,
      };
      
      await AsyncStorage.setItem('adminData', JSON.stringify(adminData));
      Alert.alert('Успешно', 'Аккаунт создан! Теперь войдите');
      setIsLogin(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SB</Text>
            </View>
            <Text style={styles.title}>Sarah Bernard</Text>
            <Text style={styles.subtitle}>Админ панель</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Вход в систему' : 'Регистрация магазина'}
            </Text>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Название магазина"
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholderTextColor="#999"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Пароль"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Подтвердите пароль"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                />
              </View>
            )}

            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleAuth}>
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Войти' : 'Зарегистрировать магазин'}
              </Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isLogin ? 'Новый магазин?' : 'Уже есть аккаунт?'}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.switchLink}>
                  {isLogin ? 'Регистрация' : 'Войти'}
                </Text>
              </TouchableOpacity>
            </View>

            {isLogin && (
              <View style={styles.demoAccount}>
                <Text style={styles.demoText}>Демо доступ:</Text>
                <Text style={styles.demoCredentials}>admin@sarah.kz / admin123</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#FF69B4',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  switchText: {
    color: '#666',
    marginRight: 5,
  },
  switchLink: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  demoAccount: {
    backgroundColor: '#FFE4E1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  demoCredentials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default LoginScreen;

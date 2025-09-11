import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';

const LoginScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // States for validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const { showToast } = useToast();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email не может быть пустым.';
    if (!emailRegex.test(email)) return 'Введите корректный email.';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Пароль не может быть пустым.';
    if (password.length < 6) return 'Пароль должен быть не менее 6 символов.';
    return '';
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (emailValidation || passwordValidation) {
      setEmailError(emailValidation);
      setPasswordError(passwordValidation);
      showToast('Пожалуйста, исправьте ошибки в форме.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Вход выполнен успешно!', 'success');
      navigation.navigate('Profile');
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    let confirmPasswordValidation = '';
    if (password !== confirmPassword) {
      confirmPasswordValidation = 'Пароли не совпадают.';
    }
    if (!confirmPassword) {
      confirmPasswordValidation = 'Подтвердите пароль.';
    }

    if (emailValidation || passwordValidation || confirmPasswordValidation) {
      setEmailError(emailValidation);
      setPasswordError(passwordValidation);
      setConfirmPasswordError(confirmPasswordValidation);
      showToast('Пожалуйста, исправьте ошибки в форме.', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Аккаунт создан! Проверьте почту для подтверждения.', 'success');
      setIsLogin(true);
    }
    setLoading(false);
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
              {isLogin ? 'Вход в систему' : 'Регистрация'}
            </Text>

            <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : {}]}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setEmailError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : {}]}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Пароль"
                  value={password}
                  onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
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
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            </View>

            {!isLogin && (
              <View style={[styles.inputWrapper, confirmPasswordError ? styles.inputWrapperError : {}]}>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Подтвердите пароль"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setConfirmPasswordError(''); }}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                  />
                </View>
                {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={isLogin ? handleLogin : handleSignUp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Войти' : 'Зарегистрироваться'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              </Text>
              <TouchableOpacity onPress={() => {
                setIsLogin(!isLogin);
                // Clear all errors and inputs when switching form type
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setEmailError('');
                setPasswordError('');
                setConfirmPasswordError('');
              }}>
                <Text style={styles.switchLink}>
                  {isLogin ? 'Регистрация' : 'Войти'}
                </Text>
              </TouchableOpacity>
            </View>
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
  inputWrapper: {
    marginBottom: 15,
  },
  inputWrapperError: {
    marginBottom: 5, // Reduce margin if error text is present
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#f5f5f5', // Default border color
  },
  inputContainerError: {
    borderColor: '#FF0000', // Red border for error
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
  },
  submitButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
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
});

export default LoginScreen;
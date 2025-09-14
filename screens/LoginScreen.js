import React, { useState, useEffect } from 'react';
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
import MaskInput from 'react-native-mask-input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../src/components/ToastProvider';
import { supabase } from '../src/integrations/supabase/client';

const LoginScreen = ({ navigation }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'magiclink'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const { showToast } = useToast();

 useEffect(() => {
   if (email) {
     setEmailError(validateEmail(email));
   }
 }, [email]);

 useEffect(() => {
   if (password) {
     setPasswordError(validatePassword(password));
   }
 }, [password]);

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

  const validatePhone = (phone) => {
    if (!phone) return 'Телефон не может быть пустым.';
    if (phone.replace(/\D/g, '').length < 10) return 'Введите корректный номер телефона.';
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
      let errorMessage = 'Произошла ошибка при входе.';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Неверный адрес электронной почты или пароль.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Проблема с подключением к интернету. Пожалуйста, проверьте ваше соединение.';
      }
      showToast(errorMessage, 'error');
    } else {
      showToast('Вход выполнен успешно!', 'success');
      navigation.navigate('Main', { screen: 'Profile' });
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFirstNameError('');
    setPhoneError('');

    let hasError = false;

    if (!firstName) {
      setFirstNameError('Имя не может быть пустым.');
      hasError = true;
    }
    const phoneValidation = validatePhone(phone);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      hasError = true;
    }
 
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    let confirmPasswordValidation = '';
    if (password !== confirmPassword) {
      confirmPasswordValidation = 'Пароли не совпадают.';
    }
    if (!confirmPassword) {
      confirmPasswordValidation = 'Подтвердите пароль.';
    }
 
    if (emailValidation) { setEmailError(emailValidation); hasError = true; }
    if (passwordValidation) { setPasswordError(passwordValidation); hasError = true; }
    if (confirmPasswordValidation) { setConfirmPasswordError(confirmPasswordValidation); hasError = true; }

    if (hasError) {
      showToast('Пожалуйста, исправьте ошибки в форме.', 'error');
      return;
    }
 
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          phone: phone,
        },
      },
    });
    if (error) {
      let errorMessage = 'Произошла ошибка при регистрации.';
      if (error.message.includes('User already registered')) {
        errorMessage = 'Пользователь с таким email уже зарегистрирован.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Проблема с подключением к интернету. Пожалуйста, проверьте ваше соединение.';
      }
      showToast(errorMessage, 'error');
    } else {
      showToast('Аккаунт создан! Проверьте почту для подтверждения.', 'success');
      setAuthMode('login');
    }
    setLoading(false);
  };

  const handleMagicLink = async () => {
   setEmailError('');
   const emailValidation = validateEmail(email);
   if (emailValidation) {
     setEmailError(emailValidation);
     showToast(emailValidation, 'error');
     return;
   }

   setLoading(true);
   const { error } = await supabase.auth.signInWithOtp({ email });
   if (error) {
     let errorMessage = 'Произошла ошибка при отправке ссылки.';
     if (error.message.includes('Network request failed')) {
       errorMessage = 'Проблема с подключением к интернету. Пожалуйста, проверьте ваше соединение.';
     }
     showToast(errorMessage, 'error');
   } else {
     showToast('Проверьте почту! Мы отправили вам ссылку для входа.', 'success');
     setAuthMode('login');
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
            {/* <Text style={styles.subtitle}>Админ панель</Text> */}
          </View>

          <View style={styles.form}>
            <View style={styles.authToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, authMode === 'login' && styles.toggleButtonActive]}
                onPress={() => setAuthMode('login')}
              >
                <Text style={[styles.toggleButtonText, authMode === 'login' && styles.toggleButtonTextActive]}>Вход</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, authMode === 'signup' && styles.toggleButtonActive]}
                onPress={() => setAuthMode('signup')}
              >
                <Text style={[styles.toggleButtonText, authMode === 'signup' && styles.toggleButtonTextActive]}>Регистрация</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, authMode === 'magiclink' && styles.toggleButtonActive]}
                onPress={() => setAuthMode('magiclink')}
              >
                <Text style={[styles.toggleButtonText, authMode === 'magiclink' && styles.toggleButtonTextActive]}>По ссылке</Text>
              </TouchableOpacity>
            </View>

            {authMode === 'signup' && (
              <>
                <View style={[styles.inputWrapper, firstNameError ? styles.inputWrapperError : {}]}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Имя" value={firstName} onChangeText={(text) => { setFirstName(text); setFirstNameError(''); }} autoCapitalize="words" placeholderTextColor="#999" />
                  </View>
                  {!!firstNameError && <Text style={styles.errorText}>{firstNameError}</Text>}
                </View>
                <View style={[styles.inputWrapper, phoneError ? styles.inputWrapperError : {}]}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                    <MaskInput
                      style={styles.input}
                      value={phone}
                      onChangeText={(masked, unmasked) => {
                        setPhone(masked); // or unmasked
                        setPhoneError('');
                      }}
                      mask={['+', '7', ' ', '(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/]}
                      placeholder="+7 (___) ___-__-__"
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                  {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
                </View>
              </>
            )}

            <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : {}]}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={(text) => { setEmail(text); setEmailError(''); }} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
              </View>
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            {authMode !== 'magiclink' && (
              <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : {}]}>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Пароль" value={password} onChangeText={(text) => { setPassword(text); setPasswordError(''); }} secureTextEntry={!showPassword} placeholderTextColor="#999" />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              </View>
            )}

            {authMode === 'signup' && (
              <View style={[styles.inputWrapper, confirmPasswordError ? styles.inputWrapperError : {}]}>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Подтвердите пароль" value={confirmPassword} onChangeText={(text) => { setConfirmPassword(text); setConfirmPasswordError(''); }} secureTextEntry={!showPassword} placeholderTextColor="#999" />
                </View>
                {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignUp : handleMagicLink} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {authMode === 'login' && 'Войти'}
                  {authMode === 'signup' && 'Зарегистрироваться'}
                  {authMode === 'magiclink' && 'Получить ссылку'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20 },
  backButton: { marginTop: 10, marginBottom: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF69B4', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666' },
  form: { flex: 1 },
  authToggle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    marginBottom: 25,
    padding: 5,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FF69B4',
  },
  toggleButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  inputWrapper: { marginBottom: 15 },
  inputWrapperError: { marginBottom: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#f5f5f5' },
  inputContainerError: { borderColor: '#FF0000' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  errorText: { color: '#FF0000', fontSize: 12, marginTop: 5, marginLeft: 15 },
  submitButton: { backgroundColor: '#FF69B4', borderRadius: 25, paddingVertical: 15, alignItems: 'center', marginBottom: 20, marginTop: 10 },
  submitButtonDisabled: { backgroundColor: '#FF69B4', opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;
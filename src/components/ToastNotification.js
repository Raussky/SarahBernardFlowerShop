import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const ToastNotification = forwardRef(({}, ref) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'success', 'error', 'info'
  const fadeAnim = useState(new Animated.Value(0))[0]; // Initial value for opacity: 0
  const translateYAnim = useState(new Animated.Value(-100))[0]; // Initial value for Y position

  useImperativeHandle(ref, () => ({
    show: (msg, toastType = 'info') => {
      setMessage(msg);
      setType(toastType);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(3000),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
  }));

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />;
      case 'error':
        return <Ionicons name="close-circle-outline" size={24} color="#F44336" />;
      case 'info':
      default:
        return <Ionicons name="information-circle-outline" size={24} color="#2196F3" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#E8F5E9';
      case 'error':
        return '#FFEBEE';
      case 'info':
      default:
        return '#E3F2FD';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return '#2E7D32';
      case 'error':
        return '#C62828';
      case 'info':
      default:
        return '#1976D2';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
      pointerEvents="none"
    >
      {getIcon()}
      <Text style={[styles.toastText, { color: getTextColor() }]}>{message}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50, // Adjust as needed for SafeAreaView
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
});

export default ToastNotification;
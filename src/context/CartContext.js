import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [saved, setSaved] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadCart();
    loadSaved();
  }, []);

  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) setCart(JSON.parse(cartData));
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const loadSaved = async () => {
    try {
      const savedData = await AsyncStorage.getItem('saved');
      if (savedData) setSaved(JSON.parse(savedData));
    } catch (error) {
      console.error('Error loading saved:', error);
    }
  };

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        newCart = [...prevCart, { ...item, quantity: 1 }];
      }
      saveData('cart', newCart);
      return newCart;
    });
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    saveData('cart', newCart);
  };

  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      const newCart = cart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      setCart(newCart);
      saveData('cart', newCart);
    }
  };

  const clearCart = () => {
    setCart([]);
    saveData('cart', []);
  };

  const toggleSaved = (item) => {
    let newSaved;
    if (saved.find(i => i.id === item.id)) {
      newSaved = saved.filter(i => i.id !== item.id);
    } else {
      newSaved = [...saved, item];
    }
    setSaved(newSaved);
    saveData('saved', newSaved);
  };

  return (
    <CartContext.Provider value={{
      cart,
      saved,
      addToCart,
      removeFromCart,
      updateItemQuantity,
      clearCart,
      toggleSaved,
      isAdmin,
      setIsAdmin
    }}>
      {children}
    </CartContext.Provider>
  );
};
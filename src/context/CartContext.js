import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [saved, setSaved] = useState([]);
  const { session } = useAuth();
  const user = session?.user;

  // Load data from DB when user changes
  useEffect(() => {
    // Clear local state first to prevent data from previous user showing up
    setCart([]);
    setSaved([]);
    
    if (user) {
      loadCartFromDB();
      loadSavedFromDB();
    }
  }, [user]);

  // Fetch cart items from the database
  const loadCartFromDB = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product_variants(*, products(*, product_images(*))), combos(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      setCart(data);
    } catch (error) {
      console.error('Error loading cart from DB:', error);
    }
  };

  // Fetch saved items from the database
  const loadSavedFromDB = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('saved_products')
        .select('products(*, categories(*), product_variants(*))')
        .eq('user_id', user.id);
      if (error) throw error;
      const savedItems = data.map(item => item.products);
      setSaved(savedItems);
    } catch (error) {
      console.error('Error loading saved items from DB:', error);
    }
  };

  // Add item to cart in DB
  const addToCart = async (item, type = 'product') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCombo = type === 'combo';
    const existingItem = cart.find(cartItem => {
      if (isCombo) {
        return cartItem.combo_id === item.id;
      }
      // Check for product variant, ensuring combo_id is null
      return cartItem.product_variant_id === item.variantId && cartItem.combo_id === null;
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      await updateItemQuantity(existingItem.id, newQuantity);
    } else {
      const newItem = {
        user_id: user.id,
        product_variant_id: isCombo ? null : item.variantId,
        combo_id: isCombo ? item.id : null,
        quantity: 1,
      };
      const { error } = await supabase.from('cart_items').insert(newItem);
      if (error) {
        console.error("Error adding to cart:", error);
      } else {
        await loadCartFromDB();
      }
    }
  };

  // Remove item from cart in DB
  const removeFromCart = async (cartDbId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('cart_items').delete().eq('id', cartDbId).eq('user_id', user.id);
    if (error) {
      console.error("Error removing from cart:", error);
    } else {
      setCart(prevCart => prevCart.filter(item => item.id !== cartDbId));
    }
  };

  // Update item quantity in DB
  const updateItemQuantity = async (cartDbId, quantity) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (quantity <= 0) {
      return removeFromCart(cartDbId);
    }
    const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', cartDbId).eq('user_id', user.id);
    if (error) {
      console.error("Error updating quantity:", error);
    } else {
      setCart(prevCart => prevCart.map(item => item.id === cartDbId ? { ...item, quantity } : item));
    }
  };

  // Clear cart in DB
  const clearCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (error) {
      console.error("Error clearing cart:", error);
    } else {
      setCart([]);
    }
  };

  // Toggle saved status in DB
  const toggleSaved = async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCurrentlySaved = saved.some(i => i.id === item.id);

    if (isCurrentlySaved) {
      const { error } = await supabase
        .from('saved_products')
        .delete()
        .match({ user_id: user.id, product_id: item.id });
      if (error) {
        console.error("Error removing from saved:", error);
      } else {
        setSaved(prevSaved => prevSaved.filter(i => i.id !== item.id));
      }
    } else {
      const { error } = await supabase
        .from('saved_products')
        .insert({ user_id: user.id, product_id: item.id });
      if (error) {
        console.error("Error adding to saved:", error);
      } else {
        // We add the full item object to the local state for immediate UI update
        setSaved(prevSaved => [...prevSaved, item]);
      }
    }
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
    }}>
      {children}
    </CartContext.Provider>
  );
};
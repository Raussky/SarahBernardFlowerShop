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
    const handleUserChange = async () => {
      if (user) {
        // If a user logs in, merge local data with their DB data
        if (cart.length > 0) await mergeLocalCartWithDB();
        if (saved.length > 0) await mergeLocalSavedWithDB();
      }
      
      // Always clear local state before loading from DB
      setCart([]);
      setSaved([]);
      
      if (user) {
        await loadCartFromDB();
        await loadSavedFromDB();
      }
    };
  
    handleUserChange();
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

  // Add item to cart (DB or local state)
  const addToCart = async (item, type = 'product') => {
    const { data: { user } } = await supabase.auth.getUser();
    const isCombo = type === 'combo';

    // Find if item already exists in cart
    const existingItem = cart.find(cartItem => {
      if (isCombo) {
        return cartItem.combo_id === item.id;
      }
      return cartItem.product_variant_id === item.variantId && !cartItem.combo_id;
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (user) {
        await updateItemQuantity(existingItem.id, newQuantity);
      } else {
        // Update local cart for guest
        setCart(cart.map(ci => ci.id === existingItem.id ? { ...ci, quantity: newQuantity } : ci));
      }
    } else {
      // Add new item
      const newItem = {
        // For guests, generate a temporary unique ID
        id: user ? undefined : Date.now(),
        user_id: user?.id,
        product_variant_id: isCombo ? null : item.variantId,
        combo_id: isCombo ? item.id : null,
        quantity: 1,
        // For guests, we need to store the full product details for display
        product_variants: isCombo ? null : { ...item, products: { name: item.name, name_ru: item.nameRu, image: item.image } },
        combos: isCombo ? { ...item } : null,
      };

      if (user) {
        // For logged-in users, only send the necessary fields to the DB
        const { error } = await supabase.from('cart_items').insert({
          user_id: newItem.user_id,
          product_variant_id: newItem.product_variant_id,
          combo_id: newItem.combo_id,
          quantity: newItem.quantity,
        });
        if (error) {
          console.error("Error adding to cart:", error);
        } else {
          await loadCartFromDB(); // Refresh cart from DB
        }
      } else {
        // For guests, add the detailed item to the local state
        setCart(prevCart => [...prevCart, newItem]);
      }
    }
  };

  // Remove item from cart in DB
  const removeFromCart = async (cartItemId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId).eq('user_id', user.id);
      if (error) {
        console.error("Error removing from cart:", error);
      } else {
        setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
      }
    } else {
      // For guests, just remove from local state
      setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
    }
  };

  // Update item quantity in DB
  const updateItemQuantity = async (cartItemId, quantity) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (quantity <= 0) {
      return removeFromCart(cartItemId);
    }
    if (user) {
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId).eq('user_id', user.id);
      if (error) {
        console.error("Error updating quantity:", error);
      } else {
        setCart(prevCart => prevCart.map(item => item.id === cartItemId ? { ...item, quantity } : item));
      }
    } else {
      // For guests, update local state
      setCart(prevCart => prevCart.map(item => item.id === cartItemId ? { ...item, quantity } : item));
    }
  };

  // Clear cart in DB
  const clearCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
      if (error) {
        console.error("Error clearing cart:", error);
      } else {
        setCart([]);
      }
    } else {
      // For guests, just clear the local state
      setCart([]);
    }
  };

  // Toggle saved status in DB
  const toggleSaved = async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    const isCurrentlySaved = saved.some(i => i.id === item.id);

    if (isCurrentlySaved) {
      if (user) {
        const { error } = await supabase
          .from('saved_products')
          .delete()
          .match({ user_id: user.id, product_id: item.id });
        if (error) console.error("Error removing from saved:", error);
        else setSaved(prevSaved => prevSaved.filter(i => i.id !== item.id));
      } else {
        // Guest: remove from local state
        setSaved(prevSaved => prevSaved.filter(i => i.id !== item.id));
      }
    } else {
      if (user) {
        const { error } = await supabase
          .from('saved_products')
          .insert({ user_id: user.id, product_id: item.id });
        if (error) console.error("Error adding to saved:", error);
        else setSaved(prevSaved => [...prevSaved, item]);
      } else {
        // Guest: add to local state
        setSaved(prevSaved => [...prevSaved, item]);
      }
    }
  };

  // Merge local guest cart with DB cart upon login
  const mergeLocalCartWithDB = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || cart.length === 0) return;

    const itemsToInsert = cart.map(item => ({
      user_id: user.id,
      product_variant_id: item.product_variant_id,
      combo_id: item.combo_id,
      quantity: item.quantity,
    }));

    const { error } = await supabase.from('cart_items').insert(itemsToInsert);
    if (error) {
      console.error('Error merging cart with DB:', error);
    }
    // Clear the local cart after attempting to merge
    setCart([]);
  };

  // Merge local guest saved items with DB upon login
  const mergeLocalSavedWithDB = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || saved.length === 0) return;

    const itemsToInsert = saved.map(item => ({
      user_id: user.id,
      product_id: item.id,
    }));

    // Use upsert to avoid duplicates on the off-chance an item was already saved
    const { error } = await supabase.from('saved_products').upsert(itemsToInsert, {
      onConflict: 'user_id, product_id',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error('Error merging saved items with DB:', error);
    }
    // Clear local saved items after attempting to merge
    setSaved([]);
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
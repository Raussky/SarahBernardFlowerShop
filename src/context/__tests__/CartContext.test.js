import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { CartProvider, CartContext } from '../CartContext';
import { supabase } from '../../integrations/supabase/client';

// Mock AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    session: null,
    user: null,
  }),
}));

describe('CartContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Guest User Flow', () => {
    it('should initialize with empty cart and saved items', () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      expect(result.current.cart).toEqual([]);
      expect(result.current.saved).toEqual([]);
    });

    it('should add item to cart for guest user', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testItem = {
        id: '1',
        name: 'Test Product',
        nameRu: 'Тестовый товар',
        image: 'test.jpg',
        size: 'Medium',
        price: 5000,
        variantId: 'v1',
        stock_quantity: 10,
      };

      await act(async () => {
        await result.current.addToCart(testItem, 'product');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(1);
    });

    it('should increment quantity when adding existing item', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testItem = {
        id: '1',
        variantId: 'v1',
        name: 'Test Product',
        nameRu: 'Тестовый товар',
        image: 'test.jpg',
        size: 'Medium',
        price: 5000,
        stock_quantity: 10,
      };

      await act(async () => {
        await result.current.addToCart(testItem, 'product');
        await result.current.addToCart(testItem, 'product');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(2);
    });

    it('should remove item from cart', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testItem = {
        id: '1',
        variantId: 'v1',
        name: 'Test Product',
        price: 5000,
        stock_quantity: 10,
      };

      await act(async () => {
        await result.current.addToCart(testItem, 'product');
      });

      const cartItemId = result.current.cart[0].id;

      await act(async () => {
        await result.current.removeFromCart(cartItemId);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('should update item quantity', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testItem = {
        id: '1',
        variantId: 'v1',
        name: 'Test Product',
        price: 5000,
        stock_quantity: 10,
      };

      await act(async () => {
        await result.current.addToCart(testItem, 'product');
      });

      const cartItemId = result.current.cart[0].id;

      await act(async () => {
        await result.current.updateItemQuantity(cartItemId, 5);
      });

      expect(result.current.cart[0].quantity).toBe(5);
    });

    it('should remove item when quantity set to 0', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testItem = {
        id: '1',
        variantId: 'v1',
        name: 'Test Product',
        price: 5000,
        stock_quantity: 10,
      };

      await act(async () => {
        await result.current.addToCart(testItem, 'product');
      });

      const cartItemId = result.current.cart[0].id;

      await act(async () => {
        await result.current.updateItemQuantity(cartItemId, 0);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('should clear cart', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testItem = {
        id: '1',
        variantId: 'v1',
        name: 'Test Product',
        price: 5000,
        stock_quantity: 10,
      };

      await act(async () => {
        await result.current.addToCart(testItem, 'product');
        await result.current.addToCart({ ...testItem, id: '2', variantId: 'v2' }, 'product');
      });

      expect(result.current.cart).toHaveLength(2);

      await act(async () => {
        await result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('should toggle saved items', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testProduct = {
        id: '1',
        name: 'Test Product',
        image: 'test.jpg',
      };

      await act(async () => {
        await result.current.toggleSaved(testProduct);
      });

      expect(result.current.saved).toHaveLength(1);
      expect(result.current.saved[0].id).toBe('1');

      await act(async () => {
        await result.current.toggleSaved(testProduct);
      });

      expect(result.current.saved).toHaveLength(0);
    });
  });

  describe('Combo Items', () => {
    it('should add combo to cart', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testCombo = {
        id: 'combo1',
        name: 'Test Combo',
        price: 10000,
      };

      await act(async () => {
        await result.current.addToCart(testCombo, 'combo');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].combo_id).toBe('combo1');
    });

    it('should not mix product and combo items with same ID', async () => {
      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testProduct = {
        id: '1',
        variantId: 'v1',
        name: 'Test Product',
        price: 5000,
        stock_quantity: 10,
      };

      const testCombo = {
        id: '1', // Same ID but different type
        name: 'Test Combo',
        price: 10000,
      };

      await act(async () => {
        await result.current.addToCart(testProduct, 'product');
        await result.current.addToCart(testCombo, 'combo');
      });

      expect(result.current.cart).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle cart operations when Supabase fails', async () => {
      // Mock Supabase error
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ error: { message: 'Network error' } }),
        eq: jest.fn().mockReturnThis(),
      }));

      const { result } = renderHook(() => React.useContext(CartContext), {
        wrapper: CartProvider,
      });

      const testItem = {
        id: '1',
        variantId: 'v1',
        name: 'Test Product',
        price: 5000,
        stock_quantity: 10,
      };

      // Should still work locally for guest users
      await act(async () => {
        await result.current.addToCart(testItem, 'product');
      });

      expect(result.current.cart).toHaveLength(1);
    });
  });
});

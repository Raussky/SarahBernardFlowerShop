import {
  getProductDetails,
  getRecommendedProducts,
  deleteProduct,
  bulkArchiveProducts,
  searchProducts,
  filterProducts
} from '../productService';
import { supabase } from '../../integrations/supabase/client';

// Mock supabase
jest.mock('../../integrations/supabase/client');

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock retry utility
jest.mock('../../utils/retry', () => ({
  retry: jest.fn((fn) => fn()),
  RETRY_PRESETS: {
    quick: { maxAttempts: 2, delayMs: 100 },
    standard: { maxAttempts: 3, delayMs: 1000 },
  },
}));

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductDetails', () => {
    test('should fetch product details successfully', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Розы',
        description: 'Красные розы',
        product_variants: [
          { id: 'var-1', size: '5 шт', price: 5000, stock_quantity: 10 },
        ],
        product_images: [
          { id: 'img-1', image_url: 'https://example.com/rose.jpg' },
        ],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockProduct,
        error: null,
      });

      supabase.from = jest.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      }));

      const result = await getProductDetails('product-1');

      expect(result.data).toEqual(mockProduct);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockSelect).toHaveBeenCalledWith('*, product_variants(id, product_id, size, price, stock_quantity), product_images(*)');
      expect(mockEq).toHaveBeenCalledWith('id', 'product-1');
    });

    test('should handle product not found (PGRST116) gracefully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      supabase.from = jest.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      }));

      const result = await getProductDetails('product-999');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull(); // PGRST116 should not be returned as error
    });

    test('should handle actual errors', async () => {
      const mockError = { code: 'NETWORK', message: 'Network failed' };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      supabase.from = jest.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      }));

      const result = await getProductDetails('product-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getRecommendedProducts', () => {
    test('should fetch recommended products excluding current product', async () => {
      const mockProducts = [
        { id: 'product-2', name: 'Лилии', product_variants: [] },
        { id: 'product-3', name: 'Тюльпаны', product_variants: [] },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockNeq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      supabase.from = jest.fn(() => ({
        select: mockSelect,
        neq: mockNeq,
        order: mockOrder,
        limit: mockLimit,
      }));

      const result = await getRecommendedProducts('product-1');

      expect(result.data).toEqual(mockProducts);
      expect(result.error).toBeNull();
      expect(mockNeq).toHaveBeenCalledWith('id', 'product-1');
      expect(mockOrder).toHaveBeenCalledWith('purchase_count', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    test('should handle errors in fetching recommended products', async () => {
      const mockError = { message: 'Database error' };

      const mockSelect = jest.fn().mockReturnThis();
      const mockNeq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      supabase.from = jest.fn(() => ({
        select: mockSelect,
        neq: mockNeq,
        order: mockOrder,
        limit: mockLimit,
      }));

      const result = await getRecommendedProducts('product-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('deleteProduct', () => {
    test('should delete product safely using RPC', async () => {
      const mockResponse = 'Product deleted successfully';

      supabase.rpc = jest.fn().mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await deleteProduct('product-1');

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('delete_product_safely', {
        p_product_id: 'product-1',
      });
    });

    test('should handle deletion errors', async () => {
      const mockError = { message: 'Product is in orders' };

      supabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await deleteProduct('product-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('bulkArchiveProducts', () => {
    test('should archive multiple products', async () => {
      supabase.rpc = jest.fn().mockResolvedValue({
        error: null,
      });

      const result = await bulkArchiveProducts(['prod-1', 'prod-2'], true);

      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('bulk_archive_products', {
        product_ids: ['prod-1', 'prod-2'],
        archive_status: true,
      });
    });

    test('should unarchive multiple products', async () => {
      supabase.rpc = jest.fn().mockResolvedValue({
        error: null,
      });

      const result = await bulkArchiveProducts(['prod-1', 'prod-2'], false);

      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('bulk_archive_products', {
        product_ids: ['prod-1', 'prod-2'],
        archive_status: false,
      });
    });

    test('should handle bulk archive errors', async () => {
      const mockError = { message: 'Bulk operation failed' };

      supabase.rpc = jest.fn().mockResolvedValue({
        error: mockError,
      });

      const result = await bulkArchiveProducts(['prod-1'], true);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('searchProducts', () => {
    test('should search products by term', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Розы', description: 'Красные розы' },
        { id: 'prod-2', name: 'Букет роз', description: 'Микс' },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      supabase.from = jest.fn(() => ({
        select: mockSelect,
        or: mockOr,
      }));

      const result = await searchProducts('розы');

      expect(result.data).toEqual(mockProducts);
      expect(result.error).toBeNull();
      expect(mockOr).toHaveBeenCalledWith('name.ilike.%розы%,description.ilike.%розы%');
    });

    test('should handle search errors', async () => {
      const mockError = { message: 'Search failed' };

      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      supabase.from = jest.fn(() => ({
        select: mockSelect,
        or: mockOr,
      }));

      const result = await searchProducts('test');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('filterProducts', () => {
    test('should filter products using RPC', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Розы', price: 5000 },
        { id: 'prod-2', name: 'Лилии', price: 6000 },
      ];

      supabase.rpc = jest.fn().mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      const filters = {
        categories: ['cat-1', 'cat-2'],
        priceRange: [4000, 7000],
        sortBy: 'price',
        sortDirection: 'asc',
      };

      const result = await filterProducts(filters);

      expect(result.data).toEqual(mockProducts);
      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('filter_products', {
        p_category_ids: ['cat-1', 'cat-2'],
        p_min_price: 4000,
        p_max_price: 7000,
        p_sort_column: 'price',
        p_sort_direction: 'asc',
      });
    });

    test('should handle filter errors', async () => {
      const mockError = { message: 'Filter failed' };

      supabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const filters = {
        categories: [],
        priceRange: [0, 10000],
        sortBy: 'name',
        sortDirection: 'desc',
      };

      const result = await filterProducts(filters);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });
});

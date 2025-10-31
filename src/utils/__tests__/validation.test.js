import {
  validateEmail,
  validatePhoneNumber,
  validateName,
  validateAddress,
  validatePrice,
  validateQuantity,
  validateOrderData,
  validateProductData,
  sanitizeString,
  sanitizeObject,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    test('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should invalidate incorrect email', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Некорректный email адрес');
    });

    test('should invalidate empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email обязателен');
    });
  });

  describe('validatePhoneNumber', () => {
    test('should validate correct phone number', () => {
      const result = validatePhoneNumber('77001234567');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.cleaned).toBe('77001234567');
    });

    test('should validate formatted phone number', () => {
      const result = validatePhoneNumber('+7 (700) 123-45-67');
      expect(result.isValid).toBe(true);
      expect(result.cleaned).toBe('77001234567');
    });

    test('should invalidate short phone number', () => {
      const result = validatePhoneNumber('7700123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Некорректный номер телефона');
    });

    test('should invalidate phone not starting with 7', () => {
      const result = validatePhoneNumber('87001234567');
      expect(result.isValid).toBe(false);
    });

    test('should invalidate empty phone', () => {
      const result = validatePhoneNumber('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Номер телефона обязателен');
    });
  });

  describe('validateName', () => {
    test('should validate correct name', () => {
      const result = validateName('Иван');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.sanitized).toBe('Иван');
    });

    test('should trim whitespace from name', () => {
      const result = validateName('  Мария  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Мария');
    });

    test('should invalidate short name', () => {
      const result = validateName('А');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя должно содержать минимум 2 символа');
    });

    test('should invalidate name with special characters', () => {
      const result = validateName('Test<script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя содержит недопустимые символы');
    });

    test('should invalidate empty name', () => {
      const result = validateName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя обязательно');
    });

    test('should use custom field name in error message', () => {
      const result = validateName('', 'Фамилия');
      expect(result.error).toBe('Фамилия обязательно');
    });
  });

  describe('validateAddress', () => {
    test('should validate correct address', () => {
      const result = validateAddress('ул. Пушкина, д. 10');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should trim whitespace from address', () => {
      const result = validateAddress('  ул. Ленина, 5  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('ул. Ленина, 5');
    });

    test('should invalidate short address', () => {
      const result = validateAddress('ул');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Адрес должен содержать минимум 5 символов');
    });

    test('should invalidate empty address', () => {
      const result = validateAddress('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Адрес обязателен');
    });
  });

  describe('validatePrice', () => {
    test('should validate correct price', () => {
      const result = validatePrice(5000);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should parse string price', () => {
      const result = validatePrice('5000');
      expect(result.isValid).toBe(true);
      expect(result.parsed).toBe(5000);
    });

    test('should invalidate negative price', () => {
      const result = validatePrice(-100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Цена должна быть положительным числом');
    });

    test('should invalidate zero price', () => {
      const result = validatePrice(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Цена должна быть положительным числом');
    });

    test('should invalidate invalid price', () => {
      const result = validatePrice('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Некорректная цена');
    });
  });

  describe('validateQuantity', () => {
    test('should validate correct quantity', () => {
      const result = validateQuantity(5);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should parse string quantity', () => {
      const result = validateQuantity('10');
      expect(result.isValid).toBe(true);
      expect(result.parsed).toBe(10);
    });

    test('should invalidate negative quantity', () => {
      const result = validateQuantity(-5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Количество должно быть положительным числом');
    });

    test('should invalidate zero quantity', () => {
      const result = validateQuantity(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Количество должно быть положительным числом');
    });

    test('should invalidate quantity exceeding max', () => {
      const result = validateQuantity(150);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Максимальное количество: 99');
    });
  });

  describe('validateOrderData', () => {
    test('should validate correct order data', () => {
      const orderData = {
        customer_name: 'Иван Иванов',
        customer_phone: '77001234567',
        customer_address: 'ул. Пушкина, д. 10',
        delivery_method: 'delivery',
        delivery_time: '2024-01-15 14:00',
        items: [
          { id: '1', quantity: 2, price: 5000 },
        ],
      };

      const result = validateOrderData(orderData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.sanitized.customer_name).toBe('Иван Иванов');
    });

    test('should detect missing required fields', () => {
      const orderData = {
        customer_name: '',
        customer_phone: '',
        items: [],
      };

      const result = validateOrderData(orderData);
      expect(result.isValid).toBe(false);
      expect(result.errors.customer_name).toBeDefined();
      expect(result.errors.customer_phone).toBeDefined();
      expect(result.errors.items).toBeDefined();
    });

    test('should validate phone format', () => {
      const orderData = {
        customer_name: 'Test User',
        customer_phone: '123',
        customer_address: 'Address',
        items: [{ id: '1' }],
      };

      const result = validateOrderData(orderData);
      expect(result.isValid).toBe(false);
      expect(result.errors.customer_phone).toBeDefined();
    });

    test('should sanitize XSS attempts', () => {
      const orderData = {
        customer_name: 'Test<script>alert("xss")</script>',
        customer_phone: '77001234567',
        customer_address: 'Address<script>',
        items: [{ id: '1' }],
      };

      const result = validateOrderData(orderData);
      expect(result.sanitized.customer_name).not.toContain('<script>');
      expect(result.sanitized.customer_address).not.toContain('<script>');
    });
  });

  describe('validateProductData', () => {
    test('should validate correct product data', () => {
      const productData = {
        name: 'Розы',
        description: 'Красные розы',
        category_id: 'cat-1',
        variants: [
          { size: '5 шт', price: 5000, stock_quantity: 10 },
        ],
      };

      const result = validateProductData(productData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should detect missing required fields', () => {
      const productData = {
        name: '',
        variants: [],
      };

      const result = validateProductData(productData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.variants).toBeDefined();
    });

    test('should validate variant prices', () => {
      const productData = {
        name: 'Product',
        description: 'Test',
        variants: [
          { size: 'test', price: -100, stock_quantity: 5 },
        ],
      };

      const result = validateProductData(productData);
      expect(result.isValid).toBe(false);
      expect(result.errors['variant_0_price']).toBeDefined();
    });

    test('should validate variant stock', () => {
      const productData = {
        name: 'Product',
        description: 'Test',
        variants: [
          { size: 'test', price: 5000, stock_quantity: -5 },
        ],
      };

      const result = validateProductData(productData);
      expect(result.isValid).toBe(false);
      expect(result.errors['variant_0_stock']).toBeDefined();
    });
  });

  describe('sanitizeString', () => {
    test('should remove HTML tags', () => {
      const result = sanitizeString('Hello<script>alert("xss")</script>World');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    test('should remove javascript: protocol', () => {
      const result = sanitizeString('javascript:alert("xss")');
      expect(result).not.toContain('javascript:');
    });

    test('should remove event handlers', () => {
      const result = sanitizeString('onclick=alert("xss")');
      expect(result).not.toContain('onclick=');
    });

    test('should trim whitespace', () => {
      const result = sanitizeString('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    test('should handle non-string input', () => {
      const result = sanitizeString(123);
      expect(result).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize all string values in object', () => {
      const obj = {
        name: 'Test<script>',
        description: 'Hello World',
        count: 5,
        nested: {
          text: 'Nested<script>',
        },
      };

      const result = sanitizeObject(obj);
      expect(result.name).not.toContain('<script>');
      expect(result.description).toBe('Hello World');
      expect(result.count).toBe(5);
      expect(result.nested.text).not.toContain('<script>');
    });

    test('should handle arrays in object', () => {
      const obj = {
        items: ['Test<script>', 'Safe String'],
      };

      const result = sanitizeObject(obj);
      expect(result.items[0]).not.toContain('<script>');
      expect(result.items[1]).toBe('Safe String');
    });

    test('should handle null and undefined', () => {
      const obj = {
        name: null,
        description: undefined,
      };

      const result = sanitizeObject(obj);
      expect(result.name).toBeNull();
      expect(result.description).toBeUndefined();
    });
  });
});

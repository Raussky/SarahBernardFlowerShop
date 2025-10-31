/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email) {
  const sanitized = sanitizeString(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return {
    isValid: emailRegex.test(sanitized),
    sanitized,
    error: emailRegex.test(sanitized) ? null : 'Некорректный email адрес',
  };
}

/**
 * Validate phone number (Kazakhstan format)
 */
export function validatePhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');

  // Kazakhstan phone numbers: +7 (7XX) XXX-XX-XX
  const isValid = cleaned.length === 11 && cleaned.startsWith('7');

  return {
    isValid,
    cleaned,
    formatted: isValid ? formatPhoneNumber(cleaned) : phone,
    error: isValid ? null : 'Некорректный номер телефона',
  };
}

/**
 * Format phone number to Kazakhstan format
 */
export function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }

  return phone;
}

/**
 * Validate name (alphanumeric with spaces, no special chars)
 */
export function validateName(name) {
  const sanitized = sanitizeString(name);

  // Allow Cyrillic, Latin letters, spaces, hyphens
  const nameRegex = /^[а-яА-ЯёЁa-zA-Z\s-]+$/;
  const isValid = nameRegex.test(sanitized) && sanitized.length >= 2 && sanitized.length <= 50;

  return {
    isValid,
    sanitized,
    error: !isValid
      ? 'Имя должно содержать только буквы (2-50 символов)'
      : null,
  };
}

/**
 * Validate address
 */
export function validateAddress(address) {
  const sanitized = sanitizeString(address);
  const isValid = sanitized.length >= 5 && sanitized.length <= 200;

  return {
    isValid,
    sanitized,
    error: !isValid
      ? 'Адрес должен быть от 5 до 200 символов'
      : null,
  };
}

/**
 * Validate price (positive number)
 */
export function validatePrice(price) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  const isValid = !isNaN(numPrice) && numPrice > 0 && numPrice < 1000000;

  return {
    isValid,
    value: numPrice,
    error: !isValid
      ? 'Некорректная цена'
      : null,
  };
}

/**
 * Validate quantity (positive integer)
 */
export function validateQuantity(quantity) {
  const numQty = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

  const isValid = Number.isInteger(numQty) && numQty > 0 && numQty <= 999;

  return {
    isValid,
    value: numQty,
    error: !isValid
      ? 'Количество должно быть от 1 до 999'
      : null,
  };
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate order data before submission
 */
export function validateOrderData(orderData) {
  const errors = {};

  // Validate customer name
  const nameValidation = validateName(orderData.customer_name);
  if (!nameValidation.isValid) {
    errors.customer_name = nameValidation.error;
  }

  // Validate phone
  const phoneValidation = validatePhoneNumber(orderData.customer_phone);
  if (!phoneValidation.isValid) {
    errors.customer_phone = phoneValidation.error;
  }

  // Validate address if delivery
  if (orderData.delivery_method === 'delivery') {
    const addressValidation = validateAddress(orderData.customer_address);
    if (!addressValidation.isValid) {
      errors.customer_address = addressValidation.error;
    }

    if (!orderData.delivery_time || orderData.delivery_time.trim() === '') {
      errors.delivery_time = 'Выберите время доставки';
    }
  }

  // Validate cart items
  if (!orderData.items || orderData.items.length === 0) {
    errors.items = 'Корзина пуста';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: sanitizeObject(orderData),
  };
}

/**
 * Validate product data
 */
export function validateProductData(productData) {
  const errors = {};

  // Validate name
  if (!productData.name || productData.name.trim().length < 2) {
    errors.name = 'Название должно быть минимум 2 символа';
  }

  // Validate price
  const priceValidation = validatePrice(productData.price);
  if (!priceValidation.isValid) {
    errors.price = priceValidation.error;
  }

  // Validate stock
  const stockValidation = validateQuantity(productData.stock_quantity || 0);
  if (!stockValidation.isValid) {
    errors.stock_quantity = stockValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: sanitizeObject(productData),
  };
}

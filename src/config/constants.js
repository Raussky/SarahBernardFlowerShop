// Contact Information
export const WHATSAPP_PHONE = '+77089217812';

// Pricing
export const DELIVERY_COST = 500;
export const CURRENCY_SYMBOL = '₸';
export const MIN_ORDER_AMOUNT = 0;
export const MAX_ORDER_AMOUNT = 1000000;

// Location
export const DEFAULT_CITY = 'Актау';

// Validation
export const PHONE_NUMBER_MIN_LENGTH = 11;
export const PHONE_MASK = '+7 (999) 999-99-99';
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 50;
export const MIN_ADDRESS_LENGTH = 5;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_PRODUCT_QUANTITY = 999;

// UI Constants
// These are now adaptive - see device.js for dynamic values
// export const TAB_BAR_HEIGHT = 80;  // Removed - use adaptive value
// export const TAB_BAR_BORDER_RADIUS = 35;  // Removed - use adaptive value
export const PRODUCT_CARD_ANIMATION_DURATION = 700;
export const TOAST_DURATION = 3000;
export const SPLASH_SCREEN_MIN_DURATION = 1000;

// API Constants
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const IMAGE_UPLOAD_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Search
export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 500;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Payment Methods
export const PAYMENT_METHODS = {
  KASPI: 'kaspi',
  CASH: 'cash',
  CARD: 'card',
};

// Delivery Methods
export const DELIVERY_METHODS = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
};

// Cache Durations (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 15 * 60 * 1000,    // 15 minutes
  LONG: 60 * 60 * 1000,      // 1 hour
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Проблема с подключением к интернету',
  GENERIC_ERROR: 'Произошла ошибка. Попробуйте еще раз',
  AUTH_REQUIRED: 'Требуется авторизация',
  INSUFFICIENT_STOCK: 'Недостаточно товара на складе',
  INVALID_INPUT: 'Некорректные данные',
  ORDER_FAILED: 'Не удалось создать заказ',
  PRODUCT_NOT_FOUND: 'Товар не найден',
  EMPTY_CART: 'Ваша корзина пуста',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ADDED_TO_CART: 'Товар добавлен в корзину',
  REMOVED_FROM_CART: 'Товар удален из корзины',
  ADDED_TO_SAVED: 'Добавлено в избранное',
  REMOVED_FROM_SAVED: 'Удалено из избранного',
  ORDER_PLACED: 'Заказ успешно оформлен',
  PROFILE_UPDATED: 'Профиль обновлен',
  ADDRESS_SAVED: 'Адрес сохранен',
};
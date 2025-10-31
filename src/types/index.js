/**
 * Type definitions for the application
 *
 * Note: These are JSDoc type definitions until TypeScript migration is complete
 * To use: Add @typedef and @type comments in your files
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} name_ru
 * @property {string} description
 * @property {string} image
 * @property {string} category_id
 * @property {boolean} is_archived
 * @property {number} purchase_count
 * @property {string} created_at
 * @property {ProductVariant[]} product_variants
 * @property {ProductImage[]} product_images
 * @property {Category} categories
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {string} product_id
 * @property {string} size
 * @property {number} price
 * @property {number} stock_quantity
 * @property {Product} products
 */

/**
 * @typedef {Object} ProductImage
 * @property {string} id
 * @property {string} product_id
 * @property {string} image_url
 * @property {number} display_order
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} name_en
 * @property {string} image
 * @property {number} display_order
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id
 * @property {string} user_id
 * @property {string} product_variant_id
 * @property {string} combo_id
 * @property {number} quantity
 * @property {string} created_at
 * @property {ProductVariant} product_variants
 * @property {Combo} combos
 */

/**
 * @typedef {Object} SavedProduct
 * @property {string} id
 * @property {string} user_id
 * @property {string} product_id
 * @property {string} created_at
 * @property {Product} products
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} user_id
 * @property {string} customer_name
 * @property {string} customer_phone
 * @property {string} customer_address
 * @property {string} delivery_method
 * @property {string} payment_method
 * @property {string} order_comment
 * @property {string} delivery_time
 * @property {number} subtotal
 * @property {number} delivery_cost
 * @property {number} total_price
 * @property {string} status
 * @property {string} created_at
 * @property {string} updated_at
 * @property {OrderItem[]} order_items
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} order_id
 * @property {string} product_variant_id
 * @property {string} combo_id
 * @property {number} quantity
 * @property {number} price_at_time
 * @property {ProductVariant} product_variants
 * @property {Combo} combos
 */

/**
 * @typedef {Object} Combo
 * @property {string} id
 * @property {string} name
 * @property {string} name_ru
 * @property {string} description
 * @property {string} image
 * @property {number} price
 * @property {number} discount_percentage
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {ComboItem[]} combo_items
 */

/**
 * @typedef {Object} ComboItem
 * @property {string} id
 * @property {string} combo_id
 * @property {string} product_id
 * @property {number} quantity
 * @property {Product} products
 */

/**
 * @typedef {Object} Address
 * @property {string} id
 * @property {string} user_id
 * @property {string} address_line1
 * @property {string} address_line2
 * @property {string} city
 * @property {string} postal_code
 * @property {boolean} is_default
 * @property {string} created_at
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} email
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} phone_number
 * @property {string} avatar_url
 * @property {string} role
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Banner
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} image_url
 * @property {string} target_type
 * @property {string} target_id
 * @property {boolean} is_active
 * @property {number} display_order
 */

/**
 * @typedef {'pending'|'confirmed'|'preparing'|'ready'|'delivering'|'delivered'|'cancelled'} OrderStatus
 */

/**
 * @typedef {'kaspi'|'cash'|'card'} PaymentMethod
 */

/**
 * @typedef {'delivery'|'pickup'} DeliveryMethod
 */

/**
 * @typedef {Object} ApiResponse
 * @property {any} data
 * @property {Error|null} error
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string|null} error
 * @property {any} sanitized
 */

/**
 * @typedef {Object} RetryConfig
 * @property {number} maxAttempts
 * @property {number} delayMs
 * @property {boolean} exponentialBackoff
 * @property {number} backoffMultiplier
 * @property {number} maxDelayMs
 * @property {Function} onRetry
 * @property {string[]} retryableErrors
 */

/**
 * @typedef {Object} FilterOptions
 * @property {string[]} categories
 * @property {number[]} priceRange
 * @property {string} sortBy
 * @property {string} sortDirection
 */

/**
 * @typedef {Object} ToastOptions
 * @property {string} message
 * @property {'success'|'error'|'info'|'warning'} type
 * @property {number} duration
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {Object} session
 * @property {Object} user
 * @property {Profile} profile
 * @property {boolean} loading
 * @property {Function} signOut
 * @property {Function} refreshProfile
 * @property {Function} showAuthError
 */

/**
 * @typedef {Object} CartContextValue
 * @property {CartItem[]} cart
 * @property {Product[]} saved
 * @property {Function} addToCart
 * @property {Function} removeFromCart
 * @property {Function} updateItemQuantity
 * @property {Function} clearCart
 * @property {Function} toggleSaved
 */

/**
 * @typedef {Object} AnimationContextValue
 * @property {Function} startAddToCartAnimation
 */

// Export for JSDoc usage
export {};

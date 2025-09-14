import { supabase } from '../integrations/supabase/client';

/**
 * Fetches all data required for the Home Screen.
 * This includes categories, banners, best sellers, and various product showcases.
 */
// Fetches only the essential data for the initial screen load
export const getHomeScreenInitialData = async () => {
  const { data: categories, error: categoriesError } = await supabase.from('categories').select('*').order('position', { ascending: true });
  const { data: banners, error: bannersError } = await supabase.from('banners').select('*').eq('is_active', true).order('created_at', { ascending: false });
  
  if (categoriesError || bannersError) {
    console.error("Error fetching initial data:", categoriesError || bannersError);
    return null;
  }
  return { categories, banners };
};

// Fetches all other sections for the home screen
export const getHomeScreenSecondaryData = async () => {
  try {
    const [
      bestSellersRes,
      readyShowcaseRes,
      combosRes,
      weeklyPicksRes,
      premiumBouquetsRes
    ] = await Promise.all([
      supabase.rpc('get_best_sellers', { limit_count: 6 }),
      supabase.rpc('get_products_by_category_name', { category_name_param: 'Готовая ветрина', limit_count: 6 }),
      supabase.from('combos').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(6),
      supabase.rpc('get_products_by_category_name', { category_name_param: 'Недельная подборка', limit_count: 6 }),
      supabase.rpc('get_products_by_category_name', { category_name_param: 'Премиум букеты', limit_count: 6 }),
    ]);

    return {
      bestSellers: bestSellersRes.data || [],
      readyShowcase: readyShowcaseRes.data || [],
      combos: combosRes.data || [],
      weeklyPicks: weeklyPicksRes.data || [],
      premiumBouquets: premiumBouquetsRes.data || [],
    };
  } catch (error) {
    console.error("Error fetching secondary home screen data:", error);
    return null;
  }
};

/**
 * Fetches a single product with its variants and images.
 * @param {string} productId - The ID of the product to fetch.
 */
export const getProductDetails = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(id, product_id, size, price, stock_quantity), product_images(*)')
    .eq('id', productId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching product details:", error);
    return { data: null, error };
  }
  
  return { data, error: null };
};

/**
 * Fetches recommended products, excluding the currently viewed product.
 * @param {string} currentProductId - The ID of the product to exclude.
 */
export const getRecommendedProducts = async (currentProductId) => {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(id, product_id, size, price, stock_quantity)')
        .neq('id', currentProductId)
        .order('purchase_count', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching recommended products:", error);
    }
    
    return { data, error };
};

/**
 * Fetches all combos for the admin screen.
 */
export const getCombos = async () => {
    const { data, error } = await supabase
        .from('combos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching combos:", error);
    }
    
    return { data, error };
};

/**
 * Deletes a combo and its associated items.
 * @param {string} comboId - The ID of the combo to delete.
 */
export const deleteCombo = async (comboId) => {
    // First, delete associated items in combo_items
    const { error: itemsError } = await supabase
        .from('combo_items')
        .delete()
        .eq('combo_id', comboId);

    if (itemsError) {
        console.error("Error deleting combo items:", itemsError);
        return { error: itemsError };
    }

    // Then, delete the combo itself
    const { error: comboError } = await supabase
        .from('combos')
        .delete()
        .eq('id', comboId);
    
    if (comboError) {
        console.error("Error deleting combo:", comboError);
    }

    return { error: comboError };
};

/**
 * Safely deletes a product by calling an RPC function.
 * The function checks if the product is in any orders before deleting.
 * @param {string} productId - The ID of the product to delete.
 */
export const deleteProduct = async (productId) => {
    const { data, error } = await supabase.rpc('delete_product_safely', {
        p_product_id: productId,
    });

    if (error) {
        console.error("Error deleting product:", error);
        return { data: null, error };
    }

    // The RPC function returns a text message
    return { data, error: null };
};

/**
 * Archives or un-archives multiple products at once.
 * @param {string[]} productIds - An array of product IDs.
 * @param {boolean} archiveStatus - true to archive, false to un-archive.
 */
export const bulkArchiveProducts = async (productIds, archiveStatus) => {
    const { error } = await supabase.rpc('bulk_archive_products', {
        product_ids: productIds,
        archive_status: archiveStatus,
    });

    if (error) {
        console.error("Error in bulk archive:", error);
    }

    return { error };
};

/**
 * Fetches all categories.
 */
export const getCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('created_at');
    if (error) console.error("Error fetching categories:", error);
    return { data, error };
};

/**
 * Fetches a single category by its ID.
 * @param {string} categoryId - The ID of the category.
 */
export const getCategoryById = async (categoryId) => {
    const { data, error } = await supabase.from('categories').select('*').eq('id', categoryId).single();
    if (error) console.error("Error fetching category:", error);
    return { data, error };
};

/**
 * Creates or updates a category.
 * @param {object} categoryData - The category data to save.
 */
export const upsertCategory = async (categoryData) => {
    const { error } = await supabase.from('categories').upsert(categoryData);
    if (error) console.error("Error upserting category:", error);
    return { error };
};

/**
 * Deletes a category by its ID.
 * @param {string} categoryId - The ID of the category to delete.
 */
export const deleteCategory = async (categoryId) => {
    // Note: You might want to add a check here to see if any products use this category first.
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) console.error("Error deleting category:", error);
    return { error };
};

/**
 * Updates the positions of multiple categories.
 * @param {Array<{id_val: string, position_val: number}>} positions - Array of position objects.
 */
export const updateCategoryPositions = async (positions) => {
    const { error } = await supabase.rpc('update_category_positions', { positions });
    if (error) console.error("Error updating category positions:", error);
    return { error };
};

/**
 * Performs an advanced search for products.
 * @param {string} searchTerm - The term to search for.
 */
export const searchProducts = async (searchTerm) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, name_en), product_variants(*)')
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`); // Search in name and description

        if (error) {
            console.error("Error searching products:", error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (error) {
        console.error("Unexpected error during product search:", error);
        return { data: null, error };
    }
};

/**
 * Sets a specific address as the default for a user.
 * This involves unsetting the old default and setting the new one.
 * @param {string} addressId - The ID of the address to set as default.
 * @param {string} userId - The ID of the user.
 */
export const setDefaultAddress = async (addressId, userId) => {
    // This should be a transaction, so we create an RPC function for it.
    // For now, we'll do it in two steps from the client.
    // 1. Unset any existing default address for the user
    const { error: unsetError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);

    if (unsetError) {
        console.error("Error unsetting old default address:", unsetError);
        return { error: unsetError };
    }

    // 2. Set the new address as default
    const { error: setError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

    if (setError) {
        console.error("Error setting new default address:", setError);
    }

    return { error: setError };
};

/**
 * Cancels a user's order if it's still pending.
 * @param {string} orderId - The ID of the order to cancel.
 * @param {string} userId - The ID of the user.
 */
export const cancelOrder = async (orderId, userId) => {
    const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_user_id: userId,
    });
    if (error) console.error("Error cancelling order:", error);
    return { data, error };
};

/**
 * Fetches all items for a given order.
 * @param {string} orderId - The ID of the order.
 */
export const getOrderItems = async (orderId) => {
    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
    if (error) console.error("Error fetching order items:", error);
    return { data, error };
};

/**
 * Applies filters and returns a list of products.
 * @param {object} filters - The filter criteria.
 * @param {string[]} filters.categories - Array of category IDs.
 * @param {number[]} filters.priceRange - [minPrice, maxPrice].
 * @param {string} filters.sortBy - Column to sort by.
 * @param {string} filters.sortDirection - 'asc' or 'desc'.
 */
export const filterProducts = async (filters) => {
    const { data, error } = await supabase.rpc('filter_products', {
      p_category_ids: filters.categories,
      p_min_price: filters.priceRange[0],
      p_max_price: filters.priceRange[1],
      p_sort_column: filters.sortBy,
      p_sort_direction: filters.sortDirection,
    });

    if (error) {
        console.error("Error filtering products:", error);
    }

    return { data, error };
};
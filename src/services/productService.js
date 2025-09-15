import { supabase } from '../integrations/supabase/client';

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
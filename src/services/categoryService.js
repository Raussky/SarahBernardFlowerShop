import { supabase } from '../integrations/supabase/client';

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
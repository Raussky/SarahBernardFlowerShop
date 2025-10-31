import { supabase } from '../integrations/supabase/client';
import { logger } from '../utils/logger';

/**
 * Fetches all categories.
 */
export const getCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('created_at');
    if (error) logger.error('Error fetching categories', error, { context: 'categoryService' });
    return { data, error };
};

/**
 * Fetches a single category by its ID.
 * @param {string} categoryId - The ID of the category.
 */
export const getCategoryById = async (categoryId) => {
    const { data, error } = await supabase.from('categories').select('*').eq('id', categoryId).single();
    if (error) logger.error('Error fetching category', error, { context: 'categoryService', categoryId });
    return { data, error };
};

/**
 * Creates or updates a category.
 * @param {object} categoryData - The category data to save.
 */
export const upsertCategory = async (categoryData) => {
    const { error } = await supabase.from('categories').upsert(categoryData);
    if (error) logger.error('Error upserting category', error, { context: 'categoryService', categoryData });
    return { error };
};

/**
 * Deletes a category by its ID.
 * @param {string} categoryId - The ID of the category to delete.
 */
export const deleteCategory = async (categoryId) => {
    // Note: You might want to add a check here to see if any products use this category first.
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) logger.error('Error deleting category', error, { context: 'categoryService', categoryId });
    return { error };
};

/**
 * Updates the positions of multiple categories.
 * @param {Array<{id_val: string, position_val: number}>} positions - Array of position objects.
 */
export const updateCategoryPositions = async (positions) => {
    const { error } = await supabase.rpc('update_category_positions', { positions });
    if (error) logger.error('Error updating category positions', error, { context: 'categoryService', positionCount: positions?.length });
    return { error };
};
import { supabase } from '../integrations/supabase/client';

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
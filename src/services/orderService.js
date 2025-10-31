import { supabase } from '../integrations/supabase/client';
import { logger } from '../utils/logger';

/**
 * Fetches all items for a given order.
 * @param {string} orderId - The ID of the order.
 */
export const getOrderItems = async (orderId) => {
    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
    if (error) logger.error('Error fetching order items', error, { context: 'orderService', orderId });
    return { data, error };
};
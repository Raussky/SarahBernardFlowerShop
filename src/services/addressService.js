import { supabase } from '../integrations/supabase/client';
import { logger } from '../utils/logger';

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
        logger.error('Error unsetting old default address', unsetError, { context: 'addressService', userId, addressId });
        return { error: unsetError };
    }

    // 2. Set the new address as default
    const { error: setError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

    if (setError) {
        logger.error('Error setting new default address', setError, { context: 'addressService', userId, addressId });
    }

    return { error: setError };
};
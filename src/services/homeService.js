import { supabase } from '../integrations/supabase/client';
import { logger } from '../utils/logger';
import { retry, RETRY_PRESETS } from '../utils/retry';

/**
 * Fetches all data required for the Home Screen.
 * This includes categories, banners, best sellers, and various product showcases.
 */
export const getHomeScreenData = async () => {
  try {
    return await retry(async () => {
      const [
        categoriesRes,
        bannersRes,
        bestSellersRes,
        readyShowcaseRes,
        combosRes,
        weeklyPicksRes,
        premiumBouquetsRes
      ] = await Promise.all([
        supabase.from('categories').select('*').order('position', { ascending: true }),
        supabase.from('banners').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.rpc('get_best_sellers', { limit_count: 6 }),
        supabase.rpc('get_products_by_category_name', { category_name_param: 'Готовая ветрина', limit_count: 6 }),
        supabase.from('combos').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(6),
        supabase.rpc('get_products_by_category_name', { category_name_param: 'Недельная подборка', limit_count: 6 }),
        supabase.rpc('get_products_by_category_name', { category_name_param: 'Премиум букеты', limit_count: 6 }),
      ]);

      // Check for errors in responses
      const errors = [categoriesRes, bannersRes, bestSellersRes, readyShowcaseRes, combosRes, weeklyPicksRes, premiumBouquetsRes]
        .map(res => res.error)
        .filter(Boolean);

      if (errors.length > 0) {
        throw new Error(`Failed to fetch some home screen data: ${errors.map(e => e.message).join(', ')}`);
      }

      return {
        categories: categoriesRes.data || [],
        banners: bannersRes.data || [],
        bestSellers: bestSellersRes.data || [],
        readyShowcase: readyShowcaseRes.data || [],
        combos: combosRes.data || [],
        weeklyPicks: weeklyPicksRes.data || [],
        premiumBouquets: premiumBouquetsRes.data || [],
      };
    }, RETRY_PRESETS.standard);
  } catch (error) {
    logger.error('Error fetching home screen data', error, { context: 'homeService' });
    return null;
  }
};
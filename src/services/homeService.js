import { supabase } from '../integrations/supabase/client';

/**
 * Fetches all data required for the Home Screen.
 * This includes categories, banners, best sellers, and various product showcases.
 */
export const getHomeScreenData = async () => {
  try {
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

    return {
      categories: categoriesRes.data || [],
      banners: bannersRes.data || [],
      bestSellers: bestSellersRes.data || [],
      readyShowcase: readyShowcaseRes.data || [],
      combos: combosRes.data || [],
      weeklyPicks: weeklyPicksRes.data || [],
      premiumBouquets: premiumBouquetsRes.data || [],
    };
  } catch (error) {
    console.error("Error fetching home screen data:", error);
    return null;
  }
};
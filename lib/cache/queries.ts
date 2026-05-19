import { unstable_cache } from 'next/cache';
import { createStaticClient } from '@/lib/supabase/server';

const PRODUCT_SELECT_BASE =
  'id, slug, title_fr, title_en, title_ar, short_description_fr, short_description_en, short_description_ar, description_fr, description_en, description_ar, price, compare_at_price, currency, category_id, sku, stock_quantity, track_inventory, low_stock_threshold, attributes, meta_title_fr, meta_title_en, meta_title_ar, meta_description_fr, meta_description_en, meta_description_ar, categories(name_fr, name_en, name_ar, slug)';

const PRODUCT_SELECT_WITH_DETAIL_SECTIONS = `${PRODUCT_SELECT_BASE}, detail_sections`;

// Shared / static data — cache 5 minutes

export async function getSiteSettings() {
  const supabase = createStaticClient();
  const { data, error } = await supabase.from('site_settings_public').select('*').single();
  if (error) {
    console.error('[getSiteSettings] Supabase error:', error.message);
  }
  return data as Record<string, unknown> | null;
}

export const getCategories = unstable_cache(
  async (limit?: number) => {
    const supabase = createStaticClient();
    let query = supabase
      .from('categories')
      .select('id, slug, name_fr, name_en, name_ar, image_url, display_order')
      .eq('is_active', true)
      .order('display_order');
    if (limit) query = query.limit(limit);
    const { data } = await query;
    return data || [];
  },
  ['categories'],
  { revalidate: 300, tags: ['categories'] }
);

export const getCities = unstable_cache(
  async () => {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('cities')
      .select('id, name_fr, shipping_fee')
      .eq('is_active', true)
      .order('display_order');
    return data || [];
  },
  ['cities'],
  { revalidate: 300, tags: ['cities'] }
);

// Product data — cache 2 minutes

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT_WITH_DETAIL_SECTIONS)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!error) {
      return data as Record<string, unknown> | null;
    }

    if (/detail_sections/i.test(error.message)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_BASE)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (fallbackError) {
        console.error('[getProductBySlug] Fallback Supabase error:', fallbackError.message);
        return null;
      }

      return fallbackData ? ({ ...fallbackData, detail_sections: [] } as Record<string, unknown>) : null;
    }

    console.error('[getProductBySlug] Supabase error:', error.message);
    return null;
  },
  ['product-by-slug'],
  { revalidate: 120, tags: ['products'] }
);

export const getProductImages = unstable_cache(
  async (productId: string) => {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('product_images')
      .select('url, alt_text, display_order, is_primary')
      .eq('product_id', productId)
      .order('display_order');
    return data || [];
  },
  ['product-images'],
  { revalidate: 120, tags: ['product-images'] }
);

export const getFeaturedProducts = unstable_cache(
  async (limit = 8) => {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('products')
      .select('id, slug, title_fr, title_en, title_ar, price, compare_at_price, currency, track_inventory, stock_quantity, low_stock_threshold')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },
  ['featured-products'],
  { revalidate: 60, tags: ['products'] }
);

export const getProductsByCategory = unstable_cache(
  async (categoryId: string | null, limit = 48) => {
    const supabase = createStaticClient();
    let query = supabase
      .from('products')
      .select('id, slug, title_fr, title_en, title_ar, price, compare_at_price, currency, stock_quantity, track_inventory, low_stock_threshold')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data } = await query;
    return data || [];
  },
  ['products-by-category'],
  { revalidate: 60, tags: ['products'] }
);

export const getRelatedProducts = unstable_cache(
  async (categoryId: string, excludeProductId: string, limit = 4) => {
    const supabase = createStaticClient();
    // Single query: products + their primary images via PostgREST embed.
    // Eliminates the previous N+1 of fetching related-product images separately.
    const { data } = await supabase
      .from('products')
      .select(
        `id, slug, title_fr, title_en, title_ar, price, compare_at_price, currency, stock_quantity, track_inventory, low_stock_threshold, product_images(url, is_primary)`
      )
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', excludeProductId)
      .limit(limit);
    return data || [];
  },
  ['related-products'],
  { revalidate: 120, tags: ['products', 'product-images'] }
);

export const getAdjacentProducts = unstable_cache(
  async (currentProductId: string, createdAt: string, categoryId: string | null) => {
    const supabase = createStaticClient();

    // Previous product (older / earlier created_at)
    let prevQuery = supabase
      .from('products')
      .select('slug, title_fr, title_en, title_ar')
      .eq('is_active', true)
      .lte('created_at', createdAt)
      .neq('id', currentProductId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (categoryId) {
      prevQuery = prevQuery.eq('category_id', categoryId);
    }

    // Next product (newer / later created_at)
    let nextQuery = supabase
      .from('products')
      .select('slug, title_fr, title_en, title_ar')
      .eq('is_active', true)
      .gte('created_at', createdAt)
      .neq('id', currentProductId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (categoryId) {
      nextQuery = nextQuery.eq('category_id', categoryId);
    }

    const [{ data: prev }, { data: next }] = await Promise.all([prevQuery, nextQuery]);

    return {
      prev: prev?.[0] || null,
      next: next?.[0] || null,
    };
  },
  ['adjacent-products'],
  { revalidate: 120, tags: ['products'] }
);

export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('categories')
      .select('id, slug, name_fr, description_fr')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    return data as Record<string, unknown> | null;
  },
  ['category-by-slug'],
  { revalidate: 300, tags: ['categories'] }
);

export const getWhyUsItems = unstable_cache(
  async () => {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('why_us_items')
      .select('id, display_order, number_label_fr, number_label_en, number_label_ar, title_fr, title_en, title_ar, text_fr, text_en, text_ar')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return data || [];
  },
  ['why-us-items'],
  { revalidate: 300, tags: ['why-us-items'] }
);

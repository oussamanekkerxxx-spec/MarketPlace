import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shahdmall.com';
const LOCALES = ['fr', 'en', 'ar'] as const;

function localizedUrl(path: string, locale: string): string {
  return `${SITE_URL}/${locale}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch active products
  const { data: productsRaw } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true);

  // Fetch active categories
  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_active', true);

  // Fetch active product rows
  const { data: rowsRaw } = await supabase
    .from('product_rows')
    .select('slug, updated_at')
    .eq('is_active', true);

  const products = productsRaw || [];
  const categories = categoriesRaw || [];
  const rows = rowsRaw || [];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages — one entry per locale
  const staticPaths = ['', '/about', '/contact', '/privacy', '/terms', '/search'];
  for (const path of staticPaths) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(path, locale),
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : 'monthly',
        priority: path === '' ? 1.0 : 0.5,
      });
    }
  }

  // Category pages
  for (const category of categories) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(`/category/${category.slug}`, locale),
        lastModified: new Date(category.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Product row pages
  for (const row of rows) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(`/row/${row.slug}`, locale),
        lastModified: new Date(row.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Product pages
  for (const product of products) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(`/product/${product.slug}`, locale),
        lastModified: new Date(product.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  return entries;
}

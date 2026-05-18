import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('site_settings_public')
    .select('site_name')
    .eq('id', 1)
    .single();

  const { data: productsRaw } = await supabase
    .from('products')
    .select('id, slug, title_fr, description_fr, price, compare_at_price, currency, stock_quantity, is_active')
    .eq('is_active', true);

  const { data: imagesRaw } = await supabase
    .from('product_images')
    .select('product_id, url')
    .eq('is_primary', true);

  type ProductRow = {
    id: string;
    slug: string;
    title_fr: string;
    description_fr: string | null;
    price: number;
    currency: string;
    stock_quantity: number;
  };

  type ImageRow = { product_id: string; url: string };

  const products = productsRaw as ProductRow[] | null;
  const images = imagesRaw as ImageRow[] | null;

  const imageMap = new Map(images?.map((img) => [img.product_id, img.url]));

  const siteName = (settings?.site_name as string) || 'Boutique';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  const items = (products || [])
    .map((product) => {
      const imageUrl = imageMap.get(product.id);
      const availability = product.stock_quantity > 0 ? 'in stock' : 'out of stock';

      return `
    <item>
      <g:id>${product.id}</g:id>
      <g:title>${escapeXml(product.title_fr)}</g:title>
      <g:description>${escapeXml(product.description_fr || product.title_fr)}</g:description>
      <g:link>${baseUrl}/fr/product/${product.slug}</g:link>
      ${imageUrl ? `<g:image_link>${escapeXml(imageUrl)}</g:image_link>` : ''}
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${product.price.toFixed(2)} ${product.currency}</g:price>
      <g:brand>${escapeXml(siteName)}</g:brand>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <description>Catalogue produits ${escapeXml(siteName)}</description>
    <link>${baseUrl}</link>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

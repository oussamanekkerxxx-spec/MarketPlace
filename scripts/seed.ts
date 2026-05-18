/* eslint-disable no-console */
/**
 * Seed script — populates the marketing-site Supabase project with fake data:
 *   • 6 categories (with banner images uploaded to category-images bucket)
 *   • 12 products across the categories (with main + detail images uploaded to product-images)
 *   • 12 orders + order_items spread across the last 30 days, with mixed statuses
 *
 * Usage:
 *   1. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
 *   2. Ensure the `product-images` and `category-images` storage buckets exist
 *   3. Run:  npm run seed
 *
 * Idempotent: re-runs skip categories/products with the same slug,
 * and orders aren't re-inserted (we generate fresh ones each run if --orders is passed).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Load .env.local manually (avoids extra dep) ───────────────────────────
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  console.warn('No .env.local found, relying on process.env');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === 'your-service-role-key') {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('   Get the service_role key from: Supabase Dashboard → Settings → API');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE SOURCES — mix of real photos (Picsum) and labeled placeholders
// ═══════════════════════════════════════════════════════════════════════════

function picsumUrl(seed: string, size = 800): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${size}/${size}`;
}

function placeholderUrl(text: string, bg = 'E8DDCB', fg = '2A1810'): string {
  return `https://placehold.co/800x800/${bg}/${fg}/png?text=${encodeURIComponent(text)}&font=poppins`;
}

async function downloadAndUpload(
  sourceUrl: string,
  bucket: string,
  fileName: string
): Promise<string> {
  const res = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 seed-script' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Fetch ${sourceUrl} failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';

  const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(`Upload ${fileName} failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA — categories, products, customers
// ═══════════════════════════════════════════════════════════════════════════

type SeedCategory = {
  slug: string;
  name_fr: string;
  name_en: string;
  name_ar: string;
  description_fr: string;
  imageSource: 'picsum' | 'placeholder';
  imageSeed: string;
  display_order: number;
};

const CATEGORIES: SeedCategory[] = [
  {
    slug: 'seed-soins-beaute',
    name_fr: 'Soins & Beauté',
    name_en: 'Skincare & Beauty',
    name_ar: 'العناية والجمال',
    description_fr: 'Produits cosmétiques et de soin sélectionnés.',
    imageSource: 'picsum',
    imageSeed: 'beauty-products-flatlay',
    display_order: 1,
  },
  {
    slug: 'seed-mode-accessoires',
    name_fr: 'Mode & Accessoires',
    name_en: 'Fashion & Accessories',
    name_ar: 'الموضة والإكسسوارات',
    description_fr: 'Vêtements, sacs et accessoires tendance.',
    imageSource: 'picsum',
    imageSeed: 'fashion-flatlay-2',
    display_order: 2,
  },
  {
    slug: 'seed-maison-deco',
    name_fr: 'Maison & Déco',
    name_en: 'Home & Decor',
    name_ar: 'المنزل والديكور',
    description_fr: 'Objets de décoration pour embellir votre intérieur.',
    imageSource: 'picsum',
    imageSeed: 'home-decor-living',
    display_order: 3,
  },
  {
    slug: 'seed-electronique',
    name_fr: 'Électronique',
    name_en: 'Electronics',
    name_ar: 'الإلكترونيات',
    description_fr: 'Gadgets et accessoires électroniques.',
    imageSource: 'picsum',
    imageSeed: 'tech-flatlay-desk',
    display_order: 4,
  },
  {
    slug: 'seed-bijoux-montres',
    name_fr: 'Bijoux & Montres',
    name_en: 'Jewelry & Watches',
    name_ar: 'المجوهرات والساعات',
    description_fr: 'Bijoux artisanaux et montres élégantes.',
    imageSource: 'picsum',
    imageSeed: 'jewelry-rings-gold',
    display_order: 5,
  },
  {
    slug: 'seed-cuisine-table',
    name_fr: 'Cuisine & Table',
    name_en: 'Kitchen & Tableware',
    name_ar: 'المطبخ والمائدة',
    description_fr: 'Ustensiles, accessoires et art de la table.',
    imageSource: 'placeholder',
    imageSeed: 'Cuisine',
    display_order: 6,
  },
];

type SeedProduct = {
  slug: string;
  categorySlug: string;
  title_fr: string;
  title_en: string;
  title_ar: string;
  short_fr: string;
  short_en: string;
  short_ar: string;
  description_fr: string;
  features_fr: string[];
  features_en: string[];
  features_ar: string[];
  price: number;
  compare_at_price?: number;
  sku: string;
  stock_quantity: number;
  is_featured: boolean;
  imageHints: { type: 'picsum' | 'placeholder'; seed: string }[];
  detailHints: { type: 'picsum' | 'placeholder'; seed: string }[];
};

const PRODUCTS: SeedProduct[] = [
  // ─── Soins & Beauté ─────────────────────────────────────────────────────
  {
    slug: 'seed-creme-hydratante-rose',
    categorySlug: 'seed-soins-beaute',
    title_fr: 'Crème hydratante à la rose de Damas',
    title_en: 'Damascus Rose Hydrating Cream',
    title_ar: 'كريم مرطب بماء الورد الدمشقي',
    short_fr: 'Hydratation intense 24h avec extrait de rose marocaine.',
    short_en: 'Intense 24h hydration with Moroccan rose extract.',
    short_ar: 'ترطيب مكثف لمدة 24 ساعة مع خلاصة الورد المغربي.',
    description_fr:
      '<p>Une crème onctueuse formulée avec de l\'<strong>extrait pur de rose de Damas</strong>, cultivée dans la vallée du Dadès. Elle nourrit la peau en profondeur, lisse les traits et procure une sensation de fraîcheur immédiate.</p><p>Sans parabènes, sans alcool, testée dermatologiquement.</p>',
    features_fr: [
      'Hydratation 24h prouvée cliniquement',
      'Extrait de rose 100% bio',
      'Sans parabènes ni sulfates',
      'Convient à toutes peaux',
    ],
    features_en: [
      '24h proven hydration',
      '100% organic rose extract',
      'Free of parabens and sulfates',
      'Suitable for all skin types',
    ],
    features_ar: [
      'ترطيب لمدة 24 ساعة',
      'خلاصة ورد عضوية 100%',
      'خالٍ من البارابين والسلفات',
      'مناسب لجميع أنواع البشرة',
    ],
    price: 189,
    compare_at_price: 249,
    sku: 'BEAU-CRM-001',
    stock_quantity: 32,
    is_featured: true,
    imageHints: [
      { type: 'picsum', seed: 'cream-jar-pink' },
      { type: 'picsum', seed: 'rose-petals-skincare' },
      { type: 'picsum', seed: 'beauty-shelf-pastel' },
    ],
    detailHints: [
      { type: 'picsum', seed: 'rose-texture-close' },
    ],
  },
  {
    slug: 'seed-huile-argan-pure',
    categorySlug: 'seed-soins-beaute',
    title_fr: 'Huile d\'argan pure pressée à froid',
    title_en: 'Pure Cold-Pressed Argan Oil',
    title_ar: 'زيت الأركان الخالص المعصور على البارد',
    short_fr: 'Huile 100% naturelle, multi-usages cheveux et corps.',
    short_en: '100% natural multi-use oil for hair and body.',
    short_ar: 'زيت طبيعي 100٪ متعدد الاستخدامات للشعر والجسم.',
    description_fr:
      '<p>Notre huile d\'argan est issue de coopératives féminines de la région de Tiznit. Pressée à froid pour préserver tous ses bienfaits, elle nourrit, répare et fait briller cheveux et peau.</p>',
    features_fr: [
      'Pressée à froid, non raffinée',
      'Riche en vitamine E',
      'Issue du commerce équitable',
      'Flacon ambré 100ml',
    ],
    features_en: [
      'Cold-pressed, unrefined',
      'Rich in vitamin E',
      'Fair trade sourced',
      '100ml amber bottle',
    ],
    features_ar: [
      'معصور على البارد، غير مكرر',
      'غني بفيتامين E',
      'تجارة عادلة',
      'قارورة عنبرية 100 مل',
    ],
    price: 145,
    sku: 'BEAU-OIL-002',
    stock_quantity: 78,
    is_featured: true,
    imageHints: [
      { type: 'picsum', seed: 'argan-oil-bottle' },
      { type: 'picsum', seed: 'argan-fruit-tree' },
    ],
    detailHints: [],
  },

  // ─── Mode & Accessoires ─────────────────────────────────────────────────
  {
    slug: 'seed-sac-cuir-tanne',
    categorySlug: 'seed-mode-accessoires',
    title_fr: 'Sac à main en cuir tanné artisanal',
    title_en: 'Handcrafted Tanned Leather Bag',
    title_ar: 'حقيبة يد جلدية مدبوغة يدوياً',
    short_fr: 'Sac en cuir véritable tanné selon la tradition marocaine.',
    short_en: 'Genuine leather bag tanned the traditional Moroccan way.',
    short_ar: 'حقيبة من الجلد الأصلي مدبوغة بالطريقة المغربية التقليدية.',
    description_fr:
      '<p>Fabriqué à la main dans les tanneries de Fès, ce sac allie l\'élégance moderne au savoir-faire ancestral. Le cuir, tanné aux pigments naturels, développe une patine unique avec le temps.</p>',
    features_fr: [
      'Cuir véritable tanné aux pigments naturels',
      'Cousu main par des artisans de Fès',
      'Doublure coton beige',
      'Garantie 2 ans',
    ],
    features_en: [
      'Genuine leather, natural pigments',
      'Hand-sewn by Fes artisans',
      'Beige cotton lining',
      '2-year warranty',
    ],
    features_ar: [
      'جلد طبيعي مدبوغ بأصباغ طبيعية',
      'مخيط يدوياً بواسطة حرفيي فاس',
      'بطانة قطنية بيج',
      'ضمان لمدة سنتين',
    ],
    price: 449,
    compare_at_price: 599,
    sku: 'MODE-SAC-003',
    stock_quantity: 14,
    is_featured: true,
    imageHints: [
      { type: 'picsum', seed: 'leather-bag-tan' },
      { type: 'picsum', seed: 'leather-detail-stitch' },
      { type: 'picsum', seed: 'fashion-flatlay-bag' },
    ],
    detailHints: [
      { type: 'picsum', seed: 'leather-close-grain' },
    ],
  },
  {
    slug: 'seed-foulard-soie-azure',
    categorySlug: 'seed-mode-accessoires',
    title_fr: 'Foulard en soie motif zellige',
    title_en: 'Silk Scarf with Zellige Pattern',
    title_ar: 'وشاح حريري بنقش الزليج',
    short_fr: 'Foulard 100% soie inspiré des mosaïques marocaines.',
    short_en: '100% silk scarf inspired by Moroccan mosaics.',
    short_ar: 'وشاح من الحرير 100٪ مستوحى من الفسيفساء المغربية.',
    description_fr:
      '<p>Un accessoire raffiné en soie pure, imprimé d\'un motif zellige aux teintes profondes. À porter autour du cou, dans les cheveux ou en ceinture.</p>',
    features_fr: ['Soie 100% naturelle', '90 × 90 cm', 'Impression numérique haute définition', 'Boîte cadeau incluse'],
    features_en: ['100% natural silk', '90 × 90 cm', 'HD digital print', 'Gift box included'],
    features_ar: ['حرير طبيعي 100٪', '90 × 90 سم', 'طباعة رقمية عالية الدقة', 'علبة هدية مدرجة'],
    price: 229,
    sku: 'MODE-FOU-004',
    stock_quantity: 26,
    is_featured: false,
    imageHints: [{ type: 'picsum', seed: 'silk-scarf-blue' }, { type: 'picsum', seed: 'zellige-pattern-azure' }],
    detailHints: [],
  },

  // ─── Maison & Déco ──────────────────────────────────────────────────────
  {
    slug: 'seed-lampe-laiton-mouchara',
    categorySlug: 'seed-maison-deco',
    title_fr: 'Lampe en laiton ajouré moucharabieh',
    title_en: 'Pierced Brass Moucharabieh Lamp',
    title_ar: 'مصباح نحاسي مفرّغ بنقش المشربية',
    short_fr: 'Crée une ambiance feutrée avec ses motifs ajourés.',
    short_en: 'Creates a warm ambiance with pierced patterns.',
    short_ar: 'يخلق أجواءً دافئة بنقوشه المفرّغة.',
    description_fr:
      '<p>Travail artisanal de Marrakech, cette lampe en laiton martelé diffuse une lumière tamisée à travers ses motifs traditionnels. Idéale pour un salon, une chambre ou une terrasse couverte.</p>',
    features_fr: ['Laiton martelé à la main', 'Hauteur 38 cm', 'Douille E27 (ampoule non incluse)', 'Câble textile noir 1.8m'],
    features_en: ['Hand-hammered brass', 'Height 38 cm', 'E27 socket (bulb not included)', '1.8m black fabric cord'],
    features_ar: ['نحاس مطروق يدوياً', 'الارتفاع 38 سم', 'قاعدة E27 (المصباح غير مدرج)', 'سلك قماشي أسود 1.8 م'],
    price: 389,
    compare_at_price: 489,
    sku: 'DECO-LAM-005',
    stock_quantity: 9,
    is_featured: true,
    imageHints: [
      { type: 'picsum', seed: 'brass-lamp-warm' },
      { type: 'picsum', seed: 'moroccan-interior-lamp' },
      { type: 'picsum', seed: 'lamp-shadows-pattern' },
    ],
    detailHints: [{ type: 'picsum', seed: 'brass-texture-hammered' }],
  },
  {
    slug: 'seed-coussin-broderie-berbere',
    categorySlug: 'seed-maison-deco',
    title_fr: 'Coussin brodé motifs berbères',
    title_en: 'Berber Embroidered Cushion',
    title_ar: 'وسادة مطرّزة بنقوش أمازيغية',
    short_fr: 'Coussin déco 45×45 cm brodé à la main.',
    short_en: 'Hand-embroidered 45×45 cm decorative cushion.',
    short_ar: 'وسادة زخرفية 45×45 سم مطرّزة يدوياً.',
    description_fr:
      '<p>Coussin en coton épais, brodé point par point dans une coopérative de l\'Atlas. Chaque pièce est unique.</p>',
    features_fr: ['Coton 100%', '45 × 45 cm', 'Garnissage inclus', 'Lavable à 30°C'],
    features_en: ['100% cotton', '45 × 45 cm', 'Filling included', 'Machine washable at 30°C'],
    features_ar: ['قطن 100٪', '45 × 45 سم', 'الحشو مدرج', 'قابل للغسيل بـ 30°م'],
    price: 169,
    sku: 'DECO-COU-006',
    stock_quantity: 41,
    is_featured: false,
    imageHints: [{ type: 'picsum', seed: 'cushion-berber-cream' }, { type: 'picsum', seed: 'cushion-stack-living' }],
    detailHints: [],
  },

  // ─── Électronique ───────────────────────────────────────────────────────
  {
    slug: 'seed-ecouteurs-bluetooth-pro',
    categorySlug: 'seed-electronique',
    title_fr: 'Écouteurs sans fil Pro réduction de bruit',
    title_en: 'Pro Wireless Earbuds with ANC',
    title_ar: 'سماعات لاسلكية برو مع إلغاء الضوضاء',
    short_fr: 'Son immersif, autonomie 32h avec boîtier de charge.',
    short_en: 'Immersive sound, 32h battery with charging case.',
    short_ar: 'صوت غامر، بطارية 32 ساعة مع علبة الشحن.',
    description_fr:
      '<p>Profitez de votre musique en toute liberté avec ces écouteurs Bluetooth 5.3 à réduction active du bruit. Compatibles iOS et Android.</p>',
    features_fr: ['Bluetooth 5.3 multipoint', 'Réduction active du bruit (-30dB)', 'Autonomie 32h avec boîtier', 'Résistance IPX5'],
    features_en: ['Bluetooth 5.3 multipoint', 'Active noise cancellation (-30dB)', '32h battery with case', 'IPX5 water resistant'],
    features_ar: ['بلوتوث 5.3 متعدد النقاط', 'إلغاء الضوضاء النشط (-30 ديسيبل)', 'بطارية 32 ساعة مع العلبة', 'مقاوم للماء IPX5'],
    price: 329,
    compare_at_price: 449,
    sku: 'ELEC-EAR-007',
    stock_quantity: 55,
    is_featured: true,
    imageHints: [
      { type: 'picsum', seed: 'earbuds-white-case' },
      { type: 'picsum', seed: 'earbuds-on-table' },
      { type: 'picsum', seed: 'earbuds-lifestyle' },
    ],
    detailHints: [],
  },
  {
    slug: 'seed-chargeur-rapide-65w',
    categorySlug: 'seed-electronique',
    title_fr: 'Chargeur GaN 65W trois ports',
    title_en: '65W GaN Charger with Three Ports',
    title_ar: 'شاحن GaN 65 واط بثلاثة منافذ',
    short_fr: 'Charge ultra-rapide pour MacBook, iPad, iPhone simultanément.',
    short_en: 'Ultra-fast charging for MacBook, iPad, iPhone simultaneously.',
    short_ar: 'شحن فائق السرعة لجهاز ماك بوك وآيباد وآيفون في وقت واحد.',
    description_fr: '<p>Compact, puissant, universel. Le compagnon de voyage indispensable.</p>',
    features_fr: ['Technologie GaN', '2× USB-C + 1× USB-A', 'Compatible PD 3.0 / QC 4.0', 'Prise pliable'],
    features_en: ['GaN technology', '2× USB-C + 1× USB-A', 'PD 3.0 / QC 4.0', 'Foldable plug'],
    features_ar: ['تقنية GaN', '2× USB-C + 1× USB-A', 'متوافق PD 3.0 / QC 4.0', 'قابس قابل للطي'],
    price: 219,
    sku: 'ELEC-CHA-008',
    stock_quantity: 88,
    is_featured: false,
    imageHints: [{ type: 'picsum', seed: 'charger-compact-white' }, { type: 'picsum', seed: 'tech-desk-clean' }],
    detailHints: [],
  },

  // ─── Bijoux & Montres ───────────────────────────────────────────────────
  {
    slug: 'seed-bracelet-argent-amazigh',
    categorySlug: 'seed-bijoux-montres',
    title_fr: 'Bracelet en argent symbole amazigh',
    title_en: 'Silver Bracelet with Amazigh Symbol',
    title_ar: 'سوار فضي بالرمز الأمازيغي',
    short_fr: 'Bracelet en argent 925 gravé d\'un symbole berbère traditionnel.',
    short_en: 'Sterling silver 925 bracelet engraved with a traditional Berber symbol.',
    short_ar: 'سوار من الفضة الخالصة 925 منقوش برمز أمازيغي تقليدي.',
    description_fr:
      '<p>Pièce unique en argent massif, gravée à la main du symbole de la liberté (azza). Un cadeau porteur de sens.</p>',
    features_fr: ['Argent 925 poinçonné', 'Diamètre ajustable 58-65mm', 'Gravure à la main', 'Pochette velours offerte'],
    features_en: ['Sterling silver 925, hallmarked', 'Adjustable 58-65mm', 'Hand-engraved', 'Free velvet pouch'],
    features_ar: ['فضة 925 مختومة', 'قابل للضبط 58-65 ملم', 'منقوش يدوياً', 'كيس مخمل مجاني'],
    price: 379,
    sku: 'BIJ-BRA-009',
    stock_quantity: 12,
    is_featured: true,
    imageHints: [
      { type: 'picsum', seed: 'silver-bracelet-detail' },
      { type: 'picsum', seed: 'jewelry-on-cloth' },
    ],
    detailHints: [],
  },
  {
    slug: 'seed-montre-cuir-minimaliste',
    categorySlug: 'seed-bijoux-montres',
    title_fr: 'Montre minimaliste bracelet cuir',
    title_en: 'Minimalist Leather Strap Watch',
    title_ar: 'ساعة بسيطة بسوار من الجلد',
    short_fr: 'Cadran 38mm, mouvement japonais, bracelet cuir véritable.',
    short_en: '38mm dial, Japanese movement, genuine leather strap.',
    short_ar: 'قرص 38 ملم، حركة يابانية، سوار جلدي أصلي.',
    description_fr: '<p>Design épuré, finition soignée. Une montre qui se fait oublier au poignet.</p>',
    features_fr: ['Mouvement quartz japonais Miyota', 'Boîtier acier 38mm', 'Bracelet cuir véritable', 'Étanchéité 3 ATM'],
    features_en: ['Japanese Miyota quartz', '38mm steel case', 'Genuine leather strap', '3 ATM water resistant'],
    features_ar: ['حركة كوارتز يابانية Miyota', 'علبة فولاذية 38 ملم', 'سوار جلدي أصلي', 'مقاوم للماء 3 ATM'],
    price: 299,
    compare_at_price: 399,
    sku: 'BIJ-MON-010',
    stock_quantity: 23,
    is_featured: false,
    imageHints: [
      { type: 'picsum', seed: 'watch-leather-strap' },
      { type: 'picsum', seed: 'watch-on-wrist-cafe' },
    ],
    detailHints: [],
  },

  // ─── Cuisine & Table ────────────────────────────────────────────────────
  {
    slug: 'seed-tajine-terre-cuite',
    categorySlug: 'seed-cuisine-table',
    title_fr: 'Tajine traditionnel en terre cuite',
    title_en: 'Traditional Clay Tagine',
    title_ar: 'طاجين تقليدي من الفخار',
    short_fr: 'Tajine émaillé pour cuissons mijotées authentiques.',
    short_en: 'Glazed tagine for authentic slow-cooked dishes.',
    short_ar: 'طاجين مزجج للطهي البطيء الأصيل.',
    description_fr: '<p>Façonné par les potiers de Salé, ce tajine 28 cm convient à 4 personnes.</p>',
    features_fr: ['Terre cuite émaillée non-toxique', 'Diamètre 28 cm', 'Compatible feu doux et four', 'Couvercle conique'],
    features_en: ['Non-toxic glazed clay', '28 cm diameter', 'Low heat & oven safe', 'Conical lid'],
    features_ar: ['فخار مزجج غير سام', 'قطر 28 سم', 'مناسب للنار الهادئة والفرن', 'غطاء مخروطي'],
    price: 199,
    sku: 'CUI-TAJ-011',
    stock_quantity: 35,
    is_featured: true,
    imageHints: [
      { type: 'picsum', seed: 'tagine-terracotta-glaze' },
      { type: 'picsum', seed: 'moroccan-table-food' },
    ],
    detailHints: [],
  },
  {
    slug: 'seed-verres-the-doreille',
    categorySlug: 'seed-cuisine-table',
    title_fr: 'Coffret 6 verres à thé motifs dorés',
    title_en: 'Set of 6 Tea Glasses with Gold Patterns',
    title_ar: 'طقم 6 كؤوس شاي بنقوش ذهبية',
    short_fr: 'Verres à thé traditionnels marocains, motifs peints à la main.',
    short_en: 'Traditional Moroccan tea glasses, hand-painted patterns.',
    short_ar: 'كؤوس شاي مغربية تقليدية بنقوش مرسومة يدوياً.',
    description_fr: '<p>Coffret cadeau de 6 verres à thé en cristallin, décorés de motifs dorés peints à la main.</p>',
    features_fr: ['Verre cristallin transparent', 'Peinture résistante au lave-vaisselle (cycle doux)', 'Coffret cadeau', '6 unités'],
    features_en: ['Clear crystal glass', 'Dishwasher-safe paint (gentle cycle)', 'Gift box', '6 units'],
    features_ar: ['زجاج كريستالي شفاف', 'الطلاء آمن لغسالة الصحون (دورة ناعمة)', 'علبة هدية', '6 وحدات'],
    price: 159,
    compare_at_price: 219,
    sku: 'CUI-VER-012',
    stock_quantity: 47,
    is_featured: false,
    imageHints: [
      { type: 'picsum', seed: 'tea-glasses-gold-pattern' },
      { type: 'picsum', seed: 'mint-tea-pouring' },
    ],
    detailHints: [],
  },
];

// Moroccan customer first/last names for realistic orders
const FIRST_NAMES = ['Yassine', 'Sara', 'Karim', 'Aicha', 'Mehdi', 'Salma', 'Omar', 'Fatima', 'Anas', 'Imane', 'Hicham', 'Nadia'];
const LAST_NAMES = ['El Amrani', 'Benali', 'Chraibi', 'Tazi', 'Bennani', 'El Fassi', 'Ait Ali', 'Lahlou', 'Berrada', 'El Idrissi', 'Mansouri', 'Sefrioui'];

function randomPhone(): string {
  const prefix = Math.random() < 0.5 ? '06' : '07';
  let rest = '';
  for (let i = 0; i < 8; i++) rest += Math.floor(Math.random() * 10);
  return prefix + rest;
}

function randomName(): string {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const ORDER_STATUS_WEIGHTS = [0.15, 0.20, 0.20, 0.35, 0.10]; // bias toward delivered

function weightedStatus(): string {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < ORDER_STATUSES.length; i++) {
    acc += ORDER_STATUS_WEIGHTS[i];
    if (r < acc) return ORDER_STATUSES[i];
  }
  return 'pending';
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEED LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function seedCategories(): Promise<Map<string, string>> {
  console.log('\n📂 Seeding categories...');
  const slugToId = new Map<string, string>();

  for (const cat of CATEGORIES) {
    // Check existing
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .maybeSingle();

    if (existing) {
      slugToId.set(cat.slug, existing.id);
      console.log(`  • [skip] ${cat.slug} (already exists)`);
      continue;
    }

    // Upload image
    const sourceUrl =
      cat.imageSource === 'picsum' ? picsumUrl(cat.imageSeed) : placeholderUrl(cat.imageSeed);
    const fileName = `seed-${cat.slug}-${Date.now()}.jpg`;
    let imageUrl: string | null = null;
    try {
      imageUrl = await downloadAndUpload(sourceUrl, 'category-images', fileName);
    } catch (err) {
      console.warn(`  ⚠️  Image upload failed for ${cat.slug}:`, (err as Error).message);
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        slug: cat.slug,
        name_fr: cat.name_fr,
        name_en: cat.name_en,
        name_ar: cat.name_ar,
        description_fr: cat.description_fr,
        image_url: imageUrl,
        display_order: cat.display_order,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  ❌ ${cat.slug}:`, error.message);
      continue;
    }
    slugToId.set(cat.slug, data.id);
    console.log(`  ✅ ${cat.slug}`);
  }

  return slugToId;
}

async function seedProducts(categoryIds: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n📦 Seeding products...');
  const slugToId = new Map<string, string>();

  for (const product of PRODUCTS) {
    // Check existing
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', product.slug)
      .maybeSingle();

    if (existing) {
      slugToId.set(product.slug, existing.id);
      console.log(`  • [skip] ${product.slug} (already exists)`);
      continue;
    }

    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) {
      console.warn(`  ⚠️  No category for ${product.slug} — skipping`);
      continue;
    }

    // Upload main images
    const mainImageUrls: string[] = [];
    for (let i = 0; i < product.imageHints.length; i++) {
      const hint = product.imageHints[i];
      const sourceUrl = hint.type === 'picsum' ? picsumUrl(hint.seed) : placeholderUrl(hint.seed);
      const fileName = `seed-${product.slug}-main-${i}-${Date.now()}.jpg`;
      try {
        const url = await downloadAndUpload(sourceUrl, 'product-images', fileName);
        mainImageUrls.push(url);
      } catch (err) {
        console.warn(`  ⚠️  Main image ${i} failed for ${product.slug}:`, (err as Error).message);
      }
    }

    // Upload detail images
    const detailImageUrls: string[] = [];
    for (let i = 0; i < product.detailHints.length; i++) {
      const hint = product.detailHints[i];
      const sourceUrl = hint.type === 'picsum' ? picsumUrl(hint.seed) : placeholderUrl(hint.seed);
      const fileName = `seed-${product.slug}-detail-${i}-${Date.now()}.jpg`;
      try {
        const url = await downloadAndUpload(sourceUrl, 'product-images', fileName);
        detailImageUrls.push(url);
      } catch (err) {
        console.warn(`  ⚠️  Detail image ${i} failed for ${product.slug}:`, (err as Error).message);
      }
    }

    // Insert product
    const { data: created, error } = await supabase
      .from('products')
      .insert({
        slug: product.slug,
        title_fr: product.title_fr,
        title_en: product.title_en,
        title_ar: product.title_ar,
        short_description_fr: product.short_fr,
        short_description_en: product.short_en,
        short_description_ar: product.short_ar,
        description_fr: product.description_fr,
        description_en: product.description_fr, // reuse FR for EN/AR demo
        description_ar: product.description_fr,
        price: product.price,
        compare_at_price: product.compare_at_price ?? null,
        currency: 'MAD',
        category_id: categoryId,
        sku: product.sku,
        stock_quantity: product.stock_quantity,
        track_inventory: true,
        low_stock_threshold: 5,
        is_active: true,
        is_featured: product.is_featured,
        attributes: {
          features_fr: product.features_fr,
          features_en: product.features_en,
          features_ar: product.features_ar,
        },
        meta_title_fr: product.title_fr,
        meta_title_en: product.title_en,
        meta_title_ar: product.title_ar,
        meta_description_fr: product.short_fr,
        meta_description_en: product.short_en,
        meta_description_ar: product.short_ar,
        detail_images: detailImageUrls,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  ❌ ${product.slug}:`, error.message);
      continue;
    }

    slugToId.set(product.slug, created.id);

    // Insert main images into product_images table
    if (mainImageUrls.length > 0) {
      const imageRows = mainImageUrls.map((url, i) => ({
        product_id: created.id,
        url,
        alt_text: `${product.title_fr} - ${i + 1}`,
        display_order: i,
        is_primary: i === 0,
      }));
      const { error: imgErr } = await supabase.from('product_images').insert(imageRows);
      if (imgErr) {
        console.warn(`  ⚠️  product_images insert failed for ${product.slug}:`, imgErr.message);
      }
    }

    console.log(`  ✅ ${product.slug}  (${mainImageUrls.length} main, ${detailImageUrls.length} detail)`);
  }

  return slugToId;
}

async function seedOrders(productIds: Map<string, string>): Promise<void> {
  console.log('\n🛒 Seeding orders...');

  // Fetch existing cities
  const { data: cities, error: citiesErr } = await supabase
    .from('cities')
    .select('id, name_fr, shipping_fee')
    .eq('is_active', true)
    .limit(20);

  if (citiesErr || !cities || cities.length === 0) {
    console.warn('  ⚠️  No cities found — skipping orders. Add cities first.');
    return;
  }

  const productList = Array.from(productIds.entries());
  if (productList.length === 0) {
    console.warn('  ⚠️  No products available — skipping orders.');
    return;
  }

  const now = Date.now();
  const ORDER_COUNT = 12;

  for (let i = 0; i < ORDER_COUNT; i++) {
    const productEntry = productList[Math.floor(Math.random() * productList.length)];
    const productSlug = productEntry[0];
    const productId = productEntry[1];
    const product = PRODUCTS.find((p) => p.slug === productSlug)!;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const quantity = Math.random() < 0.8 ? 1 : 2;
    const subtotal = product.price * quantity;
    const shipping = (city.shipping_fee as number) || 30;
    const total = subtotal + shipping;
    const status = weightedStatus();
    const createdDaysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString();

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_name: randomName(),
        customer_phone: randomPhone(),
        customer_city_id: city.id,
        customer_city_name: city.name_fr,
        customer_address: 'Rue Mohammed V, immeuble Atlas',
        customer_notes: i % 4 === 0 ? 'Merci d\'appeler avant la livraison.' : null,
        subtotal,
        shipping_fee: shipping,
        total,
        currency: 'MAD',
        status,
        source: ['direct', 'facebook', 'instagram', 'google'][Math.floor(Math.random() * 4)],
        locale: 'fr',
        created_at: createdAt,
      })
      .select('id, order_number')
      .single();

    if (orderErr) {
      console.error(`  ❌ order ${i + 1}:`, orderErr.message);
      continue;
    }

    const { error: itemErr } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: productId,
      product_title_snapshot: product.title_fr,
      product_slug_snapshot: product.slug,
      unit_price_at_order: product.price,
      quantity,
    });

    if (itemErr) {
      console.warn(`  ⚠️  order_item failed for order ${order.order_number}:`, itemErr.message);
    }

    console.log(`  ✅ #${order.order_number}  ${status.padEnd(10)}  ${product.title_fr.slice(0, 30)}`);
  }
}

async function main() {
  console.log('🌱 Starting seed...');
  console.log(`   URL: ${SUPABASE_URL}`);

  const categoryIds = await seedCategories();
  const productIds = await seedProducts(categoryIds);
  await seedOrders(productIds);

  console.log('\n✨ Done.');
  console.log(`   Categories: ${categoryIds.size}/${CATEGORIES.length}`);
  console.log(`   Products:   ${productIds.size}/${PRODUCTS.length}`);
}

main().catch((err) => {
  console.error('\n💥 Fatal:', err);
  process.exit(1);
});

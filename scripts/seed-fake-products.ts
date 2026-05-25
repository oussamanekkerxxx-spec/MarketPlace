/* eslint-disable no-console */
/**
 * Seed script — creates 8 fake products from local images in "fake data/" folders.
 * Usage:
 *   1. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
 *   2. Run:  npm run seed:products
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

// ─── Load .env.local manually ─────────────────────────────────────────────
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
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function uploadLocalFile(
  localPath: string,
  bucket: string,
  fileName: string
): Promise<string> {
  const buffer = readFileSync(localPath);
  const ext = basename(localPath).split('.').pop() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : ext === 'avif' ? 'image/avif' : 'image/jpeg';

  const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(`Upload ${fileName} failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

function getImageFiles(folderPath: string): string[] {
  try {
    return readdirSync(folderPath)
      .filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
      .map((f) => join(folderPath, f));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  {
    slug: 'photographie',
    name_fr: 'Photographie',
    name_en: 'Photography',
    name_ar: 'تجهيزات الصور',
    description_fr: 'Équipement studio photo, éclairage et accessoires.',
    description_en: 'Studio equipment, lighting and photography accessories.',
    description_ar: 'معدات الاستوديو والإضاءة وملحقات التصوير.',
    display_order: 1,
  },
  {
    slug: 'electronique',
    name_fr: 'Électronique',
    name_en: 'Electronics',
    name_ar: 'إلكترونيات',
    description_fr: 'Casques, ordinateurs et gadgets tech.',
    description_en: 'Headphones, computers and tech gadgets.',
    description_ar: 'سماعات وأجهزة كمبيوتر وأدوات تقنية.',
    display_order: 2,
  },
  {
    slug: 'mode',
    name_fr: 'Mode',
    name_en: 'Fashion',
    name_ar: 'موضة',
    description_fr: 'Vêtements, chaussures et accessoires tendance.',
    description_en: 'Clothing, shoes and trendy accessories.',
    description_ar: 'ملابس وأحذية وإكسسوارات عصرية.',
    display_order: 3,
  },
  {
    slug: 'pieces-auto',
    name_fr: 'Pièces Auto',
    name_en: 'Auto Parts',
    name_ar: 'قطع غيار السيارات',
    description_fr: 'Capteurs, pièces moteur et accessoires auto.',
    description_en: 'Sensors, engine parts and car accessories.',
    description_ar: 'مستشعرات وقطع محرك وملحقات السيارات.',
    display_order: 4,
  },
  {
    slug: 'electromenager',
    name_fr: 'Électroménager',
    name_en: 'Home Appliances',
    name_ar: 'أجهزة المنزل',
    description_fr: 'Téléviseurs et appareils électroménagers.',
    description_en: 'TVs and home appliances.',
    description_ar: 'التلفزيونات والأجهزة المنزلية.',
    display_order: 5,
  },
];

const PRODUCT_ROWS = [
  {
    slug: 'nouveautes',
    title_fr: 'Nouveautés',
    title_en: 'New Arrivals',
    title_ar: 'وصل حديثاً',
    subtitle_fr: 'Les derniers produits ajoutés à notre catalogue',
    subtitle_en: 'The latest products added to our catalog',
    subtitle_ar: 'أحدث المنتجات المضافة إلى كتالوجنا',
    display_order: 1,
    is_active: true,
  },
  {
    slug: 'promos',
    title_fr: 'Promos',
    title_en: 'Deals',
    title_ar: 'عروض',
    subtitle_fr: 'Profitez de nos meilleures réductions',
    subtitle_en: 'Enjoy our best discounts',
    subtitle_ar: 'استفد من أفضل تخفيضاتنا',
    display_order: 2,
    is_active: true,
  },
];

type ProductDef = {
  slug: string;
  folder: string;
  subFolders: string[];
  categorySlug: string;
  rowSlug: string | null;
  title_fr: string;
  title_en: string;
  title_ar: string;
  short_fr: string;
  short_en: string;
  short_ar: string;
  description_fr: string;
  description_en: string;
  description_ar: string;
  features_fr: string[];
  features_en: string[];
  features_ar: string[];
  price: number;
  compare_at_price: number;
  sku: string;
  stock_quantity: number;
};

const PRODUCTS: ProductDef[] = [
  {
    slug: 'pack-softbox-studio-3en1',
    folder: 'fake data/1',
    subFolders: ['head images', 'detailed'],
    categorySlug: 'photographie',
    rowSlug: 'nouveautes',
    title_fr: 'Pack Softbox Studio 3 en 1 — Éclairage Professionnel',
    title_en: '3-in-1 Studio Softbox Kit — Professional Lighting',
    title_ar: 'طقم سوفت بوكس احترافي 3 في 1 — إضاءة ستوديو',
    short_fr: 'Kit complet avec softbox, trépied 2m et ampoule LED incluse.',
    short_en: 'Complete kit with softbox, 2m stand and LED bulb included.',
    short_ar: 'طقم كامل مع سوفت بوكس وحامل 2 متر ولمبة LED مضمنة.',
    description_fr:
      `<h3>Studio professionnel chez vous — sans équipement coûteux</h3>
<p>Transformez n'importe quelle pièce en <strong>studio photo/vidéo professionnel</strong> avec ce pack complet 3 en 1. Que vous soyez créateur de contenu, photographe amateur ou entrepreneur en e-commerce, ce kit vous donne une lumière de qualité studio à prix accessible.</p>
<h4>Pourquoi choisir ce pack ?</h4>
<ul>
<li><strong>Lumière douce et uniforme</strong> — Le softbox 50×70 cm diffuse une lumière enveloppante qui élimine les ombres dures et flatte tous les types de peau.</li>
<li><strong>Contrôle total</strong> — Le trépied extensible de 70 cm à 2 mètres vous permet de shooter en plongée, en contre-plongée ou à hauteur d'œil.</li>
<li><strong>LED économique et froide</strong> — L'ampoule E27 25W consomme peu d'énergie et ne surchauffe pas, même après des heures de streaming.</li>
</ul>
<h4>Idéal pour :</h4>
<p>Portrait, photo de produits, maquillage, unboxing, streaming Twitch/YouTube, podcasts visuels et vidéos TikTok/Instagram.</p>`,
    description_en:
      `<h3>Professional studio at home — without expensive gear</h3>
<p>Transform any room into a <strong>professional photo/video studio</strong> with this complete 3-in-1 kit. Whether you're a content creator, hobby photographer, or e-commerce entrepreneur, this kit gives you studio-quality light at an accessible price.</p>
<h4>Why choose this kit?</h4>
<ul>
<li><strong>Soft, even light</strong> — The 50×70 cm softbox diffuses wrap-around light that eliminates harsh shadows and flatters all skin types.</li>
<li><strong>Total control</strong> — The extendable stand (70 cm to 2 meters) lets you shoot from above, below, or eye level.</li>
<li><strong>Cool-running LED</strong> — The E27 25W bulb is energy-efficient and stays cool even after hours of streaming.</li>
</ul>
<h4>Perfect for:</h4>
<p>Portraits, product photography, makeup tutorials, unboxing, Twitch/YouTube streaming, visual podcasts, and TikTok/Instagram videos.</p>`,
    description_ar:
      `<h3>استوديو احترافي في منزلك — بدون معدات باهظة</h3>
<p>حوّل أي غرفة إلى <strong>استوديو تصوير/فيديو احترافي</strong> مع هذا الطقم الكامل 3 في 1. سواء كنت صانع محتوى أو مصور هواة أو رائد أعمال في التجارة الإلكترونية، يمنحك هذا الطقم إضاءة بجودة الاستوديو بسعر في المتناول.</p>
<h4>لماذا تختار هذا الطقم؟</h4>
<ul>
<li><strong>إضاءة ناعمة ومتوازنة</strong> — ينشر السوفت بوكس 50×70 سم إضاءة محيطة تزيل الظلال القاسية وتبرز جمال جميع أنواع البشرة.</li>
<li><strong>تحكم كامل</strong> — الحامل الممتد من 70 سم إلى 2 متر يتيح لك التصوير من الأعلى أو الأسفل أو مستوى العين.</li>
<li><strong>LED موفرة وباردة</strong> — لمبة E27 بقوة 25 واط موفرة للطاقة ولا تسخن حتى بعد ساعات من البث المباشر.</li>
</ul>
<h4>مثالي لـ:</h4>
<p>البورتريه، تصوير المنتجات، دورات المكياج، فتح الصناديق، بث Twitch/YouTube، البودكاست المرئية، وفيديوهات TikTok/Instagram.</p>`,
    features_fr: [
      'Softbox professionnel 50×70 cm avec diffuseur double couche',
      'Trépied robuste extensible 70 cm – 2 m avec rotule 180°',
      'Ampoule LED E27 25W haute CRI (rendu des couleurs fidèle)',
      'Montage rapide sans outil — prêt en 2 minutes',
      'Housse de transport incluse pour tournages en extérieur',
    ],
    features_en: [
      'Professional softbox 50×70 cm with double-layer diffuser',
      'Robust extendable stand 70 cm – 2 m with 180° ball head',
      'E27 25W LED bulb with high CRI (accurate color rendering)',
      'Tool-free quick assembly — ready in 2 minutes',
      'Carry bag included for on-location shoots',
    ],
    features_ar: [
      'سوفت بوكس احترافي 50×70 سم بموزع مزدوج الطبقات',
      'حامل قوي ممتد 70 سم – 2 متر برأس كروي 180°',
      'لمبة LED E27 بقوة 25 واط بمؤشر CRI مرتفع (ألوان حقيقية)',
      'تركيب سريع دون أدوات — جاهز في دقيقتين',
      'حقيبة حمل مضمنة للتصوير في الخارج',
    ],
    price: 249,
    compare_at_price: 399,
    sku: 'PHOTO-SOFT-001',
    stock_quantity: 15,
  },
  {
    slug: 'cours-photographie-multispecialite',
    folder: 'fake data/2',
    subFolders: [],
    categorySlug: 'photographie',
    rowSlug: 'nouveautes',
    title_fr: 'Cours Photographie Multi-Spécialité — Pack Vidéo',
    title_en: 'Multi-Specialty Photography Course — Video Pack',
    title_ar: 'دورة تصوير متعدد التخصصات — حزمة فيديو',
    short_fr: 'Apprenez la photo plage, urbaine et culinaire avec ce pack vidéo complet.',
    short_en: 'Learn beach, urban and food photography with this complete video pack.',
    short_ar: 'تعلم تصوير الشاطئ والمدن والطعام مع هذه الحزمة الفيديو الكاملة.',
    description_fr:
      `<h3>Devenez photographe polyvalent — 3 spécialités en 1 pack</h3>
<p>Ce pack de cours vidéo vous emmène dans un <strong>voyage photographique complet</strong> à travers trois univers fascinants : la plage dorée au coucher du soleil, les rues urbaines pleines de vie, et l'art délicat de la photographie culinaire.</p>
<h4>Ce que vous apprendrez :</h4>
<ul>
<li><strong>Plage & Coucher de soleil</strong> — Maîtrisez la balance des blancs, les filtres ND et la composition horizontale pour des clichés de plage à couper le souffle.</li>
<li><strong>Photographie urbaine</strong> — Apprenez à capturer l'âme de la ville : lignes de fuite, lumière artificielle, portraits de rue et architecture.</li>
<li><strong>Gastronomie</strong> — Découvrez l'éclairage naturel, la mise en scène des plats et la retouche culinaire qui donne faim rien qu'en regardant.</li>
</ul>
<h4>Inclus dans le pack :</h4>
<p>Accès illimité à vie, compatible mobile, tablette et ordinateur. Fichiers RAW sources pour vous entraîner. Certificat de completion reconnu.</p>`,
    description_en:
      `<h3>Become a versatile photographer — 3 specialties in 1 pack</h3>
<p>This video course pack takes you on a <strong>complete photographic journey</strong> through three fascinating worlds: golden beach sunsets, vibrant urban streets, and the delicate art of food photography.</p>
<h4>What you'll learn:</h4>
<ul>
<li><strong>Beach & Sunset</strong> — Master white balance, ND filters, and horizontal composition for breathtaking beach shots.</li>
<li><strong>Urban Photography</strong> — Learn to capture the soul of the city: leading lines, artificial light, street portraits, and architecture.</li>
<li><strong>Food Photography</strong> — Discover natural lighting, food styling, and appetizing post-processing that makes viewers hungry.</li>
</ul>
<h4>Included in the pack:</h4>
<p>Lifetime unlimited access, compatible with mobile, tablet, and desktop. Source RAW files for practice. Recognized completion certificate.</p>`,
    description_ar:
      `<h3>كن مصوراً متعدد المواهب — 3 تخصصات في حزمة واحدة</h3>
<p>تأخذك حزمة الدورات الفيديو هذه في <strong>رحلة تصويرية شاملة</strong> عبر ثلاثة عوالم رائعة: شواطئ غروب الشمس الذهبية، شوارع المدينة النابضة بالحياة، وفن التصوير الغذائي الرقيق.</p>
<h4>ما ستتعلمه:</h4>
<ul>
<li><strong>الشاطئ وغروب الشمس</strong> — أتقن توازن اللون الأبيض، وفلاتر ND، والتكوين الأفقي للحصول على لقطات شاطئ مذهلة.</li>
<li><strong>التصوير الحضري</strong> — تعلم التقاط روح المدينة: الخطوط المتوازية، الإضاءة الاصطناعية، بورتريه الشارع، والعمارة.</li>
<li><strong>تصوير الطعام</strong> — اكتشف الإضاءة الطبيعية، وتنسيق الطعام، والمعالجة اللاحقة الشهية التي تجعل المشاهدين جائعين.</li>
</ul>
<h4>مضمن في الحزمة:</h4>
<p>وصول غير محدود مدى الحياة، متوافق مع الجوال والتابلت وسطح المكتب. ملفات RAW المصدر للتمرن. شهادة إتمام معترف بها.</p>`,
    features_fr: [
      '3 modules complets : Plage, Urbain, Culinaire',
      '+15 heures de vidéo HD progressive et structurée',
      'Accès illimité à vie + mises à jour gratuites',
      'Fichiers RAW sources + presets Lightroom inclus',
      'Certificat de completion numérique',
    ],
    features_en: [
      '3 complete modules: Beach, Urban, Food',
      '+15 hours of progressive, structured HD video',
      'Lifetime unlimited access + free updates',
      'Source RAW files + Lightroom presets included',
      'Digital completion certificate',
    ],
    features_ar: [
      '3 وحدات كاملة: شاطئ، مدينة، طعام',
      '+15 ساعة من الفيديو عالي الدقة التدريجي والمنظم',
      'وصول غير محدود مدى الحياة + تحديثات مجانية',
      'ملفات RAW المصدر + presets لايتروم مضمنة',
      'شهادة إتمام رقمية',
    ],
    price: 199,
    compare_at_price: 349,
    sku: 'PHOTO-COURS-002',
    stock_quantity: 999,
  },
  {
    slug: 'casque-deepbass-bluetooth-gaming',
    folder: 'fake data/3',
    subFolders: ['detailed'],
    categorySlug: 'electronique',
    rowSlug: 'nouveautes',
    title_fr: 'Casque Deepbass Bluetooth 5.3 — Gaming & Musique',
    title_en: 'Deepbass Bluetooth 5.3 Headphones — Gaming & Music',
    title_ar: 'سماعة ديب باس بلوتوث 5.3 — ألعاب وموسيقى',
    short_fr: 'Autonomie 35h, micro rétractable, basses profondes et design lumineux.',
    short_en: '35h battery, retractable mic, deep bass and glowing design.',
    short_ar: 'بطارية 35 ساعة، ميكروفون قابل للسحب، باس عميق وتصميم مضيء.',
    description_fr:
      `<h3>Audio premium sans fil — Jeux, musique, appels</h3>
<p>Le casque <strong>Deepbass</strong> redéfinit ce que vous attendez d'un casque sans fil. Avec le <strong>Bluetooth 5.3</strong> dernier cri, vous bénéficiez d'une connexion sans latence, sans coupures, et une portée de 10 mètres qui vous laisse bouger librement.</p>
<h4>Autonomie qui tient la distance</h4>
<p><strong>35 heures</strong> de lecture continue sur une seule charge. C'est une semaine entière de trajets, de sessions gaming ou de playlists sans jamais chercher votre câble. Et si la batterie faiblit ? 10 minutes de charge rapide = 3 heures d'écoute.</p>
<h4>Conçu pour les longues sessions</h4>
<ul>
<li><strong>Micro rétractable anti-bruit</strong> — Vos coéquipiers vous entendent clairement, même dans un environnement bruyant.</li>
<li><strong>Coussinets à mémoire de forme</strong> — S'adaptent à la forme de vos oreilles pour un confort qui dure des heures.</li>
<li><strong>Design lumineux RGB</strong> — Personnalisez l'ambiance de votre setup gaming.</li>
</ul>`,
    description_en:
      `<h3>Premium wireless audio — Gaming, music, calls</h3>
<p>The <strong>Deepbass</strong> headphones redefine what you expect from wireless audio. With cutting-edge <strong>Bluetooth 5.3</strong>, you get zero-latency, dropout-free connection with a 10-meter range that lets you move freely.</p>
<h4>Battery life that goes the distance</h4>
<p><strong>35 hours</strong> of continuous playback on a single charge. That's an entire week of commutes, gaming sessions, or playlists without ever reaching for your cable. And if the battery runs low? 10 minutes of fast charge = 3 hours of listening.</p>
<h4>Built for marathon sessions</h4>
<ul>
<li><strong>Noise-canceling retractable mic</strong> — Your teammates hear you clearly, even in noisy environments.</li>
<li><strong>Memory foam ear cushions</strong> — Conform to your ears for comfort that lasts for hours.</li>
<li><strong>RGB glowing design</strong> — Customize the vibe of your gaming setup.</li>
</ul>`,
    description_ar:
      `<h3>صوت لاسلكي متميز — ألعاب، موسيقى، مكالمات</h3>
<p>تعيد سماعة <strong>ديب باس</strong> تعريف توقعاتك من الصوت اللاسلكي. مع تقنية <strong>البلوتوث 5.3</strong> المتطورة، تحصل على اتصال خالٍ من التأخير والانقطاعات مع مدى 10 أمتار يتيح لك الحرية الكاملة.</p>
<h4>بطارية تسير المسافة</h4>
<p><strong>35 ساعة</strong> من التشغيل المستمر بشحنة واحدة. هذا أسبوع كامل من التنقلات وجلسات الألعاب وقوائم التشغيل دون الوصول إلى الكابل. وإذا نفدت البطارية؟ 10 دقائق شحن سريع = 3 ساعات استماع.</p>
<h4>مصممة للجلسات الطويلة</h4>
<ul>
<li><strong>ميكروفون قابل للسحب بإلغاء الضوضاء</strong> — يسمعك زملاؤك بوضوح حتى في البيئات الصاخبة.</li>
<li><strong>وسائد أذن من foam الذاكرة</strong> — تتكيف مع أذنيك لراحة تدوم ساعات.</li>
<li><strong>تصميم مضيء RGB</strong> — خصص أجواء إعداد ألعابك.</li>
</ul>`,
    features_fr: [
      'Bluetooth 5.3 — connexion stable à 10 m sans latence',
      'Autonomie record 35h + charge rapide 10 min = 3h',
      'Micro rétractable avec réduction de bruit ambiant',
      'Drivers 40 mm Deepbass — basses profondes et clarté aigus',
      'Coussinets mémoire de forme + design RGB personnalisable',
    ],
    features_en: [
      'Bluetooth 5.3 — stable 10m connection with zero latency',
      'Record 35h battery + 10 min fast charge = 3 hours',
      'Retractable mic with ambient noise reduction',
      '40 mm Deepbass drivers — deep lows and crisp highs',
      'Memory foam cushions + customizable RGB design',
    ],
    features_ar: [
      'بلوتوث 5.3 — اتصال مستقر 10 أمتار بدون تأخير',
      'بطارية قياسية 35 ساعة + شحن سريع 10 دقائق = 3 ساعات',
      'ميكروفون قابل للسحب مع تخفيض ضوضاء المحيط',
      'مشغلات ديب باس 40 ملم — باس عميق ونقاء في الأصوات العالية',
      'وسائد foam ذاكرة + تصميم RGB قابل للتخصيص',
    ],
    price: 299,
    compare_at_price: 499,
    sku: 'ELEC-CASQ-003',
    stock_quantity: 42,
  },
  {
    slug: 'claquettes-adidas-adilette-beige',
    folder: 'fake data/4',
    subFolders: [],
    categorySlug: 'mode',
    rowSlug: 'promos',
    title_fr: 'Claquettes Adidas Adilette — Beige Crème',
    title_en: 'Adidas Adilette Slides — Cream Beige',
    title_ar: 'شباشب أديداس أديليت — بيج كريمي',
    short_fr: 'Confort iconique, semelle moelleuse et look minimaliste.',
    short_en: 'Iconic comfort, cushioned sole and minimalist look.',
    short_ar: 'راحة أيقونية، نعل مريح ومظهر بسيط.',
    description_fr:
      `<h3>L'icône de l'été — revisitée en beige crème</h3>
<p>Depuis les années 70, les <strong>Adidas Adilette</strong> définissent le confort décontracté. Cette édition exclusive en <strong>beige crème</strong> apporte une touche d'élégance discrète à un classique intemporel.</p>
<h4>Technologie Cloudfoam</h4>
<p>Chaque pas devient un plaisir grâce à la semelle <strong>Cloudfoam</strong> exclusive d'Adidas. Cette mousse ultra-légère absorbe les chocs et épouse la forme de votre pied pour un confort personnalisé dès la première utilisation.</p>
<h4>Polyvalence totale</h4>
<ul>
<li><strong>À la maison</strong> — Semelle souple et silencieuse sur tous types de sols.</li>
<li><strong>À la plage</strong> — EVA hydrophobe qui ne retient pas l'eau ni le sable.</li>
<li><strong>En ville</strong> — Design épuré qui s'associe avec jeans, shorts ou tenues décontractées.</li>
</ul>
<h4>Entretien simplifié</h4>
<p>Un simple rinçage à l'eau suffit pour retrouver leur éclat. Le matériau EVA ne déforme pas et résiste à l'usure quotidienne.</p>`,
    description_en:
      `<h3>The summer icon — reimagined in cream beige</h3>
<p>Since the 1970s, <strong>Adidas Adilette</strong> slides have defined casual comfort. This exclusive <strong>cream beige</strong> edition brings a touch of understated elegance to a timeless classic.</p>
<h4>Cloudfoam Technology</h4>
<p>Every step becomes a pleasure thanks to Adidas's exclusive <strong>Cloudfoam</strong> sole. This ultra-light foam absorbs shock and molds to your foot for personalized comfort from the very first wear.</p>
<h4>Total versatility</h4>
<ul>
<li><strong>At home</strong> — Soft, quiet sole on all floor types.</li>
<li><strong>At the beach</strong> — Hydrophobic EVA that doesn't retain water or sand.</li>
<li><strong>In the city</strong> — Clean design that pairs with jeans, shorts, or casual outfits.</li>
</ul>
<h4>Effortless care</h4>
<p>A simple rinse with water is enough to restore their shine. EVA material doesn't deform and withstands daily wear.</p>`,
    description_ar:
      `<h3>أيقونة الصيف — بلون بيج كريمي جديد</h3>
<p>منذ السبعينيات، تحدد شباشب <strong>أديداس أديليت</strong> معنى الراحة غير الرسمية. تجلب هذه النسخة الحصرية بلون <strong>البيج الكريمي</strong> لمسة من الأناقة الهادئة إلى كلاسيكية خالدة.</p>
<h4>تقنية كلاود فوم</h4>
<p>يصبح كل خطوة متعة بفضل نعل <strong>كلاود فوم</strong> الحصري من أديداس. تمتص هذه الرغوة فائقة الخفة الصدمات وتتشكل حسب قدمك لراحة مخصصة من أول ارتداء.</p>
<h4>تعدد الاستخدامات</h4>
<ul>
<li><strong>في المنزل</strong> — نعل ناعم وهادئ على جميع أنواع الأرضيات.</li>
<li><strong>في الشاطئ</strong> — EVA مقاوم للماء لا يحتفظ بالماء أو الرمال.</li>
<li><strong>في المدينة</strong> — تصميم أنيق يناسب الجينز والشورت والملابس غير الرسمية.</li>
</ul>
<h4>عناية سهلة</h4>
<p>شطف بسيط بالماء يكفي لاستعادة بريقها. مادة EVA لا تتشكل وتتحمل الاستخدام اليومي.</p>`,
    features_fr: [
      'Semelle Cloudfoam™ — amorti ultra-léger et personnalisé',
      'Mousse EVA hydrophobe et résistante à l\'usure',
      'Design minimaliste beige crème — tendance et intemporel',
      'Semelle sculptée anti-dérapante sur surfaces humides',
      'Entretien simplifié : un rinçage suffit',
    ],
    features_en: [
      'Cloudfoam™ sole — ultra-light, personalized cushioning',
      'Hydrophobic EVA foam resistant to wear',
      'Minimalist cream beige design — trendy yet timeless',
      'Sculpted non-slip sole for wet surfaces',
      'Easy care: a quick rinse is all it takes',
    ],
    features_ar: [
      'نعل كلاود فوم™ — ت cushioning فائقة الخفة ومخصصة',
      'رغوة EVA مقاومة للماء والتآكل',
      'تصميم بيج كريمي بسيط — عصري وخالد',
      'نعل منحوت مضاد للانزلاق على الأسطح الرطبة',
      'عناية سهلة: شطف سريع يكفي',
    ],
    price: 349,
    compare_at_price: 549,
    sku: 'MODE-CLAQ-004',
    stock_quantity: 28,
  },
  {
    slug: 'robe-fleurie-rose-bardot',
    folder: 'fake data/5',
    subFolders: [],
    categorySlug: 'mode',
    rowSlug: 'promos',
    title_fr: 'Robe Fleurie Rose — Style Bardot',
    title_en: 'Pink Floral Dress — Bardot Style',
    title_ar: 'فستان وردي مزهر — طراز باردو',
    short_fr: 'Épaules dénudées, manches bouffantes et coupe évasée.',
    short_en: 'Off-shoulder, puff sleeves and flared fit.',
    short_ar: 'أكتاف مكشوفة، أكمام منتفخة وقصة واسعة.',
    description_fr:
      `<h3>La robe de l'été — Élégance bohème et légèreté</h3>
<p>Imaginez un <strong>soirée d'été</strong> au bord de la mer, un verre à la main, la brise légère caressant vos épaules... Cette robe <strong>bardot fleurie</strong> est conçue exactement pour ces moments magiques.</p>
<h4>Détails qui font la différence</h4>
<ul>
<li><strong>Décolleté bardot</strong> — Met subtilement vos épaules et votre décolleté en valeur, élégant sans être provoquant.</li>
<li><strong>Manches bouffantes</strong> — Ajoutent une touche romantique et vintage qui flatte tous les types de bras.</li>
<li><strong>Coupe évasée</strong> — Effet « ventre plat » garanti, confortable même après un délicieux dîner.</li>
</ul>
<h4>Tissu premium</h4>
<p>Le mélange <strong>coton-viscose</strong> est doux comme une seconde peau, ultra-respirant même à 35°C, et tombe gracieusement sans froisser. L'imprimé floral délicat sur fond rose poudré est à la fois tendance et intemporel.</p>
<h4>Conseil style</h4>
<p>Portez-la avec des sandales plates pour un look décontracté, ou des talons compensés pour une soirée chic. Ajoutez une ceinture fine pour accentuer la taille.</p>`,
    description_en:
      `<h3>The summer dress — Bohemian elegance and lightness</h3>
<p>Imagine a <strong>summer evening</strong> by the sea, drink in hand, the gentle breeze caressing your shoulders... This <strong>floral bardot dress</strong> is designed exactly for those magical moments.</p>
<h4>Details that make the difference</h4>
<ul>
<li><strong>Bardot neckline</strong> — Subtly highlights your shoulders and décolleté, elegant without being revealing.</li>
<li><strong>Puff sleeves</strong> — Add a romantic, vintage touch that flatters all arm types.</li>
<li><strong>Flared fit</strong> — Guaranteed "flat tummy" effect, comfortable even after a delicious dinner.</li>
</ul>
<h4>Premium fabric</h4>
<p>The <strong>cotton-viscose blend</strong> feels like a second skin, ultra-breathable even at 35°C, and drapes gracefully without wrinkling. The delicate floral print on a powder pink background is both trendy and timeless.</p>
<h4>Style tip</h4>
<p>Wear with flat sandals for a casual look, or wedge heels for a chic evening. Add a thin belt to accentuate the waist.</p>`,
    description_ar:
      `<h3>فستان الصيف — أناقة بوهيمية وخفة</h3>
<p>تخيل <strong>مساء صيفياً</strong> بجانب البحر، كأس في يدك، نسيم خفيف يلمس كتفيك... هذا الفستان <strong>الوردي المزهر باردو</strong> مصمم بالضبط لتلك اللحظات الساحرة.</p>
<h4>تفاصيل تحدث الفرق</h4>
<ul>
<li><strong>عنق باردو</strong> — يبرز كتفيك وصدرك بأناقة دون مبالغة.</li>
<li><strong>أكمام منتفخة</strong> — تضيف لمسة رومانسية وفينتاج تلائم جميع أنواع الذراعين.</li>
<li><strong>قصة واسعة</strong> — تأثير "بطن مسطح" مضمون، مريح حتى بعد عشاء شهي.</li>
</ul>
<h4>قماش ممتاز</h4>
<p>المزيج <strong>القطن-فيسكوز</strong> ناعم كالبشرة الثانية، فائق التهوية حتى عند 35 درجة، ويتدلى بأناقة دون تجعد. الطباعة الزهرية الرقيقة على خلفية وردية فاتحة عصرية وخالدة في آن واحد.</p>
<h4>نصيحة الأناقة</h4>
<p>ارتدِه مع صنادل مسطحة لمظهر غير رسمي، أو كعوب عالية لسهرة أنيقة. أضيفي حزاماً رفيعاً لتعزيز الخصر.</p>`,
    features_fr: [
      'Décolleté bardot épaules dénudées — élégance féminine',
      'Manches bouffantes courtes — touche romantique vintage',
      'Coupe évasée flatteuse — confort et style',
      'Tissu coton-viscose léger, respirant et anti-froisse',
      'Imprimé floral délicat sur rose poudré',
    ],
    features_en: [
      'Bardot off-shoulder neckline — feminine elegance',
      'Short puff sleeves — romantic vintage touch',
      'Flattering flared fit — comfort and style',
      'Light cotton-viscose fabric, breathable and wrinkle-resistant',
      'Delicate floral print on powder pink',
    ],
    features_ar: [
      'عنق باردو بأكتاف مكشوفة — أناقة أنثوية',
      'أكمام منتفخة قصيرة — لمسة رومانسية فينتاج',
      'قصة واسعة جذابة — راحة وأناقة',
      'قماش قطن-فيسكوز خفيف، قابل للتنفس ومضاد للتجعد',
      'طباعة زهرية رقيقة على وردي فاتح',
    ],
    price: 399,
    compare_at_price: 599,
    sku: 'MODE-ROBE-005',
    stock_quantity: 18,
  },
  {
    slug: 'capteur-arbre-cames-gm-chevrolet',
    folder: 'fake data/6',
    subFolders: [],
    categorySlug: 'pieces-auto',
    rowSlug: 'promos',
    title_fr: 'Capteur Position Arbre à Cames GM — Réf 96325867',
    title_en: 'GM Camshaft Position Sensor — Part 96325867',
    title_ar: 'مستشعر عمود الكامات جي ام — رقم 96325867',
    short_fr: 'Pièce d\'origine GM/Chevrolet, capteur CMP neuf et testé.',
    short_en: 'Genuine GM/Chevrolet part, new and tested CMP sensor.',
    short_ar: 'قطعة أصلية جي ام/شيفروليه، مستشعر CMP جديد ومختبر.',
    description_fr:
      `<h3>Fiabilité OEM pour votre moteur GM</h3>
<p>Le <strong>capteur de position d'arbre à cames (CMP)</strong> est un composant critique de l'injection électronique. Il informe le calculateur moteur de la position exacte de l'arbre à cames pour une <strong>injection et une ignition parfaitement synchronisées</strong>. Un capteur défaillant = démarrage difficile, ralenti instable, perte de puissance et surconsommation.</p>
<h4>Pourquoi choisir cette pièce ?</h4>
<ul>
<li><strong>OEM General Motors</strong> — Mêmes spécifications que la pièce montée en usine. Pas de compromis sur la qualité.</li>
<li><strong>Référence constructeur 96325867</strong> — Compatible avec Chevrolet Aveo, Kalos, Lacetti et de nombreux modèles GM.</li>
<li><strong>Testé 100% électroniquement</strong> — Chaque capteur est vérifié sur banc d'essai avant expédition. Zéro défaut toléré.</li>
</ul>
<h4>Spécifications techniques</h4>
<p>Type : Capteur à effet Hall | Tension : 5V | Connecteur : 3 broches | Matériau : Plastique technique résistant à la chaleur moteur (jusqu'à 150°C) | Origine : Corée du Sud</p>`,
    description_en:
      `<h3>OEM reliability for your GM engine</h3>
<p>The <strong>camshaft position sensor (CMP)</strong> is a critical component of electronic fuel injection. It informs the engine control unit of the exact camshaft position for <strong>perfectly synchronized injection and ignition</strong>. A failing sensor = hard starts, unstable idle, power loss, and increased fuel consumption.</p>
<h4>Why choose this part?</h4>
<ul>
<li><strong>OEM General Motors</strong> — Same specifications as the factory-installed part. No compromise on quality.</li>
<li><strong>Manufacturer reference 96325867</strong> — Compatible with Chevrolet Aveo, Kalos, Lacetti and many other GM models.</li>
<li><strong>100% electronically tested</strong> — Every sensor is verified on a test bench before shipping. Zero defects tolerated.</li>
</ul>
<h4>Technical specifications</h4>
<p>Type: Hall effect sensor | Voltage: 5V | Connector: 3-pin | Material: Technical plastic resistant to engine heat (up to 150°C) | Origin: South Korea</p>`,
    description_ar:
      `<h3>موثوقية OEM لمحرك جي ام الخاص بك</h3>
<p>يعتبر <strong>مستشعر عمود الكامات (CMP)</strong> مكوناً حاسماً في حقن الوقود الإلكتروني. يخبر وحدة التحكم في المحرك بموقع عمود الكامات الدقيق لتحقيق <strong>حقن وإشعال متزامنين تماماً</strong>. مستشعر معطل = صعوبة في التشغيل، دوران غير مستقر، فقدان الطاقة، وزيادة استهلاك الوقود.</p>
<h4>لماذا تختار هذه القطعة؟</h4>
<ul>
<li><strong>OEM جنرال موتورز</strong> — نفس المواصفات كالقطعة المصنعية. لا مساومة على الجودة.</li>
<li><strong>الرقم المرجعي للمصنع 96325867</strong> — متوافق مع شيفروليه أفيو، كالوس، لاسيتي والعديد من طرازات GM الأخرى.</li>
<li><strong>مُختبر 100٪ إلكترونياً</strong> — يتم التحقق من كل مستشعر على منصة اختبار قبل الشحن. لا يُسمح بأي عيوب.</li>
</ul>
<h4>المواصفات الفنية</h4>
<p>النوع: مستشعر تأثير هول | الجهد: 5V | الموصل: 3 دبابيس | المادة: بلاستيك تقني مقاوم لحرارة المحرك (حتى 150 درجة) | الأصل: كوريا الجنوبية</p>`,
    features_fr: [
      'Pièce OEM General Motors — qualité constructeur',
      'Référence 96325867 — compatible Aveo, Kalos, Lacetti',
      'Testé 100% sur banc électronique avant expédition',
      'Capteur à effet Hall 5V — 3 broches',
      'Garantie 6 mois pièce et main-d\'œuvre',
    ],
    features_en: [
      'OEM General Motors part — manufacturer quality',
      'Reference 96325867 — compatible with Aveo, Kalos, Lacetti',
      '100% tested on electronic bench before shipping',
      'Hall effect sensor 5V — 3-pin',
      '6-month parts and labor warranty',
    ],
    features_ar: [
      'قطعة OEM جنرال موتورز — جودة المصنع',
      'الرقم 96325867 — متوافق مع أفيو، كالوس، لاسيتي',
      'مُختبر 100٪ على منصة إلكترونية قبل الشحن',
      'مستشعر تأثير هول 5V — 3 دبابيس',
      'ضمان 6 أشهر على القطعة والعمالة',
    ],
    price: 149,
    compare_at_price: 249,
    sku: 'AUTO-CAPT-006',
    stock_quantity: 35,
  },
  {
    slug: 'tv-samsung-32-hd-smart-tizen',
    folder: 'fake data/7',
    subFolders: ['detailes'],
    categorySlug: 'electromenager',
    rowSlug: 'nouveautes',
    title_fr: 'TV Samsung 32" HD Smart TV — Tizen 2026',
    title_en: 'Samsung 32" HD Smart TV — Tizen 2026',
    title_ar: 'تلفزيون سامسونج 32 بوصة HD سمارت — تايزن 2026',
    short_fr: 'Smart TV HD, WiFi, Netflix, YouTube, HDR10+ et support mural offert.',
    short_en: 'HD Smart TV, WiFi, Netflix, YouTube, HDR10+ with free wall mount.',
    short_ar: 'تلفزيون سمارت HD، واي فاي، نتفليكس، يوتيوب، HDR10+ مع حامل حائط مجاني.',
    description_fr:
      `<h3>Le cœur connecté de votre salon</h3>
<p>La <strong>Samsung 32" HD Smart TV</strong> n'est pas qu'un téléviseur — c'est votre <strong>portail vers un univers de divertissement illimité</strong>. Que vous soyez cinéphile, gamer occasionnel ou amateur de séries, cette TV transforme chaque soirée en expérience immersive.</p>
<h4>Image qui vous captive</h4>
<p>La technologie <strong>HDR10+</strong> analyse chaque scène image par image pour ajuster luminosité et contraste en temps réel. Résultat : des noirs plus profonds, des blancs plus éclatants, et des détails visibles même dans les scènes les plus sombres. La résolution HD (1366×768) sur 32 pouces offre une densité de pixels optimale pour une netteté impressionnante à cette taille.</p>
<h4>Smart TV Tizen — tout en un</h4>
<ul>
<li><strong>Streaming</strong> — Netflix, YouTube, Disney+, Shahid, Amazon Prime Video préinstallés.</li>
<li><strong>Screen Mirroring</strong> — Projettez l'écran de votre smartphone Android ou iPhone en un clic.</li>
<li><strong>WiFi intégré</strong> — Plus de câbles. Connexion rapide et stable à votre box internet.</li>
</ul>
<h4>Cadeau inclus</h4>
<p>Un <strong>support mural universel</strong> est inclus gratuitement. Fixez votre TV au mur pour libérer de l'espace et créer un look moderne et épuré.</p>`,
    description_en:
      `<h3>The connected heart of your living room</h3>
<p>The <strong>Samsung 32" HD Smart TV</strong> isn't just a television — it's your <strong>gateway to unlimited entertainment</strong>. Whether you're a movie buff, casual gamer, or series enthusiast, this TV turns every evening into an immersive experience.</p>
<h4>Picture that captivates</h4>
<p><strong>HDR10+</strong> technology analyzes each scene frame by frame to adjust brightness and contrast in real time. Result: deeper blacks, brighter whites, and visible details even in the darkest scenes. HD resolution (1366×768) on 32 inches offers optimal pixel density for impressive sharpness at this size.</p>
<h4>Smart TV Tizen — all in one</h4>
<ul>
<li><strong>Streaming</strong> — Netflix, YouTube, Disney+, Shahid, Amazon Prime Video pre-installed.</li>
<li><strong>Screen Mirroring</strong> — Project your Android or iPhone screen with one click.</li>
<li><strong>Built-in WiFi</strong> — No more cables. Fast, stable connection to your internet router.</li>
</ul>
<h4>Free gift included</h4>
<p>A <strong>universal wall mount</strong> is included for free. Mount your TV on the wall to free up space and create a modern, clean look.</p>`,
    description_ar:
      `<h3>قلب غرفة معيشتك المتصل</h3>
<p>التلفزيون <strong>الذكي سامسونج 32 بوصة HD</strong> ليس مجرد تلفزيون — إنه <strong>بوابتك نحو عالم من الترفيه غير المحدود</strong>. سواء كنت من عشاق السينما، لاعباً عرضياً، أو محباً للمسلسلات، يحول هذا التلفزيون كل مساء إلى تجربة غامرة.</p>
<h4>صورة تأسرك</h4>
<p>تقنية <strong>HDR10+</strong> تحلل كل مشهد إطاراً بإطار لتعديل السطوع والتباين في الوقت الفعلي. النتيجة: أسود أعمق، أبيض أكثر إشراقاً، وتفاصيل مرئية حتى في أحلك المشاهد. دقة HD (1366×768) على 32 بوصة توفر كثافة بكسل مثالية لوضوح مثير للإعجاب بهذا الحجم.</p>
<h4>سمارت TV تايزن — الكل في واحد</h4>
<ul>
<li><strong>البث المباشر</strong> — نتفليكس، يوتيوب، ديزني+، شاهد، أمازون برايم فيديو مثبتة مسبقاً.</li>
<li><strong>مرآة الشاشة</strong> — انعكس شاشة هاتفك الأندرويد أو آيفون بنقرة واحدة.</li>
<li><strong>واي فاي مدمج</strong> — لا مزيد من الأسلاك. اتصال سريع ومستقر بجهاز التوجيه.</li>
</ul>
<h4>هدية مجانية مضمنة</h4>
<p>يتضمن <strong>حامل حائط عالمي</strong> مجاناً. ثبت تلفزيونك على الحائط لتوفير المساحة وخلق مظهر عصري وأنيق.</p>`,
    features_fr: [
      'Écran 32" HD 1366×768 avec HDR10+ dynamique',
      'Smart TV Tizen 2026 — interface fluide et intuitive',
      'WiFi intégré + Screen Mirroring (Android & iOS)',
      'Netflix, YouTube, Disney+, Shahid préinstallés',
      'Support mural universel inclus gratuitement',
    ],
    features_en: [
      '32" HD 1366×768 screen with dynamic HDR10+',
      'Tizen 2026 Smart TV — smooth, intuitive interface',
      'Built-in WiFi + Screen Mirroring (Android & iOS)',
      'Netflix, YouTube, Disney+, Shahid pre-installed',
      'Universal wall mount included for free',
    ],
    features_ar: [
      'شاشة 32 بوصة HD 1366×768 مع HDR10+ ديناميكي',
      'سمارت TV تايزن 2026 — واجهة سلسة وبديهية',
      'واي فاي مدمج + مرآة الشاشة (أندرويد وiOS)',
      'نتفليكس، يوتيوب، ديزني+، شاهد مثبتة مسبقاً',
      'حامل حائط عالمي مضمن مجاناً',
    ],
    price: 1899,
    compare_at_price: 2499,
    sku: 'ELEC-TV-007',
    stock_quantity: 12,
  },
  {
    slug: 'pc-hp-prodesk-400-i5-remis-a-neuf',
    folder: 'fake data/8',
    subFolders: [],
    categorySlug: 'electronique',
    rowSlug: 'nouveautes',
    title_fr: 'PC HP ProDesk 400 — i5, 16Go RAM, 256Go SSD, Windows 10',
    title_en: 'HP ProDesk 400 Desktop — i5, 16GB RAM, 256GB SSD, Windows 10',
    title_ar: 'كمبيوتر HP ProDesk 400 — i5، 16 جيجا رام، 256 جيجا SSD، ويندوز 10',
    short_fr: 'Unité centrale remise à neuf, performante et fiable pour bureau ou maison.',
    short_en: 'Refurbished desktop tower, powerful and reliable for office or home.',
    short_ar: 'برج كمبيوتر مجدد، قوي وموثوق للمكتب أو المنزل.',
    description_fr:
      `<h3>Performance pro à prix réduit — Remis à neuf certifié</h3>
<p>Pourquoi payer le prix fort quand vous pouvez avoir une <strong>machine fiable et performante</strong> pour une fraction du coût ? Ce HP ProDesk 400 a été <strong>entièrement remis à neuf</strong> par nos techniciens qualifiés : nettoyage complet, remplacement des composants usés, tests de stress 48h, et réinstallation propre de Windows 10 Pro.</p>
<h4>Des performances qui tiennent la route</h4>
<ul>
<li><strong>Intel Core i5 4ème génération</strong> — 4 cœurs physiques qui gèrent sans effort la bureautique, le multitâche et même le montage vidéo léger.</li>
<li><strong>16 Go de RAM DDR3</strong> — Ouvrez 30 onglets Chrome, Excel, PowerPoint et Teams simultanément sans ralentissement.</li>
<li><strong>SSD 256 Go</strong> — Démarrage de Windows en 15 secondes chrono. Applications qui s'ouvrent instantanément.</li>
</ul>
<h4>Prêt à l'emploi dès la sortie du carton</h4>
<p>Windows 10 Pro est <strong>préinstallé, activé et mis à jour</strong>. Pas de configuration compliquée. Branchez, allumez, travaillez. Le clavier et la souris HP d'origine sont inclus pour un setup complet immédiat.</p>
<h4>Garantie tranquillité</h4>
<p><strong>12 mois de garantie pièces et main-d'œuvre</strong>. En cas de problème, nous remplaçons ou réparons gratuitement. Vous achetez l'esprit tranquille.</p>`,
    description_en:
      `<h3>Pro performance at a reduced price — Certified refurbished</h3>
<p>Why pay full price when you can get a <strong>reliable, high-performance machine</strong> for a fraction of the cost? This HP ProDesk 400 has been <strong>fully refurbished</strong> by our qualified technicians: complete cleaning, replacement of worn components, 48-hour stress testing, and clean reinstallation of Windows 10 Pro.</p>
<h4>Performance that holds up</h4>
<ul>
<li><strong>4th-gen Intel Core i5</strong> — 4 physical cores that effortlessly handle office work, multitasking, and even light video editing.</li>
<li><strong>16GB DDR3 RAM</strong> — Open 30 Chrome tabs, Excel, PowerPoint, and Teams simultaneously without slowdown.</li>
<li><strong>256GB SSD</strong> — Windows boots in 15 seconds flat. Applications open instantly.</li>
</ul>
<h4>Ready to use right out of the box</h4>
<p>Windows 10 Pro is <strong>pre-installed, activated, and updated</strong>. No complicated setup. Plug in, power on, get to work. The original HP keyboard and mouse are included for an immediate complete setup.</p>
<h4>Peace-of-mind warranty</h4>
<p><strong>12 months parts and labor warranty</strong>. If anything goes wrong, we replace or repair free of charge. Buy with confidence.</p>`,
    description_ar:
      `<h3>أداء احترافي بسعر مخفض — مجدد معتمد</h3>
<p>لماذا تدفع السعر الكامل عندما يمكنك الحصول على <strong>آلة موثوقة وعالية الأداء</strong> بجزء بسيط من التكلفة؟ تم <strong>تجديد هذا HP ProDesk 400 بالكامل</strong> بواسطة فنيينا المؤهلين: تنظيف شامل، استبدال المكونات البالية، اختبار stress لمدة 48 ساعة، وإعادة تثبيت نظيفة لويندوز 10 برو.</p>
<h4>أداء يصمد أمام الاختبار</h4>
<ul>
<li><strong>Intel Core i5 الجيل الرابع</strong> — 4 أنوية فيزيائية تتعامل بسهولة مع العمل المكتبي، وتعدد المهام، وحتى المونتاج الخفيف.</li>
<li><strong>16 جيجا رام DDR3</strong> — افتح 30 تبويباً في كروم، وإكسل، وبوربوينت، وتيمز في آن واحد دون تباطؤ.</li>
<li><strong>SSD 256 جيجا</strong> — إقلاع ويندوز في 15 ثانية فقط. التطبيقات تفتح فوراً.</li>
</ul>
<h4>جاهز للاستخدام فوراً</h4>
<p>ويندوز 10 برو <strong>مثبت، مفعل، ومحدث</strong>. لا إعداد معقد. وصل، شغل، اعمل. لوحة المفاتيح والماوس HP الأصلية مضمنة لإعداد كامل فوري.</p>
<h4>ضمان راحة البال</h4>
<p><strong>12 شهراً ضمان على القطعة والعمالة</strong>. في حال حدوث أي مشكلة، نستبدل أو نصلح مجاناً. اشترِ بثقة.</p>`,
    features_fr: [
      'Intel Core i5 4ème gen — 4 cœurs, bureautique et multitâche fluide',
      '16 Go RAM DDR3 — multitâche intensif sans ralentissement',
      'SSD 256 Go — démarrage 15s, applications instantanées',
      'Windows 10 Pro préinstallé, activé et à jour',
      'Remis à neuf certifié + clavier/souris HP + garantie 12 mois',
    ],
    features_en: [
      'Intel Core i5 4th gen — 4 cores, smooth office work & multitasking',
      '16GB DDR3 RAM — intensive multitasking without slowdown',
      '256GB SSD — 15s boot, instant app launches',
      'Windows 10 Pro pre-installed, activated, and updated',
      'Certified refurbished + HP keyboard/mouse + 12-month warranty',
    ],
    features_ar: [
      'Intel Core i5 الجيل الرابع — 4 أنوية، عمل مكتبي وتعدد مهام سلس',
      '16 جيجا رام DDR3 — تعدد مهام مكثف دون تباطؤ',
      'SSD 256 جيجا — إقلاع 15 ثانية، تطبيقات فورية',
      'ويندوز 10 برو مثبت، مفعل، ومحدث',
      'مجدد معتمد + لوحة مفاتيح/ماوس HP + ضمان 12 شهراً',
    ],
    price: 2299,
    compare_at_price: 3299,
    sku: 'ELEC-PC-008',
    stock_quantity: 8,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 Seeding fake products from "fake data/" folders...\n');

  // ─── Categories ────────────────────────────────────────────────────────
  console.log('📂 Creating categories...');
  const categoryIdMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .single();

    if (existing) {
      console.log(`   ⏭️  Category "${cat.slug}" already exists`);
      categoryIdMap.set(cat.slug, existing.id);
      continue;
    }

    const { data, error } = await supabase.from('categories').insert(cat).select().single();
    if (error) {
      console.error(`   ❌ Failed to create category "${cat.slug}":`, error.message);
      continue;
    }
    console.log(`   ✅ Category "${cat.slug}" → ${data.id}`);
    categoryIdMap.set(cat.slug, data.id);
  }

  // ─── Product Rows ──────────────────────────────────────────────────────
  console.log('\n📦 Creating product rows...');
  const rowIdMap = new Map<string, string>();
  for (const row of PRODUCT_ROWS) {
    const { data: existing } = await supabase
      .from('product_rows')
      .select('id')
      .eq('slug', row.slug)
      .single();

    if (existing) {
      console.log(`   ⏭️  Row "${row.slug}" already exists`);
      rowIdMap.set(row.slug, existing.id);
      continue;
    }

    const { data, error } = await supabase.from('product_rows').insert(row).select().single();
    if (error) {
      console.error(`   ❌ Failed to create row "${row.slug}":`, error.message);
      continue;
    }
    console.log(`   ✅ Row "${row.slug}" → ${data.id}`);
    rowIdMap.set(row.slug, data.id);
  }

  // ─── Products + Images ─────────────────────────────────────────────────
  console.log('\n🛍️  Creating products and uploading images...');
  for (const prod of PRODUCTS) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', prod.slug)
      .single();

    if (existing) {
      console.log(`   📝 Updating "${prod.slug}"...`);
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title_fr: prod.title_fr,
          title_en: prod.title_en,
          title_ar: prod.title_ar,
          short_description_fr: prod.short_fr,
          short_description_en: prod.short_en,
          short_description_ar: prod.short_ar,
          description_fr: prod.description_fr,
          description_en: prod.description_en,
          description_ar: prod.description_ar,
          price: prod.price,
          compare_at_price: prod.compare_at_price,
          attributes: {
            features_fr: prod.features_fr,
            features_en: prod.features_en,
            features_ar: prod.features_ar,
          },
        })
        .eq('slug', prod.slug);

      if (updateError) {
        console.error(`   ❌ Failed to update "${prod.slug}":`, updateError.message);
      } else {
        console.log(`   ✅ Updated "${prod.slug}"`);
      }
      continue;
    }

    // Collect all image files
    const imagePaths: string[] = [];
    for (const sub of prod.subFolders) {
      imagePaths.push(...getImageFiles(join(prod.folder, sub)));
    }
    // Also check root folder for images
    imagePaths.push(...getImageFiles(prod.folder));
    // Deduplicate by basename
    const seen = new Set<string>();
    const uniquePaths = imagePaths.filter((p) => {
      const b = basename(p);
      if (seen.has(b)) return false;
      seen.add(b);
      return true;
    });

    if (uniquePaths.length === 0) {
      console.warn(`   ⚠️  No images found for "${prod.slug}" in ${prod.folder}`);
    }

    // Upload images
    const uploadedUrls: { url: string; isPrimary: boolean }[] = [];
    for (let i = 0; i < uniquePaths.length; i++) {
      const path = uniquePaths[i];
      const fileName = `${prod.slug}/${Date.now()}-${i}.${basename(path).split('.').pop()}`;
      try {
        const url = await uploadLocalFile(path, 'product-images', fileName);
        uploadedUrls.push({ url, isPrimary: i === 0 });
        console.log(`      📤 ${basename(path)}`);
      } catch (err) {
        console.error(`      ❌ Upload failed for ${basename(path)}:`, (err as Error).message);
      }
    }

    // Insert product
    const categoryId = categoryIdMap.get(prod.categorySlug);
    const rowId = prod.rowSlug ? rowIdMap.get(prod.rowSlug) : null;

    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        slug: prod.slug,
        title_fr: prod.title_fr,
        title_en: prod.title_en,
        title_ar: prod.title_ar,
        short_description_fr: prod.short_fr,
        short_description_en: prod.short_en,
        short_description_ar: prod.short_ar,
        description_fr: prod.description_fr,
        description_en: prod.description_en,
        description_ar: prod.description_ar,
        price: prod.price,
        compare_at_price: prod.compare_at_price,
        currency: 'MAD',
        category_id: categoryId || null,
        product_row_id: rowId || null,
        sku: prod.sku,
        stock_quantity: prod.stock_quantity,
        track_inventory: true,
        low_stock_threshold: 5,
        is_active: true,
        is_featured: false,
        attributes: {
          features_fr: prod.features_fr,
          features_en: prod.features_en,
          features_ar: prod.features_ar,
        },
      })
      .select()
      .single();

    if (productError) {
      console.error(`   ❌ Failed to create product "${prod.slug}":`, productError.message);
      continue;
    }

    console.log(`   ✅ Product "${prod.slug}" → ${productData.id}`);

    // Insert product images
    if (uploadedUrls.length > 0) {
      const imageRows = uploadedUrls.map((img, i) => ({
        product_id: productData.id,
        url: img.url,
        alt_text: `${prod.title_fr} — image ${i + 1}`,
        display_order: i,
        is_primary: img.isPrimary,
      }));

      const { error: imgError } = await supabase.from('product_images').insert(imageRows);
      if (imgError) {
        console.error(`   ❌ Failed to link images for "${prod.slug}":`, imgError.message);
      } else {
        console.log(`      🖼️  ${uploadedUrls.length} image(s) linked`);
      }
    }
  }

  console.log('\n🎉 Done! Reload the site to see the new products.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

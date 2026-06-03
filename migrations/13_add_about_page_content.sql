-- About page content management
CREATE TABLE about_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('story', 'values', 'cta')),
  key TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  content_fr TEXT NOT NULL,
  content_en TEXT,
  content_ar TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with general marketplace content (French)
INSERT INTO about_page_content (section, key, order_index, content_fr, content_en, content_ar) VALUES
  ('story', 'paragraph_1', 1,
   'Bienvenue chez {siteName}, votre marketplace en ligne où vous trouverez tout ce dont vous avez besoin au quotidien. Depuis 2018, nous mettons notre énergie à vous offrir une expérience d''achat simple, rapide et fiable — de la mode aux produits électroniques, en passant par la décoration, les accessoires et bien plus encore.',
   'Welcome to {siteName}, your online marketplace where you can find everything you need for everyday life. Since 2018, we have been dedicated to offering you a simple, fast, and reliable shopping experience — from fashion and electronics to home décor, accessories, and much more.',
   'مرحبًا بكم في {siteName}، سوقكم الإلكتروني حيث تجدون كل ما تحتاجونه في حياتكم اليومية. منذ عام 2018، نكرس جهودنا لتقديم تجربة تسوق بسيطة وسريعة وموثوقة — من الأزياء والإلكترونيات إلى الديكور والإكسسوارات وغير ذلك الكثير.'
  ),
  ('story', 'paragraph_2', 2,
   'Notre mission est simple : réunir en un seul endroit une large sélection de produits de qualité, aux meilleurs prix, avec une livraison rapide partout au Maroc. Nous travaillons directement avec des vendeurs et des fournisseurs de confiance pour vous garantir des articles soigneusement sélectionnés.',
   'Our mission is simple: to bring together a wide selection of quality products at the best prices, with fast delivery across Morocco. We work directly with trusted sellers and suppliers to ensure carefully selected items for you.',
   'مهمتنا بسيطة: توفير تشكيلة واسعة من المنتجات عالية الجودة بأفضل الأسعار، مع توصيل سريع إلى جميع أنحاء المغرب. نعمل مباشرة مع بائعين وموردين موثوقين لنضمن لكم منتجات مختارة بعناية.'
  ),
  ('story', 'paragraph_3', 3,
   'Chez {siteName}, nous croyons que le commerce en ligne doit être accessible à tous. C''est pourquoi nous offrons le paiement à la livraison, une livraison en 24 à 48 heures, et une garantie satisfait ou remboursé de 7 jours. Votre confiance est notre priorité.',
   'At {siteName}, we believe online shopping should be accessible to everyone. That is why we offer cash on delivery, 24 to 48 hour delivery, and a 7-day satisfaction or refund guarantee. Your trust is our priority.',
   'في {siteName}، نؤمن بأن التسوق عبر الإنترنت يجب أن يكون في متناول الجميع. لهذا السبب نقدم الدفع عند الاستلام، والتوصيل خلال 24 إلى 48 ساعة، وضمان استعادة الأموال خلال 7 أيام. ثقتكم هي أولويتنا.'
  ),
  ('story', 'paragraph_4', 4,
   'Notre promesse est simple : vous offrir le meilleur du shopping en ligne au Maroc. Une plateforme fiable, des prix compétitifs, et un service client à votre écoute à chaque étape de votre commande.',
   'Our promise is simple: to offer you the best online shopping experience in Morocco. A reliable platform, competitive prices, and customer service that listens to you at every step of your order.',
   'وعدنا بسيط: أن نقدم لكم أفضل تجربة تسوق إلكتروني في المغرب. منصة موثوقة، وأسعار تنافسية، وخدمة عملاء تستمع إليكم في كل خطوة من طلباتكم.'
  ),
  ('values', 'value_1', 1, 'Produits soigneusement sélectionnés', 'Carefully selected products', 'منتجات مختارة بعناية'),
  ('values', 'value_2', 2, 'Prix compétitifs sans intermédiaires', 'Competitive prices with no middlemen', 'أسعار تنافسية بدون وسطاء'),
  ('values', 'value_3', 3, 'Livraison rapide 24-48h partout au Maroc', 'Fast 24-48h delivery across Morocco', 'توصيل سريع 24-48 ساعة في جميع أنحاء المغرب'),
  ('values', 'value_4', 4, 'Paiement à la livraison', 'Cash on delivery', 'الدفع عند الاستلام'),
  ('values', 'value_5', 5, 'Garantie satisfait ou remboursé 7 jours', '7-day satisfaction or refund guarantee', 'ضمان استعادة الأموال خلال 7 أيام'),
  ('cta', 'title', 1, 'Découvrez nos produits', 'Discover our products', 'اكتشف منتجاتنا'),
  ('cta', 'subtitle', 2,
   'Parcourez notre catalogue et trouvez tout ce qu''il vous faut, livré rapidement chez vous.',
   'Browse our catalog and find everything you need, delivered quickly to your door.',
   'تصفح كتالوجنا واعثر على كل ما تحتاجه، يُوصّل بسرعة إلى باب منزلك.'
  ),
  ('cta', 'button', 3, 'Voir la collection', 'View collection', 'عرض المجموعة');

-- Enable RLS
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;

-- Staff can manage
CREATE POLICY "Staff can manage about page content"
  ON about_page_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'staff'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'staff'
    )
  );

-- Public can read
CREATE POLICY "Public can read about page content"
  ON about_page_content
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

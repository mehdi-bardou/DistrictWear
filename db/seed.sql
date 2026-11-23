-- Realistic launch catalogue. Photography uses Unsplash URLs until the client
-- supplies studio shots; storage_path is reserved for admin uploads.

insert into public.categories (slug, name_fr, name_ar, name_en, sort_order, is_active)
values
  ('hauts', 'Hauts', 'الأعلى', 'Tops', 1, true),
  ('sweats', 'Sweats', 'السويتس', 'Sweatshirts', 2, true),
  ('manteaux', 'Manteaux', 'المعاطف', 'Outerwear', 3, true),
  ('pantalons', 'Pantalons', 'السراويل', 'Bottoms', 4, true),
  ('accessoires', 'Accessoires', 'الإكسسوارات', 'Accessories', 5, true),
  ('edition-limitee', 'Édition Limitée', 'إصدار محدود', 'Limited Edition', 6, true);

insert into public.collections (slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en, sort_order, is_published)
values
  ('essentiels', 'Les Essentiels', 'الأساسيات', 'The Essentials',
   'Les pièces que vous portez chaque jour, taillées pour durer.',
   'قطع ترتديها كل يوم، مصممة لتدوم.',
   'The pieces you reach for every day, built to last.', 1, true),
  ('armure', 'Armure', 'درع', 'Armour',
   'Des silhouettes fortes, des matieres denses et une allure sans effort.',
   'قصات قوية وخامات كثيفة وإطلالة بلا جهد.',
   'Strong silhouettes, dense fabrics and effortless presence.', 2, true),
  ('atelier', 'Atelier', 'الورشة', 'Atelier',
   'Une série experimentale en petites quantités.',
   'سلسلة تجريبية بكميات صغيرة.',
   'An experimental small-batch series.', 3, false);

insert into public.products (
  slug, name_fr, name_ar, name_en,
  description_fr, description_ar, description_en,
  category_id, collection_id, is_published, is_featured, sort_order
)
select
  v.slug, v.name_fr, v.name_ar, v.name_en,
  v.description_fr, v.description_ar, v.description_en,
  c.id, col.id, true, v.featured, v.ord
from (values
  ('tee-signature', 'T-shirt Signature', 'تيشيرت سيغناتشر', 'Signature Tee',
   'Coton lourd 240 g, coupe droite et finitions renforcees.', 'قطن ثقيل 240 غ، قصة مستقيمة وتشطيبات متينة.',
   'Heavy 240 gsm cotton, regular fit with reinforced finishes.', 'hauts', 'essentiels', true, 1),
  ('hoodie-atlas', 'Hoodie Atlas', 'هودي أطلس', 'Atlas Hoodie',
   'Molleton epais, capuche doublee et poche kangourou.', 'قطن سميك، قبعة مبطنة وجيب كنغري.',
   'Thick fleece, lined hood and kangaroo pocket.', 'sweats', 'essentiels', true, 2),
  ('sweat-creme', 'Sweat Creme', 'سويت كريم', 'Cream Sweatshirt',
   'Une coupe oversize et une texture douce pour tous les jours.', 'قصة واسعة وملمس ناعم للاستخدام اليومي.',
   'An oversized cut and soft texture for everyday wear.', 'sweats', 'essentiels', false, 3),
  ('trench-sable', 'Trench Sable', 'ترينش سابل', 'Sand Trench',
   'Trench longue en toile deconnee, ceinture ajustable.', 'معطف طويل من القماش، حزام قابل للتعديل.',
   'Long cotton trench with an adjustable waist belt.', 'manteaux', 'armure', true, 4),
  ('veste-moto', 'Veste Moto', 'سترة موتو', 'Moto Jacket',
   'Cuir graisse, coupe courte et details zippes.', 'جلد ناعم، قصة قصيرة وتفاصيل بسحابات.',
   'Treated leather, cropped fit and zipped detailing.', 'manteaux', 'armure', true, 5),
  ('jean-cargo', 'Jean Cargo', 'جين كارغو', 'Cargo Jeans',
   'Denim rigide 12 oz, poches cargo et coupe large.', 'دينيم صلب 12 أونصة، جيوب شحن وقصة واسعة.',
   'Rigid 12 oz denim, cargo pockets and a relaxed fit.', 'pantalons', 'armure', false, 6),
  ('jogger-sable', 'Jogger Sable', 'جوغر سابل', 'Sand Joggers',
   'Molleton styling, chevilles resserrees et deux poches laterales.', 'قطن سميك، أسفل ضيق وجيبان جانبيان.',
   'Fleece styling, tapered ankles and two side pockets.', 'pantalons', 'essentiels', true, 7),
  ('chemise-oversize', 'Chemise Oversize', 'قميص أوفرسايز', 'Oversized Shirt',
   'Popeline de coton, col large et manches longues.', 'قماش قطن، ياقة عريضة وأكمام طويلة.',
   'Cotton poplin, wide collar and long sleeves.', 'hauts', 'armure', false, 8),
  ('blazer-nova', 'Blazer Nova', 'بليزر نوفا', 'Nova Blazer',
   'Blazer structure, epaules nettes et doublure legere.', 'بليزر منظم، كتفان حادان وبطانة خفيفة.',
   'Structured blazer with sharp shoulders and light lining.', 'manteaux', 'armure', true, 9),
  ('pull-col-roule', 'Pull Col Roule', 'بولوفر برقبة عالية', 'Roll-Neck Knit',
   'Maille cotelee, col roule et coupe pretee du corps.', 'تريكو مضلع، رقبة عالية وقصة مريحة.',
   'Ribbed knit with a roll neck and an easy fit.', 'sweats', 'essentiels', false, 10),
  ('short-utility', 'Short Utility', 'شورت يوتيليتي', 'Utility Shorts',
   'Toile resistant, longueur au genou et poches fonctionnelles.', 'قماش متين، طول للركبةوجيوب عملية.',
   'Durable canvas, knee length and functional pockets.', 'pantalons', 'essentiels', false, 11),
  ('crop-milano', 'Crop Milano', 'كروب ميلانو', 'Milano Crop Top',
   'Maille stretch, coupe courte et finitions cotelees.', 'تريكو مطاط، قصة قصيرة وتشطيبات مضلعة.',
   'Stretch knit, cropped cut and ribbed finishes.', 'hauts', 'armure', true, 12)
) as v (
  slug, name_fr, name_ar, name_en,
  description_fr, description_ar, description_en,
  category_slug, collection_slug, featured, ord
)
join public.categories c on c.slug = v.category_slug
join public.collections col on col.slug = v.collection_slug;

insert into public.product_variants (
  product_id, sku, color, color_en, color_ar, size, price, stock, sort_order
)
select p.id, v.sku, v.color, v.color_en, v.color_ar, v.size, v.price, v.stock, v.ord
from (values
  ('tee-signature', 'DW-TS-NOI-M', 'Noir', 'Black', 'أسود', 'M', 180.00, 14, 0),
  ('tee-signature', 'DW-TS-BEI-L', 'Beige', 'Beige', 'بيج', 'L', 180.00, 9, 1),
  ('hoodie-atlas', 'DW-HA-VER-M', 'Vert Foret', 'Forest Green', 'أخضر غابي', 'M', 420.00, 7, 0),
  ('hoodie-atlas', 'DW-HA-GRI-L', 'Gris', 'Grey', 'رمادي', 'L', 420.00, 11, 1),
  ('sweat-creme', 'DW-SC-CRE-M', 'Creme', 'Cream', 'كريمي', 'M', 390.00, 6, 0),
  ('sweat-creme', 'DW-SC-NOI-L', 'Noir', 'Black', 'أسود', 'L', 390.00, 8, 1),
  ('trench-sable', 'DW-TS-SAB-M', 'Sable', 'Sand', 'رملي', 'M', 890.00, 4, 0),
  ('trench-sable', 'DW-TS-NOI-L', 'Noir', 'Black', 'أسود', 'L', 890.00, 3, 1),
  ('veste-moto', 'DW-VM-NOI-M', 'Noir', 'Black', 'أسود', 'M', 950.00, 5, 0),
  ('veste-moto', 'DW-VM-BLE-L', 'Bleu Nuit', 'Navy', 'أزرق داكن', 'L', 950.00, 2, 1),
  ('jean-cargo', 'DW-JC-OLI-M', 'Olive', 'Olive', 'زيتي', 'M', 540.00, 12, 0),
  ('jean-cargo', 'DW-JC-NOI-L', 'Noir', 'Black', 'أسود', 'L', 540.00, 10, 1),
  ('jogger-sable', 'DW-JS-SAB-M', 'Sable', 'Sand', 'رملي', 'M', 380.00, 15, 0),
  ('jogger-sable', 'DW-JS-GRI-L', 'Gris', 'Grey', 'رمادي', 'L', 380.00, 13, 1),
  ('chemise-oversize', 'DW-CO-BLA-M', 'Blanc', 'White', 'أبيض', 'M', 340.00, 9, 0),
  ('chemise-oversize', 'DW-CO-BLE-L', 'Bleu Nuit', 'Navy', 'أزرق داكن', 'L', 340.00, 6, 1),
  ('blazer-nova', 'DW-BN-NOI-M', 'Noir', 'Black', 'أسود', 'M', 780.00, 4, 0),
  ('blazer-nova', 'DW-BN-BEI-L', 'Beige', 'Beige', 'بيج', 'L', 780.00, 5, 1),
  ('pull-col-roule', 'DW-PR-CRE-M', 'Creme', 'Cream', 'كريمي', 'M', 450.00, 8, 0),
  ('pull-col-roule', 'DW-PR-VER-L', 'Vert Foret', 'Forest Green', 'أخضر غابي', 'L', 450.00, 7, 1),
  ('short-utility', 'DW-SU-OLI-M', 'Olive', 'Olive', 'زيتي', 'M', 290.00, 16, 0),
  ('short-utility', 'DW-SU-SAB-L', 'Sable', 'Sand', 'رملي', 'L', 290.00, 14, 1),
  ('crop-milano', 'DW-CM-NOI-XS', 'Noir', 'Black', 'أسود', 'XS', 260.00, 10, 0),
  ('crop-milano', 'DW-CM-BEI-S', 'Beige', 'Beige', 'بيج', 'S', 260.00, 12, 1)
) as v (product_slug, sku, color, color_en, color_ar, size, price, stock, ord)
join public.products p on p.slug = v.product_slug;

insert into public.product_images (product_id, external_url, alt_fr, alt_ar, alt_en, sort_order)
select p.id, v.url, v.alt_fr, v.alt_ar, v.alt_en, v.ord
from (values
  ('tee-signature', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=85', 'T-shirt Signature face', 'تيشيرت سيغناتشر من الأمام', 'Signature Tee front', 0),
  ('tee-signature', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=85', 'T-shirt Signature porté', 'تيشيرت سيغناتشر على الموديل', 'Signature Tee worn', 1),
  ('hoodie-atlas', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=85', 'Hoodie Atlas face', 'هودي أطلس من الأمام', 'Atlas Hoodie front', 0),
  ('hoodie-atlas', 'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=1200&q=85', 'Hoodie Atlas dos', 'هودي أطلس من الخلف', 'Atlas Hoodie back', 1),
  ('sweat-creme', 'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=1200&q=85', 'Sweat Creme face', 'سويت كريم من الأمام', 'Cream Sweatshirt front', 0),
  ('sweat-creme', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=85', 'Sweat Creme porté', 'سويت كريم على الموديل', 'Cream Sweatshirt worn', 1),
  ('trench-sable', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=85', 'Trench Sable face', 'ترينش سابل من الأمام', 'Sand Trench front', 0),
  ('trench-sable', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1200&q=85', 'Trench Sable porté', 'ترينش سابل على الموديل', 'Sand Trench worn', 1),
  ('veste-moto', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=85', 'Veste Moto face', 'سترة موتو من الأمام', 'Moto Jacket front', 0),
  ('veste-moto', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1200&q=85', 'Veste Moto detail', 'تفاصيل سترة موتو', 'Moto Jacket detail', 1),
  ('jean-cargo', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=85', 'Jean Cargo face', 'جين كارغو من الأمام', 'Cargo Jeans front', 0),
  ('jean-cargo', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&q=85', 'Jean Cargo detail', 'تفاصيل جين كارغو', 'Cargo Jeans detail', 1),
  ('jogger-sable', 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=1200&q=85', 'Jogger Sable face', 'جوغر سابل من الأمام', 'Sand Joggers front', 0),
  ('jogger-sable', 'https://images.unsplash.com/photo-1506629905607-d9b8a4e5a0f1?w=1200&q=85', 'Jogger Sable porté', 'جوغر سابل على الموديل', 'Sand Joggers worn', 1),
  ('chemise-oversize', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=85', 'Chemise Oversize face', 'قميص أوفرسايز من الأمام', 'Oversized Shirt front', 0),
  ('chemise-oversize', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=85', 'Chemise Oversize detail', 'تفاصيل قميص أوفرسايز', 'Oversized Shirt detail', 1),
  ('blazer-nova', 'https://images.unsplash.com/photo-1591047138459-47a0d70880ff?w=1200&q=85', 'Blazer Nova face', 'بليزر نوفا من الأمام', 'Nova Blazer front', 0),
  ('blazer-nova', 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1200&q=85', 'Blazer Nova porté', 'بليزر نوفا على الموديل', 'Nova Blazer worn', 1),
  ('pull-col-roule', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=85', 'Pull Col Roule face', 'بولوفر برقبة عالية من الأمام', 'Roll-Neck Knit front', 0),
  ('pull-col-roule', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&q=85', 'Pull Col Roule detail', 'تفاصيل البولوفر', 'Roll-Neck Knit detail', 1),
  ('short-utility', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=85', 'Short Utility face', 'شورت يوتيليتي من الأمام', 'Utility Shorts front', 0),
  ('short-utility', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&q=85', 'Short Utility porté', 'شورت يوتيليتي على الموديل', 'Utility Shorts worn', 1),
  ('crop-milano', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&q=85', 'Crop Milano face', 'كروب ميلانو من الأمام', 'Milano Crop Top front', 0),
  ('crop-milano', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=85', 'Crop Milano detail', 'تفاصيل كروب ميلانو', 'Milano Crop Top detail', 1)
) as v (product_slug, url, alt_fr, alt_ar, alt_en, ord)
join public.products p on p.slug = v.product_slug;

update public.settings
set whatsapp_number = '212721919977',
    contact_email = 'contact@districtwear.ma',
    instagram_url = 'https://www.instagram.com/districtwear/',
    inquiry_logging_enabled = false
where id;

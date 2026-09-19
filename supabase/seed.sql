-- seed.sql
-- Sample Seed Data for Tea Shop Management System

-- 1. Sample Shops
INSERT INTO public.shops (id, name, slug, tagline, address, phone, email, gst_number, currency, tax_rate, subscription_status, subscription_end_date)
VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'Chai Craft Artisan Tea Bar',
    'chai-craft-central',
    'Authentic Handcrafted Kulhad Chai & Warm Street Delicacies',
    'Plot 42, Brigade Road, Bangalore, Karnataka - 560001',
    '+91 98765 43210',
    'contact@chaicraft.in',
    '29ABCDE1234F1Z5',
    'INR',
    5.00,
    'ACTIVE',
    NOW() + INTERVAL '365 days'
),
(
    'a2222222-2222-2222-2222-222222222222',
    'Royal Darjeeling Tea Lounge',
    'royal-darjeeling',
    'Estate Picked First Flush & Gourmet Brews',
    'Shop 12, Park Street, Kolkata, West Bengal - 700016',
    '+91 91234 56789',
    'hello@royaldarjeeling.in',
    '19XYZPQ5678M1Z2',
    'INR',
    5.00,
    'ACTIVE',
    NOW() + INTERVAL '180 days'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Sample Categories for Chai Craft
INSERT INTO public.categories (id, shop_id, name, slug, description, sort_order)
VALUES
('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Signature Hot Chai', 'signature-chai', 'Slow-brewed aromatic milk teas with fresh whole spices', 1),
('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Iced Teas & Coolers', 'iced-teas', 'Chilled infusions, fresh fruit syrups, and sparkling teas', 2),
('c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Bun Maska & Bakes', 'bun-maska', 'Freshly baked Irani buns, rich Amul butter, and fruit toasts', 3),
('c4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'Hot Samosas & Snacks', 'hot-snacks', 'Crispy flaky samosas, kachoris, and street-style bites', 4)
ON CONFLICT (shop_id, slug) DO NOTHING;

-- 3. Sample Products
INSERT INTO public.products (id, shop_id, category_id, name, sku, description, base_price, cost_price, preparation_time_minutes, is_available, is_featured)
VALUES
('p1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Masala Kulhad Chai', 'CHAI-MAS-01', 'Rich Assam CTC tea brewed with freshly ground cardamom, ginger, cinnamon, and whole milk, served in an earthy clay kulhad.', 40.00, 12.00, 3, true, true),
('p2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Adrak Elaichi Chai', 'CHAI-ADR-02', 'Invigorating fresh hand-pounded ginger with fragrant green cardamom pods.', 35.00, 10.00, 3, true, true),
('p3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Kashmiri Kahwa', 'CHAI-KHW-03', 'Exotic green tea infused with saffron strands, whole cinnamon, green cardamom, and garnished with slivered almonds.', 65.00, 22.00, 4, true, false),
('p4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'Peach Lemon Iced Tea', 'ICED-PCH-01', 'Crisp cold-brewed black tea shaken with ripe peach nectar and fresh Meyer lemon juice.', 80.00, 25.00, 2, true, true),
('p5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'Classic Bun Maska', 'SNK-BUN-01', 'Warm soft pillowy bun generously slathered with salted Amul butter.', 50.00, 18.00, 2, true, true),
('p6666666-6666-6666-6666-666666666666', 'a1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', 'Punjabi Aloo Samosa (2 pcs)', 'SNK-SAM-01', 'Golden flaky pastry stuffed with spiced potatoes, green peas, and served with tangy tamarind and mint chutneys.', 45.00, 15.00, 3, true, true)
ON CONFLICT (shop_id, sku) DO NOTHING;

-- 4. Product Variants
INSERT INTO public.product_variants (product_id, shop_id, name, price, sku, is_default)
VALUES
('p1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Regular (150ml)', 40.00, 'CHAI-MAS-01-REG', true),
('p1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Clay Kulhad Large (250ml)', 60.00, 'CHAI-MAS-01-LRG', false),
('p1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Sharing Flask (500ml)', 140.00, 'CHAI-MAS-01-FLK', false),
('p2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Cutting (100ml)', 25.00, 'CHAI-ADR-02-CUT', false),
('p2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Regular Cup (160ml)', 35.00, 'CHAI-ADR-02-REG', true)
ON CONFLICT DO NOTHING;

-- 5. Addons
INSERT INTO public.addons (shop_id, name, price, is_available)
VALUES
('a1111111-1111-1111-1111-111111111111', 'Extra Crushed Cardamom (Elaichi)', 10.00, true),
('a1111111-1111-1111-1111-111111111111', 'Fresh Grated Ginger (Adrak)', 10.00, true),
('a1111111-1111-1111-1111-111111111111', 'Pure Organic Jaggery (Gur)', 10.00, true),
('a1111111-1111-1111-1111-111111111111', 'Kashmiri Saffron (Kesar Strands)', 25.00, true),
('a1111111-1111-1111-1111-111111111111', 'Sugar-Free Stevia Drops', 5.00, true),
('a1111111-1111-1111-1111-111111111111', 'Extra Malai (Clotted Cream)', 15.00, true)
ON CONFLICT DO NOTHING;

-- 6. Raw Inventory Items
INSERT INTO public.inventory_items (shop_id, name, sku, category, unit, current_stock, min_alert_threshold, cost_per_unit, supplier_name)
VALUES
('a1111111-1111-1111-1111-111111111111', 'Assam CTC Premium Tea Granules', 'RAW-TEA-01', 'Tea Leaves', 'KG', 18.500, 5.000, 420.00, 'Assam Direct Plantations'),
('a1111111-1111-1111-1111-111111111111', 'Fresh Toned Cow Milk', 'RAW-MLK-01', 'Dairy', 'LITER', 42.000, 15.000, 56.00, 'Nandini Dairy Bangalore'),
('a1111111-1111-1111-1111-111111111111', 'Refined Sugar', 'RAW-SGR-01', 'Sweeteners', 'KG', 30.000, 8.000, 44.00, 'Metro Cash & Carry'),
('a1111111-1111-1111-1111-111111111111', 'Whole Green Cardamom (Elaichi)', 'RAW-ELA-01', 'Spices', 'KG', 2.400, 0.500, 2200.00, 'Kerala Spice Traders'),
('a1111111-1111-1111-1111-111111111111', 'Fresh Root Ginger', 'RAW-GNG-01', 'Spices', 'KG', 7.800, 2.000, 120.00, 'City Wholesale Mandi'),
('a1111111-1111-1111-1111-111111111111', 'Terracotta Clay Kulhad (150ml)', 'RAW-KUL-01', 'Packaging', 'PIECE', 450.000, 100.000, 3.50, 'Potters Cooperative Society'),
('a1111111-1111-1111-1111-111111111111', 'Paper Cups (150ml biodegradable)', 'RAW-CUP-01', 'Packaging', 'PIECE', 850.000, 200.000, 1.20, 'GreenEco Packaging')
ON CONFLICT (shop_id, sku) DO NOTHING;

-- 7. Sample Suppliers
INSERT INTO public.suppliers (shop_id, name, contact_person, phone, email, address, payment_terms)
VALUES
('a1111111-1111-1111-1111-111111111111', 'Assam Direct Plantations Ltd', 'Rajesh Phukan', '+91 94350 11223', 'sales@assamdirect.com', 'Guwahati Tea Auction Centre, Assam', 'Net 30'),
('a1111111-1111-1111-1111-111111111111', 'Nandini Dairy Bangalore', 'Suresh Gowda', '+91 80234 56789', 'delivery@kmfnandini.coop', 'KMF Complex, Dr. MH Marigowda Road, Bengaluru', 'Daily Cash / UPI'),
('a1111111-1111-1111-1111-111111111111', 'Kerala Spice Traders', 'Mathew Thomas', '+91 94470 33445', 'orders@keralaspices.in', 'Spices Board Market, Idukki, Kerala', 'Net 15')
ON CONFLICT DO NOTHING;

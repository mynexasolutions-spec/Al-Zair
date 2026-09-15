-- ==========================================================
-- ALZAIR DATES & DRY FRUITS - DATABASE SCHEMA FOR SUPABASE / POSTGRES
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STANDALONE ADMINS TABLE (No Supabase Auth required)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'admin@alzair2024',
    full_name TEXT DEFAULT 'Super Admin',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default admin account
INSERT INTO public.admins (email, password, full_name, role)
VALUES ('admin@alzair.com', 'admin@alzair2024', 'Super Admin', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Dates', 'Dates Laddu', 'Stuffed Dates', 'Date Bites', 'Gift Packs')),
    product_type TEXT NOT NULL DEFAULT 'Premium Dates' CHECK (product_type IN ('Premium Dates', 'Healthy Snacks', 'Gift Products')),
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    discount TEXT,
    rating NUMERIC(2, 1) DEFAULT 4.8,
    reviews INTEGER DEFAULT 50,
    image TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    weight TEXT DEFAULT '500g',
    is_new BOOLEAN DEFAULT FALSE,
    sales_count INTEGER DEFAULT 0,
    short_description TEXT,
    description TEXT,
    ingredients TEXT,
    storage TEXT,
    shipping TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    state TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_method TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online', 'upi')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    weight TEXT,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CONTACT INQUIRIES / MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
    id TEXT PRIMARY KEY,
    image TEXT NOT NULL,
    alt TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Products',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. HOMEPAGE CONTENT & SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.homepage_content (
    id TEXT PRIMARY KEY DEFAULT 'main_homepage',
    hero JSONB NOT NULL DEFAULT '{
      "eyebrow": "Nature''s Finest",
      "title": "Gift For You",
      "description": "Indulge in the richness of premium quality dates. Pure, wholesome and naturally delicious.",
      "button1Text": "SHOP NOW",
      "button1Link": "/products",
      "button2Text": "EXPLORE PRODUCTS",
      "button2Link": "/products",
      "image": "/images/hero-image.png"
    }'::jsonb,
    featured_products JSONB NOT NULL DEFAULT '[
      {"id": "1", "name": "Dates", "image": "/images/dates.jpg", "link": "/products?category=Dates"},
      {"id": "2", "name": "Dates Laddu", "image": "/images/dates-ladu.jpg", "link": "/products?category=Dates%20Laddu"},
      {"id": "3", "name": "Stuffed Dates", "image": "/images/suffed-dates.jpeg", "link": "/products?category=Stuffed%20Dates"},
      {"id": "4", "name": "Date Bites", "image": "/images/date-bites.jpg", "link": "/products?category=Date%20Bites"},
      {"id": "5", "name": "Gift Packs", "image": "/images/hero-image.png", "link": "/products?category=Gift%20Packs"}
    ]'::jsonb,
    testimonials JSONB NOT NULL DEFAULT '[
      {"id": "1", "name": "Ayesha Khan", "quote": "The quality of dates is exceptional. Fresh, soft and so delicious! Will definitely order again.", "initials": "AK", "rating": 5},
      {"id": "2", "name": "Rizwan Ali", "quote": "Best dates laddu I''ve ever had. Perfect taste and very healthy. Highly recommended!", "initials": "RA", "rating": 5},
      {"id": "3", "name": "Sara Ahmed", "quote": "Premium quality and hygienic packing. You can truly taste the difference in every single date.", "initials": "SA", "rating": 5},
      {"id": "4", "name": "Fatima Zahra", "quote": "Luxury packaging and authentic Arabian taste. Perfect for gifting on festivals and celebrations.", "initials": "FZ", "rating": 5},
      {"id": "5", "name": "Mohammad Tariq", "quote": "The stuffed dates are out of this world. Crunchy nuts and juicy sweet dates.", "initials": "MT", "rating": 5},
      {"id": "6", "name": "Zainab Noor", "quote": "Ordered gift packs for the whole family. Beautiful presentation and supreme freshness!", "initials": "ZN", "rating": 5}
    ]'::jsonb,
    home_gallery JSONB NOT NULL DEFAULT '[
      {"id": "1", "image": "https://images.pexels.com/photos/15807109/pexels-photo-15807109.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200", "alt": "Alzair Premium Dates"},
      {"id": "2", "image": "/images/suffed-dates.jpeg", "alt": "Stuffed Dates with Almonds & Pistachio"},
      {"id": "3", "image": "/images/dates-ladu.jpg", "alt": "Handcrafted Nutty Date Laddu"},
      {"id": "4", "image": "/images/date-bites.jpg", "alt": "Artisanal Chocolate Date Bites"},
      {"id": "5", "image": "/images/hero-image.png", "alt": "Luxury Dates Gift Hamper"},
      {"id": "6", "image": "/images/dates.jpg", "alt": "Alzair Fresh Golden Dates"}
    ]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial homepage record
INSERT INTO public.homepage_content (id) VALUES ('main_homepage') ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Gallery: Public can view, Admins can manage
CREATE POLICY "Public can view gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Admins can manage gallery" ON public.gallery FOR ALL USING (true);


-- Homepage Content: Public can read, Admins can update
CREATE POLICY "Public can view homepage content" ON public.homepage_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage homepage content" ON public.homepage_content FOR ALL USING (true);

-- Products: Everyone can read, only Admins / Service Role can modify
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (true);

-- Orders: Public can create, Admins can view/manage all
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (true);

-- Order Items: Public can create, Admins can manage
CREATE POLICY "Public can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (true);

-- Inquiries: Public can insert, Admins can view/update
CREATE POLICY "Public can insert inquiries" ON public.contact_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage inquiries" ON public.contact_inquiries FOR ALL USING (true);

-- Newsletter Subscribers: Public can insert, Admins can manage
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage newsletter subscribers" ON public.newsletter_subscribers FOR ALL USING (true);

-- ==========================================================
-- SEED INITIAL CATALOG PRODUCTS
-- ==========================================================
INSERT INTO public.products (id, name, category, product_type, price, original_price, discount, rating, reviews, image, in_stock, weight, is_new, sales_count)
VALUES
('premium-halasi-dates', 'Premium Halasi Dates', 'Dates', 'Premium Dates', 450, 520, '13%', 4.8, 124, '/images/dates.jpg', true, '500g', false, 340),
('ajwa-dates', 'Ajwa Dates', 'Dates', 'Premium Dates', 850, NULL, NULL, 4.9, 89, 'https://images.pexels.com/photos/15807109/pexels-photo-15807109.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200', true, '500g', true, 510),
('medjool-dates', 'Medjool Dates', 'Dates', 'Premium Dates', 650, 700, '7%', 4.7, 156, '/images/footer.jpg', true, '500g', false, 420),
('dates-laddu-classic', 'Dates Laddu Classic', 'Dates Laddu', 'Healthy Snacks', 320, NULL, NULL, 4.6, 92, '/images/dates-ladu.jpg', true, '400g', false, 280),
('almond-stuffed-dates', 'Almond Stuffed Dates', 'Stuffed Dates', 'Healthy Snacks', 550, NULL, NULL, 4.8, 73, 'https://images.pexels.com/photos/8996217/pexels-photo-8996217.jpeg?auto=compress&cs=tinysrgb&h=800&w=1000', true, '350g', false, 310),
('chocolate-date-bites', 'Chocolate Date Bites', 'Date Bites', 'Healthy Snacks', 420, NULL, NULL, 4.8, 110, '/images/date-bites.jpg', true, '400g', true, 490),
('premium-gift-box', 'Premium Gift Box', 'Gift Packs', 'Gift Products', 1200, 1400, '14%', 4.9, 87, 'https://images.pexels.com/photos/30709483/pexels-photo-30709483.jpeg?auto=compress&cs=tinysrgb&h=800&w=1000', true, 'Luxury Box', false, 390),
('royal-gift-hamper', 'Royal Gift Hamper', 'Gift Packs', 'Gift Products', 1800, NULL, NULL, 5.0, 34, 'https://images.pexels.com/photos/6363145/pexels-photo-6363145.jpeg?auto=compress&cs=tinysrgb&h=800&w=1000', true, 'Hamper Box', false, 220),
('pistachio-stuffed-dates', 'Pistachio Stuffed Dates', 'Stuffed Dates', 'Healthy Snacks', 699, NULL, NULL, 4.9, 65, '/images/suffed-dates.jpeg', true, '350g', false, 430),
('hazelnut-date-bites', 'Hazelnut Date Bites', 'Date Bites', 'Healthy Snacks', 549, NULL, NULL, 4.7, 82, 'https://images.pexels.com/photos/31325605/pexels-photo-31325605.jpeg?auto=compress&cs=tinysrgb&h=800&w=1000', true, '400g', false, 260),
('alzair-luxury-halasi-pack', 'Alzair Luxury Halasi Pack', 'Gift Packs', 'Gift Products', 1299, 1500, '13%', 4.9, 140, '/images/hero-image.png', true, '1kg Gift Box', false, 580),
('nutty-date-laddu-royal', 'Nutty Date Laddu Royal', 'Dates Laddu', 'Healthy Snacks', 599, NULL, NULL, 4.8, 48, '/images/dates-ladu.jpg', true, '500g', false, 310)
ON CONFLICT (id) DO NOTHING;

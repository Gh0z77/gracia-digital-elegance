
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Main Courses',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  available BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu items" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2,
  reserved_date DATE NOT NULL,
  reserved_time TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reservations TO anon, authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a reservation" ON public.reservations FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.site_settings (
  id INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
  hero_title TEXT NOT NULL DEFAULT 'Today''s Special',
  phone TEXT NOT NULL DEFAULT '+998 99 609 99 99',
  address TEXT NOT NULL DEFAULT 'Andijan, Uzbekistan',
  hours TEXT NOT NULL DEFAULT 'Mon–Sun · 10:00 — 23:00',
  instagram TEXT NOT NULL DEFAULT 'gracia_restaurant',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.site_settings (id) VALUES (1);

INSERT INTO public.menu_items (name, description, category, price, image_url, featured, sort_order) VALUES
('Tagliatelle al Tartufo', 'Fresh egg tagliatelle folded through black truffle cream, aged Parmigiano and a whisper of butter.', 'Pasta', 145000, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1000&q=80', true, 1),
('Pizza Margherita Reale', 'San Marzano tomato, fior di latte, Genovese basil, 48-hour naturally leavened dough.', 'Pizza', 98000, 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1000&q=80', true, 2),
('Bistecca alla Fiorentina', 'Dry-aged T-bone over olive wood embers, rosemary salt, confit garlic.', 'Main Courses', 320000, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1000&q=80', true, 3),
('Burrata di Andria', 'Creamy burrata, heirloom tomato, Taggiasca olives, basil oil and toasted focaccia.', 'Starters', 89000, 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=1000&q=80', true, 4),
('Tiramisù della Nonna', 'Savoiardi soaked in espresso, mascarpone cream, bitter cocoa dust.', 'Desserts', 65000, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1000&q=80', true, 5),
('Risotto ai Funghi Porcini', 'Carnaroli rice, porcini, white wine, mantecato with cold butter.', 'Main Courses', 132000, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1000&q=80', false, 6),
('Antipasto della Famiglia', 'Prosciutto di Parma, soppressata, pecorino, marinated artichokes.', 'Starters', 115000, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80', false, 7),
('Lasagna al Forno', 'Slow-braised ragù, béchamel, thirteen layers, baked to a lace-thin crust.', 'Pasta', 128000, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=1000&q=80', false, 8),
('Panna Cotta ai Frutti', 'Vanilla bean panna cotta, wild berry reduction, candied pistachio.', 'Desserts', 58000, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1000&q=80', false, 9),
('Espresso Doppio', 'Single-origin Italian roast, pulled short and dense.', 'Beverages', 22000, 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=1000&q=80', false, 10),
('Limonata Siciliana', 'Sicilian lemon, cane sugar, sparkling water, mint.', 'Beverages', 32000, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=1000&q=80', false, 11),
('Pizza Tartufo Bianco', 'White truffle cream, mozzarella di bufala, wild mushrooms, 24-month Parmigiano.', 'Pizza', 165000, 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1000&q=80', false, 12);

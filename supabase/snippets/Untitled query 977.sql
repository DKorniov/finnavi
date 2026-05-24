-- 1. Включаем защиту на новых таблицах
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_availability ENABLE ROW LEVEL SECURITY;

-- 2. Разрешаем нашему сайту (anon) читать продукты
CREATE POLICY "Allow public read access for products" 
ON products FOR SELECT 
TO anon 
USING (true);

-- 3. Разрешаем нашему сайту читать матрицу доступности
CREATE POLICY "Allow public read access for product_availability" 
ON product_availability FOR SELECT 
TO anon 
USING (true);
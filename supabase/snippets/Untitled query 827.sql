-- 1. Включаем RLS для всех наших таблиц
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_availability ENABLE ROW LEVEL SECURITY;

-- 2. Создаем политику "Публичное чтение" для таблицы banks
-- Это позволит фронтенду видеть список банков, но не даст их менять
CREATE POLICY "Allow public read access for banks" 
ON banks FOR SELECT 
TO anon 
USING (true);

-- 3. То же самое для продуктов и матрицы доступности
CREATE POLICY "Allow public read access for products" 
ON products FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Allow public read access for product_availability" 
ON product_availability FOR SELECT 
TO anon 
USING (true);
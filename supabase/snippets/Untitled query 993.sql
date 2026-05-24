BEGIN;

-- 1. Сносим старое подчистую
DROP TABLE IF EXISTS product_availability CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. Зачищаем дубликаты банков (оставляем только 1 уникальную запись на каждый банк)
DELETE FROM banks
WHERE id NOT IN (
    SELECT id 
    FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at DESC) as rn
        FROM banks
    ) t
    WHERE t.rn = 1
);

-- 3. Создаем продукты с жесткой броней от дублей
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  currency TEXT[] DEFAULT '{RSD, EUR}'::text[],
  is_active BOOLEAN DEFAULT true,
  lead_gen_link TEXT,
  CONSTRAINT unique_bank_product_category UNIQUE (bank_id, category)
);

-- 4. Создаем доступность с жесткой броней
CREATE TABLE product_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  status residency_status NOT NULL,
  is_available BOOLEAN DEFAULT false,
  approval_probability TEXT,
  min_deposit DECIMAL,
  required_docs TEXT[],
  notes TEXT,
  CONSTRAINT unique_product_residency_status UNIQUE (product_id, status)
);

-- 5. Заливаем продукты (ИЗМЕНЕНИЕ: колонка currency убрана, база подставит дефолт сама)
INSERT INTO products (bank_id, category, name)
SELECT id, 'current_account', name || ': Личный счет (RSD/EUR)' FROM banks
UNION ALL
SELECT id, 'business_account', name || ': Счет для ИП (Preduzetnik)' FROM banks
UNION ALL
SELECT id, 'savings', name || ': Сберегательный вклад' FROM banks;

-- 6. Наполняем матрицу доступности чисто

-- === НЕРЕЗИДЕНТ ===
INSERT INTO product_availability (product_id, status, is_available, approval_probability, notes)
SELECT id, 'non_resident', true, 'High', 'Открывают по загранпаспорту и белому картону. Данные чатов: 👍67 / 👎78.'
FROM products WHERE bank_id IN (SELECT id FROM banks WHERE name ILIKE '%Alta%');

INSERT INTO product_availability (product_id, status, is_available, approval_probability, notes)
SELECT id, 'non_resident', false, 'Low', 'Отказы по паспорту РФ без рабочего контракта. Данные чатов: 👍354 / 👎339.'
FROM products WHERE bank_id IN (SELECT id FROM banks WHERE name ILIKE '%Raiffeisen%');

-- === ВНЖ < 1 ГОДА ===
INSERT INTO product_availability (product_id, status, is_available, approval_probability, notes)
SELECT id, 'resident_less_1y', true, 'High', 'Статус ВНЖ получен. Открытие без ограничений.'
FROM products WHERE bank_id IN (SELECT id FROM banks WHERE name ILIKE '%Alta%');

INSERT INTO product_availability (product_id, status, is_available, approval_probability, notes)
SELECT id, 'resident_less_1y', true, 'Medium', 'Открывают при наличии ВНЖ и подтверждения дохода (сербский контракт или ИП).'
FROM products WHERE bank_id IN (SELECT id FROM banks WHERE name ILIKE '%Raiffeisen%');

-- === РЕЗИДЕНТ 12 МЕС+ ===
INSERT INTO product_availability (product_id, status, is_available, approval_probability, notes)
SELECT id, 'resident_more_1y', true, 'High', 'Полный функционал резидента Сербии. Все ограничения сняты.'
FROM products;

COMMIT;
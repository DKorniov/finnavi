-- Таблица банков
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  official_site TEXT,
  ru_support BOOLEAN DEFAULT false, -- Официальная поддержка РФ
  tech_score INTEGER CHECK (tech_score BETWEEN 1 AND 5), -- Уровень технологий (токены vs приложение)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Типы резидентства
CREATE TYPE residency_status AS ENUM (
  'non_resident', 
  'resident_less_1y', 
  'resident_more_1y'
);

-- Финансовые продукты
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id UUID REFERENCES banks(id),
  category TEXT NOT NULL, -- 'current_account', 'savings', 'business_account', 'credit'
  name TEXT NOT NULL,
  currency TEXT[] DEFAULT '{RSD, EUR}',
  is_active BOOLEAN DEFAULT true,
  lead_gen_link TEXT -- Ссылка для монетизации (Phase 1/2)
);

-- Матрица доступности
CREATE TABLE product_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  status residency_status NOT NULL,
  is_available BOOLEAN DEFAULT false,
  approval_probability TEXT, -- 'High', 'Medium', 'Low' (базируется на отзывах)
  min_deposit DECIMAL,
  required_docs TEXT[], -- ['boraivak', 'labor_contract', 'white_card']
  notes TEXT -- Короткие советы: "Требуют перевод контракта"
);
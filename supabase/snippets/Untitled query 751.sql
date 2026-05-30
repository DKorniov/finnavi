BEGIN;

-- ==========================================
-- 1. ПОЛНАЯ ЗАЧИСТКА БАЗЫ И ТИПОВ
-- ==========================================
DROP TABLE IF EXISTS lead_requests CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;
DROP TABLE IF EXISTS currency_spreads CASCADE;
DROP TABLE IF EXISTS bond_yields CASCADE;
DROP TABLE IF EXISTS deposit_rates CASCADE;
DROP TABLE IF EXISTS tax_rules CASCADE;
DROP TABLE IF EXISTS asset_categories CASCADE;
DROP TABLE IF EXISTS funding_routes CASCADE;
DROP TABLE IF EXISTS broker_availability CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;
DROP TABLE IF EXISTS availability_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS banks CASCADE;

-- Жестко сносим старые типы с заглавными буквами
DROP TYPE IF EXISTS residency_status CASCADE;
DROP TYPE IF EXISTS success_rate CASCADE;
DROP TYPE IF EXISTS legal_status CASCADE;
DROP TYPE IF EXISTS broker_type CASCADE;
DROP TYPE IF EXISTS funding_method CASCADE;
DROP TYPE IF EXISTS tax_type CASCADE;
DROP TYPE IF EXISTS account_category CASCADE;
DROP TYPE IF EXISTS service_category CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;

-- ==========================================
-- 2. СОЗДАНИЕ ИДЕАЛЬНЫХ ТИПОВ (Нижний регистр, как в TS)
-- ==========================================
CREATE TYPE residency_status AS ENUM ('non_resident', 'resident_less_1y', 'resident_more_1y');
CREATE TYPE success_rate AS ENUM ('high', 'medium', 'low', 'blocked');
CREATE TYPE legal_status AS ENUM ('individual', 'frilenser', 'preduzetnik_pausal', 'preduzetnik_knjigas');
CREATE TYPE broker_type AS ENUM ('international', 'local', 'crypto_exchange', 'p2p');
CREATE TYPE funding_method AS ENUM ('swift', 'sepa', 'card', 'crypto_transfer');
CREATE TYPE tax_type AS ENUM ('capital_gains', 'dividend', 'coupon', 'income_tax');
CREATE TYPE account_category AS ENUM ('personal_account', 'business_account', 'savings');
CREATE TYPE service_category AS ENUM ('accounting', 'legal', 'banking', 'tax_consulting');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'closed');

-- ==========================================
-- 3. СОЗДАНИЕ ТАБЛИЦ
-- ==========================================
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  official_site TEXT
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category account_category NOT NULL,
  affiliate_link TEXT,
  is_promoted BOOLEAN DEFAULT FALSE
);

CREATE TABLE availability_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  residency_status residency_status NOT NULL,
  is_available BOOLEAN DEFAULT FALSE,
  approval_probability TEXT,
  notes TEXT
);

CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  broker_type broker_type NOT NULL,
  has_p2p_risk BOOLEAN DEFAULT FALSE,
  website_url TEXT,
  logo_url TEXT,
  is_promoted BOOLEAN DEFAULT FALSE
);

CREATE TABLE broker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  residency_status residency_status NOT NULL,
  is_available BOOLEAN DEFAULT FALSE,
  notes TEXT
);

CREATE TABLE funding_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  method funding_method NOT NULL,
  currency TEXT NOT NULL,
  success_rate success_rate NOT NULL,
  estimated_fee_pct NUMERIC(5,2),
  user_reports_summary TEXT
);

CREATE TABLE asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE
);

CREATE TABLE tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES asset_categories(id) ON DELETE CASCADE,
  user_legal_status legal_status NOT NULL,
  tax_type tax_type NOT NULL,
  tax_rate_percent NUMERIC(5,2) NOT NULL,
  is_tax_free BOOLEAN DEFAULT FALSE,
  notes TEXT,
  legal_reference TEXT
);

CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  category service_category NOT NULL,
  description TEXT,
  telegram_handle TEXT NOT NULL,
  rating NUMERIC(3,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_promoted BOOLEAN DEFAULT FALSE,
  pricing_notes TEXT
);

CREATE TABLE lead_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  client_contact TEXT NOT NULL,
  status lead_status DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ПОСЕВ ДАННЫХ (SEEDING)
-- ==========================================
INSERT INTO banks (id, name, official_site) VALUES
('b1111111-1111-1111-1111-111111111111', 'Raiffeisen Banka', 'raiffeisenbank.rs'),
('b2222222-2222-2222-2222-222222222222', 'Alta Banka', 'altabanka.rs');

INSERT INTO products (id, bank_id, name, category) VALUES
('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Личный счет Može', 'personal_account'),
('c1111112-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Счет для ИП (IT)', 'business_account');

INSERT INTO availability_items (product_id, residency_status, is_available, approval_probability, notes) VALUES
('c1111111-1111-1111-1111-111111111111', 'non_resident', false, 'low', 'Отказ без рабочего контракта.'),
('c1111111-1111-1111-1111-111111111111', 'resident_less_1y', true, 'medium', 'Требуют ID ВНЖ. Нет SWIFT.'),
('c1111112-1111-1111-1111-111111111111', 'resident_less_1y', false, 'low', 'Бизнес счета РФ-паспортам не открывают.');

INSERT INTO asset_categories (id, name, code) VALUES
('a1111111-1111-1111-1111-111111111111', 'Акции США', 'US_STK'),
('a2222222-2222-2222-2222-222222222222', 'Гособлигации РС', 'RS_GOV');

INSERT INTO tax_rules (category_id, user_legal_status, tax_type, tax_rate_percent, is_tax_free, notes) VALUES
('a1111111-1111-1111-1111-111111111111', 'individual', 'dividend', 15.00, false, 'Учесть налог брокера.'),
('a2222222-2222-2222-2222-222222222222', 'individual', 'coupon', 0.00, true, 'Купоны не облагаются налогом по закону РС.');

INSERT INTO service_providers (id, name, title, category, description, telegram_handle, is_verified, is_promoted, rating) VALUES
('d1111111-1111-1111-1111-111111111111', 'Елена Налогова', 'Налоговый консультант', 'tax_consulting', 'Помощь с PPDG-3R и оптимизацией для ИП.', '@elena_tax', true, true, 4.9),
('d2222222-2222-2222-2222-222222222222', 'Ivan Legal', 'Юрист по ВНЖ', 'legal', 'Открытие ИП и ВНЖ под ключ без отказов.', '@ivan_legal', true, false, 4.7);

INSERT INTO brokers (id, name, broker_type, website_url) VALUES 
('e1111111-1111-1111-1111-111111111111', 'Interactive Brokers', 'international', 'https://ibkr.com');

INSERT INTO funding_routes (broker_id, bank_name, method, currency, success_rate, estimated_fee_pct) VALUES
('e1111111-1111-1111-1111-111111111111', 'Alta Banka', 'swift', 'EUR', 'high', 0.8);

-- ==========================================
-- 5. RLS ПОЛИТИКИ
-- ==========================================
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON banks FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON availability_items FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON brokers FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON broker_availability FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON funding_routes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON asset_categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tax_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON service_providers FOR SELECT USING (true);

CREATE POLICY "Public Insert Access" ON lead_requests FOR INSERT WITH CHECK (true);

COMMIT;
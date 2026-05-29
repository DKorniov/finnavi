BEGIN;

-- 1. Очистка старых таблиц (Идемпотентность)
DROP TABLE IF EXISTS broker_assets CASCADE;
DROP TABLE IF EXISTS taxes CASCADE;
DROP TABLE IF EXISTS asset_categories CASCADE;
DROP TABLE IF EXISTS broker_availability CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;

-- 2. Таблица брокеров (Международные и локальные)
CREATE TABLE brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('international', 'local_bank', 'crypto_exchange')),
    website_url TEXT,
    referral_url TEXT, -- CPA монетизация
    base_currency VARCHAR(10) DEFAULT 'EUR',
    risk_warning TEXT, -- Важно для рисков (например, "Сложно пополнить из Сербии")
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Доступность брокеров по статусу резидентства (Связь с Фазой 1)
CREATE TABLE broker_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    residency_status VARCHAR(50) NOT NULL CHECK (residency_status IN ('non_resident', 'resident_less_1y', 'resident_more_1y')),
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    requirements_notes TEXT, -- Например: "Требуется ВНЖ и белый картон" или "Открывают по паспорту РФ"
    UNIQUE(broker_id, residency_status)
);

-- 4. Категории активов (ETF, Гособлигации, Крипта)
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_local_serbian BOOLEAN DEFAULT FALSE -- Маркер для локальных активов (например, RS bonds)
);

-- 5. Связь M2M: Какие активы доступны у какого брокера
CREATE TABLE broker_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    asset_category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    UNIQUE(broker_id, asset_category_id)
);

-- 6. Налоговая матрица (Ядро монетизации и пользы)
CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    tax_profile VARCHAR(50) NOT NULL CHECK (tax_profile IN ('fizicko_lice', 'preduzetnik_pausal', 'preduzetnik_knjigas', 'frilenser')),
    capital_gains_tax_pct NUMERIC(5,2) NOT NULL, -- Налог на прирост капитала
    dividend_tax_pct NUMERIC(5,2) NOT NULL,      -- Налог на дивиденды/купоны
    tax_notes TEXT, -- Инсайды: "0% на купоны гособлигаций Сербии" или "Учесть 15% удержанных IBKR (W-8BEN)"
    UNIQUE(asset_category_id, tax_profile)
);

-- 7. Настройка Row Level Security (RLS)
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;

-- Создание политик на публичное чтение (DROP IF EXISTS встроен в синтаксис Supabase при пересоздании, но для надежности оборачиваем)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Access" ON brokers;
    DROP POLICY IF EXISTS "Public Read Access" ON broker_availability;
    DROP POLICY IF EXISTS "Public Read Access" ON asset_categories;
    DROP POLICY IF EXISTS "Public Read Access" ON broker_assets;
    DROP POLICY IF EXISTS "Public Read Access" ON taxes;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Public Read Access" ON brokers FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON broker_availability FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON asset_categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON broker_assets FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON taxes FOR SELECT USING (true);

COMMIT;
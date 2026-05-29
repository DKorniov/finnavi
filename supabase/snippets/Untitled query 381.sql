BEGIN;

-- 1. Сброс старых таблиц (Каскадное удаление для чистой пересборки)
DROP TABLE IF EXISTS tax_rules CASCADE;
DROP TABLE IF EXISTS asset_categories CASCADE;
DROP TABLE IF EXISTS broker_funding_routes CASCADE;
DROP TABLE IF EXISTS broker_availability CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;

-- 2. Таблица брокеров (IBKR, Trading212, XTB, ECD.rs)
CREATE TABLE brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    broker_type TEXT NOT NULL CHECK (broker_type IN ('international', 'local', 'crypto_exchange', 'p2p')),
    has_p2p_risk BOOLEAN NOT NULL DEFAULT false,
    website_url TEXT,
    referral_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Доступность брокеров по статусу резидентства
CREATE TABLE broker_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    residency_status TEXT NOT NULL CHECK (residency_status IN ('non_resident', 'resident_less_1y', 'resident_more_1y')),
    is_available BOOLEAN NOT NULL DEFAULT false,
    requirements_notes TEXT,
    UNIQUE (broker_id, residency_status)
);

-- 4. Шлюзы пополнения (Реальный опыт юзеров)
CREATE TABLE broker_funding_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('swift', 'sepa', 'card', 'crypto_transfer')),
    success_rate TEXT NOT NULL CHECK (success_rate IN ('high', 'medium', 'low', 'blocked')),
    user_reports_summary TEXT,
    UNIQUE (broker_id, bank_name, method)
);

-- 5. Категории активов
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

-- 6. Налоговая матрица
CREATE TABLE tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    user_legal_status TEXT NOT NULL CHECK (user_legal_status IN ('individual', 'frilenser', 'preduzetnik_pausal', 'preduzetnik_knjigas')),
    tax_type TEXT NOT NULL CHECK (tax_type IN ('capital_gains', 'dividend', 'coupon', 'income_tax')),
    tax_rate_percent NUMERIC(5,2) NOT NULL,
    is_tax_free BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    UNIQUE(asset_category_id, user_legal_status, tax_type)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- Публичный доступ на чтение для фронтенда
-- ==========================================
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_funding_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access for Brokers" ON brokers FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Broker Availability" ON broker_availability FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Funding Routes" ON broker_funding_routes FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Asset Categories" ON asset_categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Tax Rules" ON tax_rules FOR SELECT USING (true);

-- ==========================================
-- SEED DATA (Наполнение реальными данными)
-- ==========================================

-- Брокеры
INSERT INTO brokers (id, name, broker_type, has_p2p_risk, website_url) VALUES
('b1111111-1111-1111-1111-111111111111', 'Interactive Brokers', 'international', false, 'https://www.interactivebrokers.com'),
('b2222222-2222-2222-2222-222222222222', 'Binance / Bybit', 'crypto_exchange', true, 'https://www.binance.com'),
('b3333333-3333-3333-3333-333333333333', 'Офлайн крипто-обмен (Cash)', 'p2p', false, NULL);

-- Шлюзы пополнения (Реальный опыт из логов)
INSERT INTO broker_funding_routes (broker_id, bank_name, method, success_rate, user_reports_summary) VALUES
('b1111111-1111-1111-1111-111111111111', 'Raiffeisen', 'swift', 'low', 'Требуют список бумаг, цены и одобрение Национального банка Сербии (НБС). Очень сложно.'),
('b1111111-1111-1111-1111-111111111111', 'UniCredit', 'swift', 'medium', 'Пропускают, но ставят негласный лимит около 10 000 EUR в квартал.'),
('b1111111-1111-1111-1111-111111111111', 'Alta / Poštanska / OTP', 'swift', 'low', 'Для SWIFT требуют справку из налоговой (Poreska uprava) об отсутствии долгов. Нерезидентам только очно.'),
('b2222222-2222-2222-2222-222222222222', 'Любой сербский банк', 'card', 'blocked', 'КРАСНЫЙ РИСК: Мгновенная блокировка и закрытие счета с формулировкой "перевод из крипты".'),
('b3333333-3333-3333-3333-333333333333', 'Наличные (Менялы)', 'crypto_transfer', 'high', 'Самый безопасный метод по отзывам. Без пересечения с сербской банковской системой.');

-- Категории активов
INSERT INTO asset_categories (id, code, name, description) VALUES
('a1111111-1111-1111-1111-111111111111', 'us_stocks', 'Акции США', 'Дивидендные акции рынка США (Apple, Coca-Cola и др.)'),
('a2222222-2222-2222-2222-222222222222', 'rs_gov_bonds', 'Гособлигации Сербии', 'Долговые бумаги министерства финансов РС'),
('a3333333-3333-3333-3333-333333333333', 'crypto', 'Криптовалюта', 'Bitcoin, USDT, стейкинг');

-- Налоговая матрица (Из законов Сербии)
INSERT INTO tax_rules (asset_category_id, user_legal_status, tax_type, tax_rate_percent, is_tax_free, notes) VALUES
-- Акции США
('a1111111-1111-1111-1111-111111111111', 'individual', 'dividend', 15.00, false, 'Итого 45% (30% удержит брокер США, W-8BEN не работает + 15% в Сербии).'),
('a1111111-1111-1111-1111-111111111111', 'individual', 'capital_gains', 15.00, false, '0% если держать бумаги непрерывно более 10 лет.'),
-- Сербские облигации
('a2222222-2222-2222-2222-222222222222', 'individual', 'coupon', 0.00, true, 'Полностью освобождено от налогов для резидентов.'),
('a2222222-2222-2222-2222-222222222222', 'individual', 'capital_gains', 0.00, true, 'Прирост капитала не облагается налогом.'),
-- Крипта для Паушала
('a3333333-3333-3333-3333-333333333333', 'preduzetnik_pausal', 'capital_gains', 15.00, false, 'ВНИМАНИЕ: Не входит в лимит 6 млн динар! Облагается отдельно как для физлиц.');

COMMIT;

-- ❗️ВАЖНО: Принудительный сброс кэша Supabase API
NOTIFY pgrst, 'reload schema';
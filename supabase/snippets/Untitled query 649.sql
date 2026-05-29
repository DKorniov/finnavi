BEGIN;

DROP TABLE IF EXISTS lead_requests CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;

-- 1. Витрина проверенных специалистов
CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('accounting', 'legal', 'banking', 'tax_consulting')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_range TEXT NOT NULL, -- Например: "от 50€/мес"
    languages TEXT[] NOT NULL, -- ['ru', 'en', 'sr']
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Заявки (Лиды) — Наша золотая жила
CREATE TABLE lead_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    user_contact TEXT NOT NULL, -- Telegram или Email
    request_text TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Политики
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

-- Провайдеров могут читать все
CREATE POLICY "Public Read Access for providers" ON service_providers FOR SELECT USING (true);
-- Оставлять заявки могут все (Insert), но читать их можем только мы (Admin)
CREATE POLICY "Public Insert Access for leads" ON lead_requests FOR INSERT WITH CHECK (true);

-- ==========================================
-- SEED DATA (Первые "Помогаторы")
-- ==========================================
INSERT INTO service_providers (category, name, description, price_range, languages) VALUES
('tax_consulting', 'KriptoPorez Consulting', 'Консультации по налогам на крипту и иностранные брокерские счета (IBKR, PPDG-3R). Знают все нюансы W-8BEN.', '50-100 EUR/час', ARRAY['ru', 'en', 'sr']),
('legal', 'Immigration SRB Legal', 'Оформление ВНЖ под ключ по основанию ИП/Недвижимость. Без скрытых комиссий, полное сопровождение в МУП.', '300-800 EUR', ARRAY['ru', 'en']),
('banking', 'VIP Bank Connect', 'Помощь с открытием корпоративных и личных счетов в условиях жесткого комплаенса. Разблокировка счетов после P2P.', '200-500 EUR', ARRAY['ru', 'sr']),
('accounting', 'Paušal-Pro', 'Ведение бухгалтерии для ИП (Paušal / Knjigaš). Сдача годовых отчетов, генерация инвойсов на английском.', '50-150 EUR/мес', ARRAY['ru', 'sr']);

COMMIT;

NOTIFY pgrst, 'reload schema';
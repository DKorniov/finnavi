BEGIN;

DROP TABLE IF EXISTS deposit_rates CASCADE;
DROP TABLE IF EXISTS bond_yields CASCADE;
DROP TABLE IF EXISTS currency_spreads CASCADE;

-- 1. Таблица депозитов (Štednja)
CREATE TABLE deposit_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('EUR', 'RSD')),
    term_months INT NOT NULL,
    interest_rate_pct NUMERIC(5,2) NOT NULL,
    tax_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    is_available_for_non_resident BOOLEAN DEFAULT false,
    notes TEXT
);

-- 2. Таблица доходности облигаций (Обвезнице)
CREATE TABLE bond_yields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bond_type TEXT NOT NULL CHECK (bond_type IN ('RS_GOV_EUR', 'RS_GOV_RSD')),
    maturity_years INT NOT NULL,
    yield_rate_pct NUMERIC(5,2) NOT NULL,
    broker_entry_fee_pct NUMERIC(5,2) NOT NULL, -- До 5% у OTP
    broker_custody_fee_pct NUMERIC(5,2) NOT NULL, -- 1% в год
    broker_coupon_fee_pct NUMERIC(5,2) NOT NULL, -- 1% от купона
    tax_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    notes TEXT
);

-- 3. Спреды обмена валют (Курсы банков vs NBS)
CREATE TABLE currency_spreads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('business', 'individual', 'offline_exchange')),
    spread_loss_pct NUMERIC(5,2) NOT NULL, -- Сколько % теряем от курса NBS
    has_vip_rate BOOLEAN DEFAULT false,
    notes TEXT
);

-- RLS Политики
ALTER TABLE deposit_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bond_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_spreads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access for deposits" ON deposit_rates FOR SELECT USING (true);
CREATE POLICY "Public Read Access for bonds" ON bond_yields FOR SELECT USING (true);
CREATE POLICY "Public Read Access for spreads" ON currency_spreads FOR SELECT USING (true);

-- ==========================================
-- SEED DATA (Наполнение реальными данными)
-- ==========================================

-- Депозиты
INSERT INTO deposit_rates (bank_name, currency, term_months, interest_rate_pct, tax_rate_pct, is_available_for_non_resident, notes) VALUES
('Alta Banka', 'RSD', 12, 4.50, 0.00, true, 'Открывают нерезидентам. Без пополнения. Штраф при досрочном снятии.'),
('OTP Banka', 'RSD', 12, 3.75, 0.00, false, 'Доступно только в отделениях. Онлайн ставки ниже.'),
('API Bank', 'RSD', 12, 4.00, 0.00, true, 'Средняя ставка на рынке.'),
('Raiffeisen', 'EUR', 12, 0.00, 15.00, false, 'ВНИМАНИЕ: Навязывают инвест-фонд Raiffeisen EuroCash вместо вклада. Депозиты не застрахованы АОД!');

-- Облигации (С учетом конских комиссий локальных брокеров вроде OTP)
INSERT INTO bond_yields (bond_type, maturity_years, yield_rate_pct, broker_entry_fee_pct, broker_custody_fee_pct, broker_coupon_fee_pct, tax_rate_pct, notes) VALUES
('RS_GOV_EUR', 3, 4.00, 5.00, 1.00, 1.00, 0.00, 'Риск: При инвестиции на малый срок банковские комиссии съедают всю доходность.'),
('RS_GOV_EUR', 12, 4.97, 5.00, 1.00, 1.00, 0.00, 'Долгосрок. Налог 0%. Иностранцам разрешено.');

-- Спреды (Потеря на конвертации EUR <-> RSD)
INSERT INTO currency_spreads (bank_name, account_type, spread_loss_pct, has_vip_rate, notes) VALUES
('Raiffeisen', 'business', 1.50, true, 'VIP курс (~116.3) фиксируется звонком в дилинговый центр при суммах от 10k EUR.'),
('Raiffeisen', 'individual', 2.40, false, 'Грабительский курс (до 114.4 за евро).'),
('Poštanska štedionica', 'business', 0.20, false, 'Лучший курс на рынке для ИП (117.0 - 117.05).'),
('Менячница (Офлайн)', 'offline_exchange', 0.30, false, 'Рекомендация комьюнити: снять RSD и поменять в физическом обменнике.');

COMMIT;

NOTIFY pgrst, 'reload schema';
// ==========================================
// ТИПЫ ФАЗЫ 1 (БАНКОВСКИЙ НАВИГАТОР)
// ==========================================

export interface AvailabilityItem {
  id: string;
  is_available: boolean;
  approval_probability: 'High' | 'Medium' | 'Low' | null;
  notes: string | null;
  products: {
    name: string;
    category: string;
    banks: {
      name: string;
      official_site: string | null;
    };
  };
}

// ==========================================
// ТИПЫ ФАЗЫ 2 (ИНВЕСТОР И НАЛОГИ)
// ==========================================

// 1. Базовые перечисления (Strict Union Types)
export type ResidencyStatus = 'non_resident' | 'resident_less_1y' | 'resident_more_1y';
export type BrokerType = 'international' | 'local' | 'crypto_exchange' | 'p2p';
export type FundingMethod = 'swift' | 'sepa' | 'card' | 'crypto_transfer';
export type SuccessRate = 'high' | 'medium' | 'low' | 'blocked';
export type LegalStatus = 'individual' | 'frilenser' | 'preduzetnik_pausal' | 'preduzetnik_knjigas';
export type TaxType = 'capital_gains' | 'dividend' | 'coupon' | 'income_tax';

// 2. Базовые таблицы Брокеров и Шлюзов
export interface Broker {
  id: string;
  name: string;
  broker_type: BrokerType;
  has_p2p_risk: boolean;
  website_url: string | null;
  referral_url: string | null;
}

export interface BrokerAvailability {
  id: string;
  broker_id: string;
  residency_status: ResidencyStatus;
  is_available: boolean;
  requirements_notes: string | null;
}

export interface BrokerFundingRoute {
  id: string;
  broker_id: string;
  bank_name: string;
  method: FundingMethod;
  success_rate: SuccessRate;
  user_reports_summary: string | null;
}

// 3. Составной DTO Брокера (После JOIN запроса из Supabase)
export interface BrokerWithRelations extends Broker {
  broker_availability: BrokerAvailability[];
  broker_funding_routes: BrokerFundingRoute[];
}

// 4. Базовые таблицы Активов и Налогов
export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface TaxRule {
  id: string;
  asset_category_id: string;
  user_legal_status: LegalStatus;
  tax_type: TaxType;
  tax_rate_percent: number;
  is_tax_free: boolean;
  notes: string | null;
}

// 5. Составной DTO Налогов (После JOIN запроса из Supabase)
export interface TaxRuleWithCategory extends TaxRule {
  // Ключ ОБЯЗАТЕЛЬНО во множественном числе — так отдает Supabase
  asset_categories: AssetCategory;
}
// ==========================================
// ТИПЫ ФАЗЫ 3 (КАЛЬКУЛЯТОРЫ И СПРЕДЫ)
// ==========================================
export interface DepositRate {
  id: string;
  bank_name: string;
  currency: 'EUR' | 'RSD';
  term_months: number;
  interest_rate_pct: number;
  tax_rate_pct: number;
  is_available_for_non_resident: boolean;
  notes: string | null;
}

export interface BondYield {
  id: string;
  bond_type: 'RS_GOV_EUR' | 'RS_GOV_RSD';
  maturity_years: number;
  yield_rate_pct: number;
  broker_entry_fee_pct: number;
  broker_custody_fee_pct: number;
  broker_coupon_fee_pct: number;
  tax_rate_pct: number;
  notes: string | null;
}

export interface CurrencySpread {
  id: string;
  bank_name: string;
  account_type: 'business' | 'individual' | 'offline_exchange';
  spread_loss_pct: number;
  has_vip_rate: boolean;
  notes: string | null;
}
// ==========================================
// ТИПЫ ФАЗЫ 4 (ЛИД-ГЕН И УСЛУГИ)
// ==========================================
export type ServiceCategory = 'accounting' | 'legal' | 'banking' | 'tax_consulting';

export interface ServiceProvider {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  price_range: string;
  languages: string[];
  is_verified: boolean;
}
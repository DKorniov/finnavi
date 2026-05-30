// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕЧИСЛЕНИЯ И ОБЩИЕ ТИПЫ
// ==========================================

export type ResidencyStatus = 'non_resident' | 'resident_less_1y' | 'resident_more_1y';
export type SuccessRate = 'high' | 'medium' | 'low' | 'blocked';
export type LegalStatus = 'individual' | 'frilenser' | 'preduzetnik_pausal' | 'preduzetnik_knjigas';
export type BrokerType = 'international' | 'local' | 'crypto_exchange' | 'p2p';
export type FundingMethod = 'swift' | 'sepa' | 'card' | 'crypto_transfer';
export type TaxType = 'capital_gains' | 'dividend' | 'coupon' | 'income_tax';

// ==========================================
// ФАЗА 1: БАНКОВСКИЙ НАВИГАТОР (МАТРИЦА ДОСТУПНОСТИ)
// ==========================================

export interface Bank {
  id: string;
  name: string;
  official_site: string | null;
  created_at?: string;
}

export interface BankProduct {
  id: string;
  bank_id: string;
  name: string;
  category: 'personal_account' | 'business_account' | 'savings';
  affiliate_link: string | null;
  is_promoted: boolean;
  banks?: Bank;
}

export interface AvailabilityItem {
  id: string;
  product_id: string;
  residency_status: ResidencyStatus;
  is_available: boolean;
  approval_probability: 'High' | 'Medium' | 'Low' | null;
  notes: string | null;
  last_user_report_date?: string | null;
  products?: BankProduct;
}

// ==========================================
// ФАЗА 2: ИНВЕСТ-НАВИГАТОР И НАЛОГИ
// ==========================================

// Брокеры и их шлюзы
export interface Broker {
  id: string;
  name: string;
  broker_type: BrokerType;
  has_p2p_risk: boolean;
  website_url: string | null;
  logo_url?: string | null;
  is_promoted: boolean;
}

export interface BrokerAvailability {
  id: string;
  broker_id: string;
  residency_status: ResidencyStatus;
  is_available: boolean;
  notes: string | null;
}

export interface FundingRoute {
  id: string;
  broker_id: string;
  bank_name: string;
  method: FundingMethod;
  currency: 'EUR' | 'USD' | 'RSD';
  success_rate: SuccessRate;
  estimated_fee_pct: number;
  user_reports_summary: string | null;
}

// Сборный тип для компонента BrokerCards
export interface BrokerWithRelations extends Broker {
  broker_availability?: BrokerAvailability[];
  funding_routes?: FundingRoute[];
}

// Налоговый блок
export interface AssetCategory {
  id: string;
  name: string;
  code: string;
}

export interface TaxRule {
  id: string;
  category_id: string;
  user_legal_status: LegalStatus;
  tax_type: TaxType;
  tax_rate_percent: number;
  is_tax_free: boolean;
  notes: string | null;
  legal_reference: string | null;
}

// Сборный тип для компонента TaxOptimizer
export interface TaxRuleWithCategory extends TaxRule {
  asset_categories: AssetCategory;
}

// ==========================================
// ФАЗА 3: СБЕРЕЖЕНИЯ И ИЗДЕРЖКИ (YIELD COMPARATOR)
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
// ФАЗА 4: ХАБ УСЛУГ (ВИТРИНА ЭКСПЕРТОВ)
// ==========================================

export interface ServiceProvider {
  id: string;
  name: string;
  title: string;
  category: 'accounting' | 'legal' | 'banking' | 'tax_consulting';
  description: string;
  telegram_handle: string;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  is_promoted: boolean;
  pricing_notes: string | null;
}

export interface LeadRequest {
  id: string;
  provider_id: string;
  client_contact: string;
  client_status: ResidencyStatus;
  legal_type: 'individual' | 'business';
  message?: string | null;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
}
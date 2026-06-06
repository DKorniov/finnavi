export type ResidencyStatus = 'non_resident' | 'resident_less_1y' | 'resident_more_1y' | 'permanent_resident' | 'citizen';
export type LegalType = 'individual' | 'business';
export type Probability = 'high' | 'medium' | 'low' | 'blocked';

export interface KYCRule {
  status: ResidencyStatus;
  legal_type: LegalType;
  is_available: boolean;
  probability: Probability;
  required_docs: string[];
  red_flags: string[]; // Инсайды и причины отказов
}

export interface FeeStructure {
  pct: number;
  min_rsd: number | null;
  max_rsd: number | null;
  notes?: string;
}

export interface DepositTerm {
  term_months: number;
  rate_pct: number;
  early_withdrawal_penalty_pct: number;
}

export interface BankProduct {
  product_id: string;
  name: string;
  category: 'personal_account' | 'business_account' | 'savings_deposit' | 'investment_bonds' | 'credit_mortgage' | 'credit_consumer' | 'transfer';

  // personal_account / business_account
  is_multicurrency?: boolean;
  supported_currencies?: string[];
  maintenance_fee_rsd?: number;
  swift_in?: FeeStructure;
  swift_out?: FeeStructure;
  features?: {
    apple_pay: boolean;
    google_pay: boolean;
    garmin_pay: boolean;
    prenesi: boolean;
    ips_qr: boolean;
  };
  cards?: {
    dina_notes: string;
    international: string[];
  };

  // savings_deposit
  terms?: DepositTerm[];
  tax_on_interest_pct?: number;
  tax_note?: string;
  min_amount_eur?: number | null;
  min_amount_rsd?: number | null;
  is_available_non_resident?: boolean;

  // investment_bonds
  yield_eur_approx_pct?: number | null;
  yield_rsd_approx_pct?: number | null;
  tax_on_coupon_pct?: number;
  tax_on_capital_gains_pct?: number;
  entry_fee_pct?: number;
  custody_fee_pct_annual?: number;
  coupon_collection_fee_pct?: number;
  min_investment_eur?: number | null;
  access_method?: string;

  // credit_mortgage
  rate_approx_total_pct?: number;
  max_ltv_pct?: number;
  min_down_payment_pct?: number;
  max_amount_eur?: number;
  min_amount_eur_credit?: number;
  loan_term_years?: number[];

  // credit_consumer
  rate_approx_pct?: number;
  loan_term_months?: number[];

  // transfer
  fee_incoming_pct?: number;
  fee_incoming_min_rsd?: number | null;
  fee_outgoing_pct?: number;
  fee_outgoing_min_rsd?: number | null;
  outgoing_resident_restriction?: string | null;
  outgoing_resident_1y_plus?: string | null;

  // общие опциональные
  notes?: string | null;
  red_flags?: string[];
  available_directions?: string[];
  currencies?: string[];
  min_residency_status?: ResidencyStatus;
  available_for_foreigners?: boolean;
  currency?: string;
  rate_type?: string;
  income_requirement?: string;
  required_docs?: string[];
}

export interface BankJSON {
  bank_id: string;
  brand_name: string;
  official_name: string;
  maticni_broj: string;
  website: string;
  kyc_matrix: KYCRule[];
  products: BankProduct[];
  last_updated: string;
}

// 🔥 КРИТИЧЕСКИЙ МОСТ: Сквозной тип для матрицы предложений
export interface TransformedMatrixItem {
  id: string;
  product_id: string;
  residency_status: ResidencyStatus;
  is_available: boolean;
  probability: Probability;
  kyc_requirements: string[];
  red_flags: string[];
  products: BankProduct & {
    banks: {
      name: string;
      official_site: string | null;
    };
  };
}
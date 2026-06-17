export type ResidencyStatus = 'non_resident' | 'resident_less_1y' | 'resident_more_1y' | 'permanent_resident' | 'citizen';
export type LegalType = 'individual' | 'business';
export type Probability = 'high' | 'medium' | 'low' | 'blocked';

// ── savings_deposit: новые типы v2.5 ──────────────────────────────────────────

/** Тип капитализации процентов внутри срока вклада */
export type CapitalizationType = 'daily' | 'monthly' | 'quarterly' | 'at_end';

/** Периодичность фактической выплаты процентов клиенту */
export type InterestPayout = 'daily' | 'monthly' | 'quarterly' | 'at_end';

/**
 * Что происходит при досрочном расторжении вклада:
 * - full_loss         — полная потеря всех начисленных процентов (Raiffeisen, Alta)
 * - recalculated_vista — пересчёт по ставке счёта до востребования (Intesa, OTP, Poštanska)
 * - partial_loss      — частичная потеря по условиям договора
 * - none              — без штрафа
 */
export type EarlyWithdrawalPenalty = 'full_loss' | 'recalculated_vista' | 'partial_loss' | 'none';

/** Тип депозитного продукта */
export type DepositType = 'orocena' | 'renta' | 'flexi' | 'combi' | 'namenski' | 'a_vista';

// ── account: тип пакета ───────────────────────────────────────────────────────

export type PackageTier = 'basic' | 'standard' | 'premium' | 'student' | 'pension' | null;

// ─────────────────────────────────────────────────────────────────────────────

export interface KYCRule {
  status: ResidencyStatus;
  legal_type: LegalType;
  is_available: boolean;
  probability: Probability;
  required_docs: string[];
  red_flags: string[];
  blocked_reasons?: string[];
}

export interface FeeStructure {
  pct: number;
  min_rsd: number | null;
  max_rsd?: number | null;
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

  // ── personal_account / business_account ───────────────────────────────────
  package_tier?: PackageTier;
  target?: string;                       // "preduzetnik" | "sve" | "malo_privredno_drustvo"
  is_multicurrency?: boolean;
  supported_currencies?: string[];
  maintenance_fee_rsd?: number;
  maintenance_fee_condition?: string;    // условие бесплатности / применимости
  swift_in?: FeeStructure;
  swift_out?: FeeStructure;
  sepa_in?: FeeStructure;                // SEPA IN — отдельно от SWIFT
  sepa_out?: FeeStructure;               // SEPA OUT — отдельно от SWIFT
  features?: {
    apple_pay: boolean | null;
    google_pay: boolean | null;
    garmin_pay: boolean | null;
    prenesi: boolean;
    ips_qr: boolean;
    contactless?: boolean;
  };
  cards?: {
    dina_notes: string;
    international: string[];
  };
  card_issue_days?: string;
  cashback?: string;
  bonuses?: string;
  atm_withdrawal_own_bank?: string;

  // ── savings_deposit ────────────────────────────────────────────────────────
  deposit_type?: DepositType;
  currencies?: string[];                 // валюты вклада ["RSD"] | ["EUR", "USD"]
  terms?: DepositTerm[];
  tax_on_interest_pct?: number;
  tax_note?: string;
  min_amount_rsd?: number | null;
  min_amount_eur?: number | null;
  is_available_non_resident?: boolean | null;
  availability_note?: string;            // дополнительное условие доступности

  // Новые поля v2.5 (заполнены из NotebookLM для всех 5 банков)
  capitalization_type?: CapitalizationType | null;
  interest_payout?: InterestPayout | null;
  replenishment_allowed?: boolean | null;
  partial_withdrawal_allowed?: boolean | null;
  grace_period_termination?: boolean | null;
  grace_period_note?: string | null;
  early_withdrawal_penalty?: EarlyWithdrawalPenalty | null;

  // ── investment_bonds ───────────────────────────────────────────────────────
  instrument_type?: string;              // "RS_GOV" | "CORP" | "FOREIGN"
  available_via_bank?: boolean;
  currencies_available?: string[];       // валюты доступных облигаций
  yield_eur_approx_pct?: number | null;
  yield_rsd_approx_pct?: number | null;
  tax_on_coupon_pct?: number;
  tax_on_capital_gains_pct?: number;
  entry_fee_pct?: number;
  custody_fee_pct_annual?: number;
  coupon_collection_fee_pct?: number;
  min_investment_eur?: number | null;
  min_investment_rsd?: number | null;    // для динарных облигаций (Poštanska)
  access_method?: string;               // "offline_branch" | "online"

  // ── credit_mortgage ────────────────────────────────────────────────────────
  rate_approx_total_pct?: number;
  rate_base?: string;                    // "EURIBOR 3M" | "EURIBOR 6M"
  rate_margin_pct?: number;
  rate_fixed_period_years?: number;
  max_ltv_pct?: number;
  min_down_payment_pct?: number;
  max_amount_eur?: number;
  min_amount_eur_credit?: number;
  loan_term_years?: number[];
  early_repayment_fee_pct?: number;
  processing_fee_pct?: number;
  insurance_required?: string[];

  // ── credit_consumer ────────────────────────────────────────────────────────
  purpose?: string;                      // "general" | "auto" | "refinancing"
  rate_approx_pct?: number;
  rate_type?: string;                    // "fixed" | "variable" | "combined"
  loan_term_months?: number[];
  max_amount_rsd?: number;
  min_amount_rsd_credit?: number;
  income_requirement?: string;

  // ── transfer ───────────────────────────────────────────────────────────────
  available_directions?: string[];       // ["incoming", "outgoing"]
  fee_incoming_pct?: number;
  fee_incoming_min_rsd?: number | null;
  fee_incoming_max_rsd?: number | null;
  fee_outgoing_pct?: number;
  fee_outgoing_min_rsd?: number | null;
  fee_outgoing_max_rsd?: number | null;
  outgoing_resident_restriction?: string | null;
  outgoing_resident_1y_plus?: string | null;

  // ── общие опциональные ────────────────────────────────────────────────────
  notes?: string | null;
  red_flags?: string[];
  min_residency_status?: ResidencyStatus;
  available_for_foreigners?: boolean;
  currency?: string;
  required_docs?: string[];
}

export interface BankJSON {
  bank_id: string;
  brand_name: string;
  official_name: string;
  maticni_broj: string;
  website: string;
  logo_color?: string;
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
  blocked_reasons: string[];
  products: BankProduct & {
    banks: {
      name: string;
      official_site: string | null;
      logo_color: string | null;
    };
  };
}
// src/types/fund.ts
import type { ResidencyStatus, Probability } from "@/types/bank";

export type { Probability };

export type FundType = "money_market" | "bond" | "equity" | "mixed" | "real_estate";
export type DividendPolicy = "accumulating" | "distributing";

export interface FundAvailability {
  status: ResidencyStatus;
  is_available: boolean;
  probability: Probability;
  notes: string | null;
}

export interface FundAccessMethods {
  online: boolean | null;
  offline_branch: boolean | null;
  distributor: boolean | string | null;
  notes: string | null;
}

export interface FundFees {
  management_fee_pct: number | null;
  depozitar_fee_pct: number | null;
  entry_fee_pct: number | null;
  exit_fee_pct: number | null;
  performance_fee_pct: number | null;
  ter_approx_pct: number | null;
  notes: string | null;
}

export interface FundReturns {
  return_2018_pct?: number | null;
  return_2019_pct?: number | null;
  return_2020_pct?: number | null;
  return_2021_pct?: number | null;
  return_2022_pct?: number | null;
  return_2023_pct?: number | null;
  return_2024_pct?: number | null;
  return_2025_pct?: number | null;
  return_1y_pct?: number | null;
  return_3m_pct?: number | null;
  return_6m_pct?: number | null;
  return_1m_pct?: number | null;
  return_3y_annualized_pct?: number | null;
  return_5y_annualized_pct?: number | null;
  return_since_inception_pct?: number | null;
  return_since_inception_annualized_pct?: number | null;
  returns_currency: string | null;
  returns_date: string | null;
  note?: string | null;
}

export interface FundProduct {
  fund_product_id: string;
  name: string;
  fund_type: FundType;
  category: FundType;
  currency: string;
  isin: string | null;
  inception_date: string | null;
  risk_level: number | null; // SRRI 1-7
  dividend_policy: DividendPolicy;
  investment_focus: string | null;
  recommended_horizon_months: number | null;
  aum_eur_approx: number | null;
  aum_rsd?: number | null;
  aum_date: string | null;
  nav_per_unit_eur: number | null;
  nav_per_unit_rsd: number | null;
  fees: FundFees;
  returns: FundReturns;
  tax_serbia_pct: number;
  min_investment_rsd: number | null;
  min_investment_eur: number | null;
  notes: string | null;
}

export interface FundCompanyJSON {
  fund_company_id: string;
  brand_name: string;
  official_name: string;
  website: string | null;
  logo_color?: string | null;
  regulator: string;
  inception_date: string | null;
  address: string | null;
  phone?: string | null;
  email?: string | null;
  group?: string | null;
  depozitar: string | null;
  availability: FundAvailability[];
  access_methods: FundAccessMethods;
  last_updated: string;
  data_sources?: string[];
  products: FundProduct[];
  pros: string[];
  risks: string[];
}

// Сквозной тип для отображения фонда + компании вместе (аналог TransformedMatrixItem)
export interface TransformedFundItem {
  id: string;
  fund_product_id: string;
  is_available: boolean;
  probability: Probability;
  availability_notes: string | null;
  product: FundProduct & {
    company: {
      name: string;
      official_name: string;
      website: string | null;
      logo_color: string | null;
      regulator: string;
      depozitar: string | null;
      access_methods: FundAccessMethods;
      pros: string[];
      risks: string[];
    };
  };
}
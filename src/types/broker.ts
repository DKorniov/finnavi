// src/types/broker.ts
import type { ResidencyStatus, Probability } from '@/types/bank';

export type BrokerType = 'international' | 'local';
export type FundingMethod = 'swift' | 'sepa' | 'card';
export type SuccessRate = 'high' | 'medium' | 'low' | 'blocked';

export interface BrokerAvailability {
  status: ResidencyStatus;
  is_available: boolean;
  probability: Probability;
  notes: string | null;
}

export interface FundingRoute {
  method: FundingMethod;
  bank_name: string;
  currency: string;
  success_rate: SuccessRate;
  fee_pct: number;
  notes: string | null;
}

export interface BrokerInstruments {
  stocks: boolean;
  etf: boolean;
  bonds_world: boolean;
  bonds_serbia: boolean;
  options: boolean;
  crypto: boolean;
}

export interface BrokerTaxSerbia {
  etf_capital_gains_pct: number | null;
  etf_dividend_pct: number | null;
  bonds_coupon_pct: number | null;
  bonds_capital_gains_pct: number | null;
  notes: string;
}

export interface BrokerJSON {
  broker_id: string;
  brand_name: string;
  broker_type: BrokerType;
  website: string;
  logo_color: string;
  last_updated: string;
  availability: BrokerAvailability[];
  instruments: BrokerInstruments;
  funding_routes: FundingRoute[];
  tax_serbia: BrokerTaxSerbia;
  pros: string[];
  risks: string[];
}
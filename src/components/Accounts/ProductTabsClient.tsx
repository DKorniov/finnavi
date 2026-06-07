// src/components/Accounts/ProductTabsClient.tsx
"use client";

import { useState } from "react";
import type { BankProduct, KYCRule, ResidencyStatus } from "@/types/bank";

// ─── Расширенные типы для новых полей ────────────────────────────────────────

type ExtProduct = BankProduct & {
  maintenance_fee_condition?: string | null;
  package_tier?: string | null;
  sepa_in?: { pct: number | null; min_rsd: number | null; notes?: string | null };
  sepa_out?: { pct: number | null; min_rsd: number | null; max_rsd?: number | null; notes?: string | null };
  atm_withdrawal_own_bank?: string | null;
  atm_withdrawal_other_bank?: string | null;
  cashback?: string | null;
  bonuses?: string | null;
  card_issue_days?: string | null;
  // бизнес-поля
  internal_transfer_fee_rsd?: number | null;
  internal_transfer_fee_condition?: string | null;
  cash_deposit_fee_pct?: number | null;
  cash_withdrawal_fee_pct?: number | null;
  // ипотека
  rate_margin_pct?: number | null;
  rate_base?: string | null;
  rate_fixed_period_years?: number | null;
  processing_fee_pct?: number | null;
  early_repayment_fee_pct?: number | null;
  insurance_required?: string[];
  // потреб
  purpose?: string | null;
  min_amount_rsd?: number | null;
  max_amount_rsd?: number | null;
  // облигации
  currencies_available?: string[];
};

type ExtKyc = KYCRule & { blocked_reasons?: string[] };

type TabId = 'conditions' | 'requirements' | 'limits' | 'bonuses' | 'bank';

// ─── Вспомогательные компоненты ──────────────────────────────────────────────

function Row({ label, value, sub, valueClass }: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-sm text-slate-500 shrink-0 max-w-[180px] leading-snug">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-medium ${valueClass ?? 'text-slate-900'}`}>{value}</span>
        {sub && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{sub}</p>}
      </div>
    </div>
  );
}

function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warn' | 'danger' }) {
  const cls = {
    info:   'bg-blue-50 border-blue-100 text-blue-800',
    warn:   'bg-amber-50 border-amber-100 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
  }[variant];
  return <div className={`border rounded-xl p-3.5 text-sm leading-relaxed my-3 ${cls}`}>{children}</div>;
}

function FeatureRow({ active, label, sub }: { active: boolean; label: string; sub?: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-slate-100 last:border-b-0">
      <div>
        <span className="text-sm text-slate-500">{label}</span>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-emerald-700' : 'text-slate-400'}`}>
        {active ? 'Есть' : 'Нет'}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-5 mb-1 first:mt-0">{children}</h4>;
}

function fmtFee(pct: number | null | undefined, min?: number | null, max?: number | null): string {
  if (pct === null || pct === undefined) return 'Нет данных';
  if (pct === 0 && !min) return 'Бесплатно';
  let s = pct === 0 ? 'Бесплатно' : `${pct}%`;
  if (min) s += ` (мин ${min.toLocaleString('ru-RU')} RSD)`;
  if (max) s += ` (макс ${max.toLocaleString('ru-RU')} RSD)`;
  return s;
}

function fmtStatus(status: ResidencyStatus): string {
  const m: Record<ResidencyStatus, string> = {
    non_resident: 'Нерезидент',
    resident_less_1y: 'ВНЖ до 1 года',
    resident_more_1y: 'Резидент 1г+',
    permanent_resident: 'ПМЖ',
    citizen: 'Гражданин',
  };
  return m[status];
}

// ─── Вкладки по категориям ───────────────────────────────────────────────────

// Условия — personal / business
function ConditionsAccount({ p }: { p: ExtProduct }) {
  return (
    <div>
      <Row label="Стоимость обслуживания"
        value={p.maintenance_fee_rsd === 0 ? 'Бесплатно' : p.maintenance_fee_rsd ? `${p.maintenance_fee_rsd} RSD / мес` : 'Нет данных'}
        sub={p.maintenance_fee_condition ?? undefined}
        valueClass={p.maintenance_fee_rsd === 0 ? 'text-emerald-700' : undefined}
      />
      <Row label="Порядок открытия"
        value={p.maintenance_fee_condition?.toLowerCase().includes('онлайн') ? 'Онлайн' : 'В отделении или онлайн'}
      />
      {p.card_issue_days && <Row label="Срок изготовления карты" value={p.card_issue_days} valueClass="text-slate-700" />}
      <Row label="Карты" value={[...(p.cards?.international ?? []), 'DinaCard'].join(', ')} />
      <Row label="Валюты счёта" value={(p.supported_currencies ?? ['RSD']).join(', ')} />
      <Row label="Мультивалютный"
        value={p.is_multicurrency ? 'Да' : 'Нет'}
        valueClass={p.is_multicurrency ? 'text-emerald-700' : 'text-slate-400'}
      />
      {p.notes && <InfoBox variant="info">{p.notes}</InfoBox>}
    </div>
  );
}

// Условия — savings
function ConditionsSavings({ p }: { p: ExtProduct }) {
  const hasTerms = (p.terms?.length ?? 0) > 0;
  return (
    <div>
      <Row label="Тип вклада" value={(p as ExtProduct & { deposit_type?: string }).deposit_type === 'orocena' ? 'Срочный' : 'До востребования / целевой'} />
      <Row label="Валюта" value={(p.currencies ?? p.supported_currencies ?? ['RSD']).join(', ')} />
      <Row label="Налог на доход"
        value={p.tax_on_interest_pct === 0 ? '0% — Tax Free' : `${p.tax_on_interest_pct}%`}
        valueClass={p.tax_on_interest_pct === 0 ? 'text-emerald-700' : undefined}
      />
      {p.min_amount_rsd && <Row label="Минимальная сумма" value={`${p.min_amount_rsd.toLocaleString('ru-RU')} RSD`} />}
      {p.min_amount_eur && <Row label="Минимальная сумма" value={`${p.min_amount_eur} EUR`} />}
      <Row label="Доступен нерезидентам"
        value={p.is_available_non_resident ? 'Да' : 'Нет'}
        valueClass={p.is_available_non_resident ? 'text-emerald-700' : 'text-red-600'}
      />
      {!hasTerms && <InfoBox variant="warn">Процентные ставки уточняются. Загрузите документ «Kamatne stope» в NotebookLM для получения актуальных данных.</InfoBox>}
      {p.notes && <InfoBox variant="info">{p.notes}</InfoBox>}
    </div>
  );
}

// Условия — ипотека
function ConditionsMortgage({ p }: { p: ExtProduct }) {
  return (
    <div>
      <Row label="Ставка (примерная)"
        value={p.rate_approx_total_pct ? `~${p.rate_approx_total_pct}% годовых` : 'Уточнять в банке'}
        valueClass="font-semibold"
      />
      <Row label="Тип ставки"
        value={p.rate_type === 'variable' ? 'Переменная' : p.rate_type === 'fixed' ? 'Фиксированная' : 'Комбинированная'}
      />
      {p.rate_base && <Row label="База" value={p.rate_base} />}
      {p.rate_margin_pct && <Row label="Маржа банка" value={`${p.rate_margin_pct}%`} />}
      {p.rate_fixed_period_years && (
        <Row label="Фиксированный период" value={`${p.rate_fixed_period_years} лет`} valueClass="text-blue-700" />
      )}
      <Row label="LTV (макс)" value={p.max_ltv_pct ? `${p.max_ltv_pct}%` : 'Нет данных'} />
      <Row label="Первый взнос от" value={p.min_down_payment_pct ? `${p.min_down_payment_pct}%` : 'Нет данных'} />
      {p.loan_term_years?.length && (
        <Row label="Срок" value={`${Math.min(...p.loan_term_years)}–${Math.max(...p.loan_term_years)} лет`} />
      )}
      {p.min_amount_eur && <Row label="Сумма от" value={`${p.min_amount_eur.toLocaleString('ru-RU')} EUR`} />}
      {p.max_amount_eur && <Row label="Сумма до" value={`${p.max_amount_eur.toLocaleString('ru-RU')} EUR`} />}
      {p.notes && <InfoBox variant="info">{p.notes}</InfoBox>}
    </div>
  );
}

// Условия — потреб кредит
function ConditionsConsumer({ p }: { p: ExtProduct }) {
  const purposeLabel: Record<string, string> = {
    general: 'Нецелевой',
    refinancing: 'Рефинансирование',
    auto: 'Автокредит',
    renovation: 'Ремонт',
  };
  return (
    <div>
      {p.purpose && <Row label="Цель" value={purposeLabel[p.purpose] ?? p.purpose} />}
      <Row label="Ставка" value={p.rate_approx_pct ? `~${p.rate_approx_pct}% годовых` : 'Уточнять в банке'} valueClass="font-semibold" />
      <Row label="Тип ставки" value={p.rate_type === 'fixed' ? 'Фиксированная' : 'Переменная'} />
      <Row label="Валюта" value={p.currency ?? 'RSD'} />
      {p.loan_term_months?.length && (
        <Row label="Срок" value={`${Math.min(...p.loan_term_months)}–${Math.max(...p.loan_term_months)} мес`} />
      )}
      {p.min_amount_rsd && <Row label="Сумма от" value={`${p.min_amount_rsd.toLocaleString('ru-RU')} RSD`} />}
      {p.max_amount_rsd && <Row label="Сумма до" value={`${p.max_amount_rsd.toLocaleString('ru-RU')} RSD`} />}
      {p.min_amount_eur && <Row label="Сумма от" value={`${p.min_amount_eur.toLocaleString('ru-RU')} EUR`} />}
      {p.max_amount_eur && <Row label="Сумма до" value={`${p.max_amount_eur.toLocaleString('ru-RU')} EUR`} />}
      {p.income_requirement && <Row label="Требования к доходу" value={p.income_requirement} />}
      {p.notes && <InfoBox variant="info">{p.notes}</InfoBox>}
    </div>
  );
}

// Условия — облигации
function ConditionsBonds({ p }: { p: ExtProduct }) {
  return (
    <div>
      <InfoBox variant="info">
        <strong>Гособлигации Сербии — Tax Free.</strong> Купоны и прирост капитала полностью освобождены от налога для физлиц.
      </InfoBox>
      {p.yield_eur_approx_pct != null && <Row label="Доходность EUR" value={`~${p.yield_eur_approx_pct}%`} valueClass="text-emerald-700 font-semibold" />}
      {p.yield_rsd_approx_pct != null && <Row label="Доходность RSD" value={`~${p.yield_rsd_approx_pct}%`} valueClass="text-emerald-700 font-semibold" />}
      <Row label="Налог на купоны" value="0% — Tax Free" valueClass="text-emerald-700" />
      <Row label="Комиссия за вход" value={p.entry_fee_pct != null ? `${p.entry_fee_pct}%` : '—'} valueClass={(p.entry_fee_pct ?? 0) > 1 ? 'text-amber-700' : undefined} />
      <Row label="Депозитарное хранение" value={p.custody_fee_pct_annual != null ? `${p.custody_fee_pct_annual}% / год` : '—'} />
      <Row label="Получение купона" value={p.coupon_collection_fee_pct != null ? `${p.coupon_collection_fee_pct}%` : '—'} />
      {p.min_investment_eur != null && <Row label="Минимальная инвестиция" value={`${p.min_investment_eur} EUR`} />}
      <Row label="Способ покупки" value="Только в отделении банка" valueClass="text-slate-600" />
      {(p.entry_fee_pct ?? 0) > 1 && (
        <InfoBox variant="warn">При комиссии за вход {p.entry_fee_pct}% инвестиция окупается только на горизонте 3+ лет.</InfoBox>
      )}
    </div>
  );
}

// Условия — переводы
function ConditionsTransfer({ p }: { p: ExtProduct }) {
  return (
    <div>
      <Row label="Входящий SWIFT"
        value={fmtFee(p.fee_incoming_pct, p.fee_incoming_min_rsd)}
        valueClass={p.fee_incoming_pct === 0 ? 'text-emerald-700' : (p.fee_incoming_pct ?? 0) >= 0.8 ? 'text-amber-700' : undefined}
      />
      <Row label="Исходящий SWIFT"
        value={fmtFee(p.fee_outgoing_pct, p.fee_outgoing_min_rsd)}
        valueClass={(p.fee_outgoing_pct ?? 0) >= 0.5 ? 'text-amber-700' : undefined}
      />
      {p.supported_currencies && <Row label="Поддерживаемые валюты" value={p.supported_currencies.join(', ')} />}
    </div>
  );
}

// Требования (KYC)
function RequirementsTab({ kyc, bankName, userStatus, userLegalType }: {
  kyc: ExtKyc | undefined;
  bankName: string;
  userStatus: ResidencyStatus;
  userLegalType: string;
}) {
  if (!kyc) return <p className="text-sm text-slate-400 py-4">Данные по KYC не найдены</p>;
  const isBlocked = !kyc.is_available || kyc.probability === 'blocked';

  return (
    <div>
      <Row label="Ваш статус" value={fmtStatus(userStatus)} />
      <Row label="Тип лица" value={userLegalType === 'business' ? 'ИП / Юрлицо' : 'Физическое лицо'} />
      <Row label="Вероятность открытия"
        value={isBlocked ? 'Не открывают' : kyc.probability === 'high' ? 'Высокая' : kyc.probability === 'medium' ? 'Сербский рандом (50/50)' : 'Низкая'}
        valueClass={isBlocked ? 'text-red-700' : kyc.probability === 'high' ? 'text-emerald-700' : 'text-amber-700'}
      />

      {isBlocked && (kyc.blocked_reasons?.length ?? 0) > 0 && (
        <InfoBox variant="danger">
          <p className="font-semibold mb-2">Причины отказа в {bankName}</p>
          <ul className="space-y-1.5">
            {kyc.blocked_reasons!.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="shrink-0">→</span>{r}</li>
            ))}
          </ul>
        </InfoBox>
      )}

      {kyc.required_docs.length > 0 && (
        <>
          <SectionTitle>Необходимые документы</SectionTitle>
          <ul className="space-y-2 py-2">
            {kyc.required_docs.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {doc}
              </li>
            ))}
          </ul>
        </>
      )}

      {kyc.red_flags.length > 0 && (
        <InfoBox variant="warn">
          <p className="font-semibold mb-1">⚠️ Сербский рандом</p>
          <ul className="space-y-1">
            {kyc.red_flags.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </InfoBox>
      )}
    </div>
  );
}

// Лимиты и комиссии
function LimitsTab({ p }: { p: ExtProduct }) {
  const isAccount = p.category === 'personal_account' || p.category === 'business_account';
  const isBusiness = p.category === 'business_account';

  if (!isAccount) {
    return (
      <div>
        {p.category === 'credit_mortgage' && (
          <>
            <Row label="Досрочное погашение"
              value={p.early_repayment_fee_pct === 0 ? 'Бесплатно' : p.early_repayment_fee_pct != null ? `${p.early_repayment_fee_pct}%` : 'Нет данных'}
              valueClass={p.early_repayment_fee_pct === 0 ? 'text-emerald-700' : undefined}
            />
            <Row label="Комиссия за оформление"
              value={p.processing_fee_pct != null ? `${p.processing_fee_pct}%` : 'Нет данных'}
              valueClass={(p.processing_fee_pct ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}
            />
            {p.insurance_required && p.insurance_required.length > 0 && (
              <>
                <SectionTitle>Обязательное страхование</SectionTitle>
                {p.insurance_required.map((ins, i) => (
                  <Row key={i} label="" value={ins} />
                ))}
              </>
            )}
          </>
        )}
        {p.category === 'credit_consumer' && (
          <>
            <Row label="Комиссия за оформление"
              value={p.processing_fee_pct != null ? `до ${p.processing_fee_pct}%` : 'Нет данных'}
              valueClass={(p.processing_fee_pct ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}
            />
            <Row label="Досрочное погашение"
              value={p.early_repayment_fee_pct === 0 ? 'Бесплатно' : p.early_repayment_fee_pct != null ? `${p.early_repayment_fee_pct}%` : 'Нет данных'}
            />
          </>
        )}
        {p.category === 'savings_deposit' && (
          p.terms && p.terms.length > 0 ? (
            <>
              <SectionTitle>Ставки по срокам</SectionTitle>
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="text-left py-2 pr-4">Срок</th>
                    <th className="text-right py-2 pr-4">Ставка</th>
                    <th className="text-right py-2">Штраф за досрочный выход</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {p.terms.map((t) => (
                    <tr key={t.term_months}>
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{t.term_months} мес</td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-emerald-700">{t.rate_pct}%</td>
                      <td className="py-2.5 text-right text-slate-500 text-xs">
                        {t.early_withdrawal_penalty_pct === 0 ? 'Нет' : t.early_withdrawal_penalty_pct === 100 ? 'Потеря всех %' : 'Потеря 50% дохода'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <InfoBox variant="warn">Ставки уточняются — данные появятся после верификации тарифного документа.</InfoBox>
          )
        )}
        {p.category === 'transfer' && (
          <>
            <Row label="Входящий SWIFT" value={fmtFee(p.fee_incoming_pct, p.fee_incoming_min_rsd)} valueClass={p.fee_incoming_pct === 0 ? 'text-emerald-700' : undefined} />
            <Row label="Исходящий SWIFT" value={fmtFee(p.fee_outgoing_pct, p.fee_outgoing_min_rsd)} />
            {p.outgoing_resident_restriction && (
              <InfoBox variant="warn">{p.outgoing_resident_restriction}</InfoBox>
            )}
            {p.outgoing_resident_1y_plus && (
              <InfoBox variant="info">Резиденты 1г+: {p.outgoing_resident_1y_plus}</InfoBox>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Входящие переводы</SectionTitle>
      {p.swift_in && (
        <Row label="Входящий SWIFT"
          value={fmtFee(p.swift_in.pct, p.swift_in.min_rsd, p.swift_in.max_rsd)}
          sub={p.swift_in.notes ?? undefined}
          valueClass={p.swift_in.pct === 0 ? 'text-emerald-700' : (p.swift_in.pct ?? 0) >= 0.8 ? 'text-amber-700' : undefined}
        />
      )}
      {p.sepa_in && (
        <Row label="Входящий SEPA"
          value={fmtFee(p.sepa_in.pct, p.sepa_in.min_rsd)}
          sub={p.sepa_in.notes ?? undefined}
          valueClass={p.sepa_in.pct === 0 ? 'text-emerald-700' : undefined}
        />
      )}

      <SectionTitle>Исходящие переводы</SectionTitle>
      {p.swift_out && (
        <Row label="Исходящий SWIFT"
          value={p.swift_out.pct != null ? fmtFee(p.swift_out.pct, p.swift_out.min_rsd, p.swift_out.max_rsd) : 'Нет данных'}
          sub={p.swift_out.notes ?? undefined}
          valueClass={(p.swift_out.pct ?? 0) >= 0.5 ? 'text-amber-700' : undefined}
        />
      )}
      {p.sepa_out && (
        <Row label="Исходящий SEPA"
          value={fmtFee(p.sepa_out.pct, p.sepa_out.min_rsd, p.sepa_out.max_rsd)}
          sub={p.sepa_out.notes ?? undefined}
        />
      )}

      <SectionTitle>Банкоматы</SectionTitle>
      <Row label="Банкоматы банка" value={p.atm_withdrawal_own_bank ?? 'Нет данных'} valueClass="text-slate-700" />
      {p.atm_withdrawal_other_bank && (
        <Row label="Чужие банкоматы" value={p.atm_withdrawal_other_bank} />
      )}

      {isBusiness && (
        <>
          <SectionTitle>Операции по счёту</SectionTitle>
          {p.internal_transfer_fee_rsd != null && (
            <Row label="Внутренний перевод"
              value={`${p.internal_transfer_fee_rsd} RSD`}
              sub={p.internal_transfer_fee_condition ?? undefined}
            />
          )}
          {p.cash_withdrawal_fee_pct != null && (
            <Row label="Снятие наличных"
              value={p.cash_withdrawal_fee_pct === 0 ? 'Бесплатно' : `${p.cash_withdrawal_fee_pct}%`}
              valueClass={p.cash_withdrawal_fee_pct === 0 ? 'text-emerald-700' : undefined}
            />
          )}
        </>
      )}
    </div>
  );
}

// Привилегии и бонусы
function BonusesTab({ p }: { p: ExtProduct }) {
  const hasCashback = p.cashback && p.cashback !== 'Нет' && p.cashback !== 'Нет программы кэшбэка';

  return (
    <div>
      <Row label="Кэшбэк"
        value={p.cashback ?? 'Нет'}
        valueClass={hasCashback ? 'text-emerald-700' : 'text-slate-400'}
      />
      <Row label="Проценты на остаток" value="Нет" valueClass="text-slate-400" />
      <Row label="Бесконтактная оплата"
        value={p.features?.contactless ? 'Бесконтакт' : 'Нет'}
        valueClass={p.features?.contactless ? 'text-emerald-700' : 'text-slate-400'}
      />
      <Row label="Оплата мобильным"
        value={[
          p.features?.apple_pay && 'Apple Pay',
          p.features?.google_pay && 'Google Pay',
          p.features?.garmin_pay && 'Garmin Pay',
        ].filter(Boolean).join(' / ') || 'Нет'}
        valueClass={p.features?.apple_pay || p.features?.google_pay || p.features?.garmin_pay ? 'text-emerald-700' : 'text-slate-400'}
      />
      {p.bonuses ? (
        <Row label="Скидки и бонусы" value={p.bonuses} valueClass="text-slate-700" />
      ) : (
        <Row label="Скидки и бонусы" value="Нет программы" valueClass="text-slate-400" />
      )}
      <FeatureRow active={p.features?.prenesi ?? false} label="Prenesi (перевод по номеру)" />
      <FeatureRow active={p.features?.ips_qr ?? false} label="IPS QR-платежи" />
    </div>
  );
}

// О банке
function AboutBankTab({ bankName, website, lastUpdated }: {
  bankName: string;
  website: string;
  lastUpdated: string;
}) {
  const bankDescriptions: Record<string, string> = {
    'Raiffeisen Bank': 'Дочерняя структура австрийской группы Raiffeisen Bank International (RBI). Один из крупнейших частных банков Сербии. Сильная технологическая платформа, развитый интернет-банкинг. Для экспатов: осторожная комплаенс-политика — с 2024 года ужесточены требования к гражданам РФ/РБ.',
    'Alta Banka': 'Средний сербский банк с лояльной политикой к иностранцам. Уникальная особенность: принимает переводы в рублях и юанях — редкость на сербском рынке. Рекомендован экспат-комьюнити как один из самых доступных для нерезидентов.',
    'Banca Intesa': 'Крупнейший банк Сербии по кредитному портфелю, дочерняя структура итальянской Intesa Sanpaolo. Широкая сеть отделений. Для экспатов: строгая AML-политика материнской группы с 2022 года существенно ограничила доступ для граждан РФ/РБ.',
    'OTP Banka': 'Венгерский OTP Group, входит в топ-5 банков Сербии. Один из немногих, кто открывает брокерский счёт нерезидентам для покупки гособлигаций. Комиссии SWIFT выше среднего по рынку.',
    'Poštanska Štedionica': 'Государственный банк Сербии с широчайшей сетью отделений через Pošta Serbia. Самый лояльный к нерезидентам и новым ИП. Рекомендован как первый банк для только что приехавших экспатов.',
  };

  const desc = bankDescriptions[bankName] ?? `${bankName} — банк, работающий на территории Сербии под надзором Народного банка Сербии (НБС).`;

  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0 mt-0.5">
          {bankName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-1">{bankName}</p>
          <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
        </div>
      </div>
      <Row label="Регулятор" value="Народный банк Сербии (НБС)" />
      <Row label="Гарантирование вкладов" value="АДВ — до 50 000 EUR" valueClass="text-emerald-700" />
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-4"
      >
        Официальный сайт банка
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
      <p className="text-xs text-slate-400 mt-4">Информация актуальна на {lastUpdated}</p>
    </div>
  );
}

// ─── Главный экспортируемый компонент ────────────────────────────────────────

interface ProductTabsClientProps {
  product: ExtProduct;
  kyc: ExtKyc | undefined;
  bankName: string;
  website: string;
  lastUpdated: string;
  userStatus: ResidencyStatus;
  userLegalType: string;
}

export function ProductTabsClient({
  product,
  kyc,
  bankName,
  website,
  lastUpdated,
  userStatus,
  userLegalType,
}: ProductTabsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('conditions');

  const isAccount = product.category === 'personal_account' || product.category === 'business_account';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'conditions',   label: 'Условия' },
    { id: 'requirements', label: 'Требования' },
    ...(isAccount ? [{ id: 'limits' as TabId, label: 'Лимиты и комиссии' }] : []),
    ...(isAccount ? [{ id: 'bonuses' as TabId, label: 'Привилегии и бонусы' }] : []),
    { id: 'bank', label: 'О банке' },
  ];

  return (
    <div>
      {/* Таб-навигация */}
      <div className="flex gap-0 border-b border-slate-200 mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors font-medium shrink-0 ${
              activeTab === tab.id
                ? 'border-blue-600 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      <div>
        {activeTab === 'conditions' && (
          <>
            {(product.category === 'personal_account' || product.category === 'business_account') && <ConditionsAccount p={product} />}
            {product.category === 'savings_deposit' && <ConditionsSavings p={product} />}
            {product.category === 'credit_mortgage' && <ConditionsMortgage p={product} />}
            {product.category === 'credit_consumer' && <ConditionsConsumer p={product} />}
            {product.category === 'investment_bonds' && <ConditionsBonds p={product} />}
            {product.category === 'transfer' && <ConditionsTransfer p={product} />}
          </>
        )}
        {activeTab === 'requirements' && (
          <RequirementsTab kyc={kyc} bankName={bankName} userStatus={userStatus} userLegalType={userLegalType} />
        )}
        {activeTab === 'limits' && <LimitsTab p={product} />}
        {activeTab === 'bonuses' && <BonusesTab p={product} />}
        {activeTab === 'bank' && <AboutBankTab bankName={bankName} website={website} lastUpdated={lastUpdated} />}
      </div>
    </div>
  );
}
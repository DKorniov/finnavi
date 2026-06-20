// src/components/Credits/CreditTab.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CreditDrawer } from "@/components/Credits/CreditDrawer";
import type { TransformedMatrixItem, Probability } from "@/types/bank";

const BANKS_COLOR: Record<string, string> = {
  "Raiffeisen Bank":      "#FFCC00",
  "Alta Banka":           "#CC0000",
  "Banca Intesa":         "#003087",
  "OTP Banka":            "#43B02A",
  "Poštanska Štedionica": "#003DA5",
};
const BANKS_DARK = new Set(["Raiffeisen Bank"]);
const BANKS_INITIALS: Record<string, string> = {
  "Raiffeisen Bank":      "RB",
  "Alta Banka":           "AL",
  "Banca Intesa":         "BI",
  "OTP Banka":            "OT",
  "Poštanska Štedionica": "PŠ",
};

type CreditSubTab = "mortgage" | "auto" | "consumer";

const SUBTABS: { id: CreditSubTab; label: string }[] = [
  { id: "mortgage", label: "🏠 Ипотека"         },
  { id: "auto",     label: "🚗 Авто кредит"     },
  { id: "consumer", label: "💳 Потребительский" },
];

interface CalcFilter {
  amount_eur:   number;
  term_months:  number;
}

interface CreditTabProps {
  items: TransformedMatrixItem[];
}

// ─── хелперы ───────────────────────────────────────────────────────────────

function getSubTab(item: TransformedMatrixItem): CreditSubTab {
  if (item.products.category === "credit_mortgage") return "mortgage";
  if (item.products.purpose === "auto") return "auto";
  return "consumer";
}

function getApproxRate(item: TransformedMatrixItem): number {
  const p = item.products;
  return p.rate_approx_total_pct ?? p.rate_approx_pct ?? 5;
}

// Приблизительный курс для перевода фильтра суммы (задаётся в EUR) в RSD-эквивалент
// при расчёте платежа по динарским продуктам. Курс ориентировочный, не биржевой —
// используется только для слайдера суммы, не для реальных расчётов клиента.
const EUR_TO_RSD_RATE = 117;

function calcMonthlyPayment(amount: number, annualRatePct: number, termMonths: number): number {
  if (termMonths <= 0 || amount <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return amount / termMonths;
  return amount * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

function rateLabel(item: TransformedMatrixItem): string {
  const p = item.products;
  if (p.category === "credit_mortgage") {
    if (p.rate_type === "variable") {
      const base   = p.rate_base ?? "";
      const margin = p.rate_margin_pct != null ? `+${p.rate_margin_pct}%` : "";
      const approx = p.rate_approx_total_pct != null ? ` ≈${p.rate_approx_total_pct}%` : "";
      return `${base}${margin}${approx} плав.`;
    }
    if (p.rate_type === "combined") {
      const period = p.rate_fixed_period_years ? `${p.rate_fixed_period_years}г фикс` : "комби";
      const approx = p.rate_approx_total_pct != null ? ` ≈${p.rate_approx_total_pct}%` : "";
      return `${period}${approx}`;
    }
    return p.rate_approx_total_pct != null ? `${p.rate_approx_total_pct}% фикс` : "—";
  }
  return p.rate_approx_pct != null
    ? `≈${p.rate_approx_pct}% ${p.rate_type === "fixed" ? "фикс" : "плав"}`
    : "—";
}

function termLabel(item: TransformedMatrixItem): string {
  const p = item.products;
  if (p.loan_term_years?.length) {
    const arr = p.loan_term_years;
    return arr.length === 1 ? `до ${arr[0]} лет` : `${arr[0]}–${arr[arr.length - 1]} лет`;
  }
  if (p.loan_term_months?.length) {
    const arr = p.loan_term_months;
    return arr.length === 1 ? `до ${arr[0]} мес` : `${arr[0]}–${arr[arr.length - 1]} мес`;
  }
  return "—";
}

function amountLabel(item: TransformedMatrixItem): string {
  const p = item.products;
  if (p.min_amount_eur != null || p.max_amount_eur != null) {
    const min = p.min_amount_eur ? `€${(p.min_amount_eur / 1000).toFixed(0)}k` : null;
    const max = p.max_amount_eur ? `€${(p.max_amount_eur / 1000).toFixed(0)}k` : null;
    if (min && max) return `${min} – ${max}`;
    if (max) return `до ${max}`;
    if (min) return `от ${min}`;
  }
  if (p.min_amount_rsd != null || p.max_amount_rsd != null) {
    const min = p.min_amount_rsd ? `${(p.min_amount_rsd / 1000).toFixed(0)}k` : null;
    const max = p.max_amount_rsd ? `${(p.max_amount_rsd / 1000).toFixed(0)}k` : null;
    if (min && max) return `${min}–${max} RSD`;
    if (max) return `до ${max} RSD`;
    if (min) return `от ${min} RSD`;
  }
  return "—";
}

function matchesAmount(item: TransformedMatrixItem, amountEur: number): boolean {
  const p = item.products;
  const minEur = p.min_amount_eur ?? (p.min_amount_rsd ? p.min_amount_rsd / EUR_TO_RSD_RATE : 0);
  const maxEur = p.max_amount_eur ?? (p.max_amount_rsd ? p.max_amount_rsd / EUR_TO_RSD_RATE : Infinity);
  return amountEur >= minEur && amountEur <= maxEur;
}

function matchesTerm(item: TransformedMatrixItem, termMonths: number): boolean {
  const p = item.products;
  if (p.loan_term_years?.length) {
    const maxM = Math.max(...p.loan_term_years) * 12;
    const minM = Math.min(...p.loan_term_years) * 12;
    return termMonths >= minM && termMonths <= maxM;
  }
  if (p.loan_term_months?.length) {
    return termMonths >= Math.min(...p.loan_term_months) &&
           termMonths <= Math.max(...p.loan_term_months);
  }
  return true;
}

function termStr(months: number): string {
  if (months < 12) return `${months} мес`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y} лет` : `${y} лет ${m} мес`;
}

// Фильтр суммы всегда задаётся в EUR (единая шкала для слайдера), но платёж
// нужно считать и показывать в РЕАЛЬНОЙ валюте продукта — иначе для RSD-кредита
// показывается ставка/сумма в RSD, а платёж в евро, что финансово некорректно.
function getProductCurrency(item: TransformedMatrixItem): "RSD" | "EUR" {
  return item.products.currency === "RSD" ? "RSD" : "EUR";
}

function calcPaymentInProductCurrency(item: TransformedMatrixItem, calcFilter: CalcFilter): { payment: number; principal: number; currency: "RSD" | "EUR" } {
  const currency = getProductCurrency(item);
  const principal = currency === "RSD" ? calcFilter.amount_eur * EUR_TO_RSD_RATE : calcFilter.amount_eur;
  const rate = getApproxRate(item);
  const payment = calcMonthlyPayment(principal, rate, calcFilter.term_months);
  return { payment, principal, currency };
}

function formatMoney(amount: number, currency: "RSD" | "EUR"): string {
  const rounded = Math.round(amount).toLocaleString("ru-RU");
  return currency === "RSD" ? `${rounded} RSD` : `€${rounded}`;
}

// ─── Tag ────────────────────────────────────────────────────────────────────

function Tag({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ─── KYC-бейдж ─────────────────────────────────────────────────────────────

function KycBadge({ probability, isAvailable }: { probability: Probability; isAvailable: boolean }) {
  if (!isAvailable || probability === "blocked")
    return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 whitespace-nowrap">Недоступен</span>;
  if (probability === "high")
    return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">Высокая вероятность</span>;
  if (probability === "medium")
    return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 whitespace-nowrap">Сербский рандом</span>;
  return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 whitespace-nowrap">Сложно</span>;
}

// ─── Строка продукта ─────────────────────────────────────────────────────────

function ProductRow({ item, calcFilter, onInfoClick }: {
  item: TransformedMatrixItem;
  calcFilter: CalcFilter;
  onInfoClick: (item: TransformedMatrixItem) => void;
}) {
  const p        = item.products;
  const bankName = p.banks.name;
  const logoColor = BANKS_COLOR[bankName] ?? "#1e293b";
  const logoText  = BANKS_DARK.has(bankName) ? "#1e293b" : "#ffffff";
  const logoInit  = BANKS_INITIALS[bankName] ?? bankName.charAt(0);
  const isBlocked = !item.is_available || item.probability === "blocked";

  const { payment, currency } = calcPaymentInProductCurrency(item, calcFilter);

  return (
    <article
      className={`bg-white border rounded-2xl px-5 py-4 transition-colors ${
        isBlocked ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Лого */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ backgroundColor: logoColor, color: logoText }}
        >
          {logoInit}
        </div>

        {/* Название + банк */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{p.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{bankName}</p>
        </div>

        {/* Ставка */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Ставка</p>
          <p className="text-sm font-semibold text-slate-900">{rateLabel(item)}</p>
        </div>

        {/* Платёж/мес — расчётная величина, главная метрика для сравнения */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">платёж/мес</p>
          <p className="text-sm font-semibold text-slate-900">{formatMoney(payment, currency)}</p>
        </div>

        {/* Вероятность */}
        <KycBadge probability={item.probability} isAvailable={item.is_available} />

        {/* Кнопка ⓘ */}
        <button
          onClick={() => onInfoClick(item)}
          aria-label={`Детали: ${p.name}`}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Кнопка Подробнее */}
        <Link
          href={`/accounts/product/${p.product_id}`}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Подробнее
        </Link>
      </div>

      {/* Теги — отдельной строкой снизу, с переносом */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
        <Tag label={currency} cls={currency === "RSD" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"} />
        <Tag label={`Срок ${termLabel(item)}`} cls="bg-slate-100 text-slate-600 border-slate-200" />
        <Tag label={`Сумма ${amountLabel(item)}`} cls="bg-slate-100 text-slate-600 border-slate-200" />
        {p.rate_type === "fixed" && <Tag label="Фиксированная" cls="bg-emerald-50 text-emerald-700 border-emerald-200" />}
        {p.rate_type === "variable" && <Tag label="Плавающая" cls="bg-amber-50 text-amber-700 border-amber-200" />}
        {p.rate_type === "combined" && <Tag label="Комбо ставка" cls="bg-blue-50 text-blue-700 border-blue-200" />}
        {p.category === "credit_mortgage" && p.min_down_payment_pct != null && (
          <Tag label={`Взнос от ${p.min_down_payment_pct}%`} cls="bg-slate-100 text-slate-500 border-slate-200" />
        )}
        {p.category === "credit_mortgage" && p.max_ltv_pct != null && (
          <Tag label={`LTV до ${p.max_ltv_pct}%`} cls="bg-slate-100 text-slate-500 border-slate-200" />
        )}
        {p.processing_fee_pct === 0 && <Tag label="Без комиссии" cls="bg-emerald-50 text-emerald-700 border-emerald-200" />}
        {p.early_repayment_fee_pct === 0 && <Tag label="Досрочное бесплатно" cls="bg-emerald-50 text-emerald-700 border-emerald-200" />}
      </div>
    </article>
  );
}

// ─── Фильтр-калькулятор ──────────────────────────────────────────────────────

function CalcFilterPanel({ subTab, filter, onChange }: {
  subTab: CreditSubTab;
  filter: CalcFilter;
  onChange: (f: CalcFilter) => void;
}) {
  const isMortgage = subTab === "mortgage";
  const isAuto     = subTab === "auto";

  const maxAmount = isMortgage ? 750000 : isAuto ? 50000 : 10000;
  const minAmount = isMortgage ? 10000  : 500;
  const stepAmt   = isMortgage ? 5000   : isAuto ? 1000 : 500;
  const maxTerm   = isMortgage ? 360    : isAuto ? 84   : 71;
  const minTerm   = isMortgage ? 12     : 6;
  const stepTerm  = isMortgage ? 12     : 6;

  const avgRate   = isMortgage ? 4.5 : isAuto ? 5.5 : 8.5;
  const examplePmt = calcMonthlyPayment(filter.amount_eur, avgRate, filter.term_months);
  const exampleTotal = examplePmt * filter.term_months;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isMortgage ? "Сумма ипотеки" : "Сумма кредита"}
            </span>
            <span className="text-sm font-bold text-slate-900">
              €{filter.amount_eur.toLocaleString("ru-RU")}
            </span>
          </div>
          <input type="range" min={minAmount} max={maxAmount} step={stepAmt}
            value={filter.amount_eur}
            onChange={e => onChange({ ...filter, amount_eur: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>€{(minAmount / 1000).toFixed(0)}k</span>
            <span>€{(maxAmount / 1000).toFixed(0)}k</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Срок</span>
            <span className="text-sm font-bold text-slate-900">{termStr(filter.term_months)}</span>
          </div>
          <input type="range" min={minTerm} max={maxTerm} step={stepTerm}
            value={filter.term_months}
            onChange={e => onChange({ ...filter, term_months: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{termStr(minTerm)}</span>
            <span>{termStr(maxTerm)}</span>
          </div>
        </div>
      </div>

      {/* Итоговая плашка */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          По средней ставке {avgRate}%:
          <span className="font-bold text-slate-900 text-sm">
            €{Math.round(examplePmt).toLocaleString("ru-RU")}/мес
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Итого: €{Math.round(exampleTotal).toLocaleString("ru-RU")} · переплата €{Math.round(exampleTotal - filter.amount_eur).toLocaleString("ru-RU")}
        </span>
      </div>
    </div>
  );
}

// ─── Секция по валюте — внутри всегда группировка по банку ──────────────────

function CreditSection({ title, items, calcFilter, onInfoClick }: {
  title: string;
  items: TransformedMatrixItem[];
  calcFilter: CalcFilter;
  onInfoClick: (item: TransformedMatrixItem) => void;
}) {
  const groupedByBank = useMemo(() => {
    return items.reduce((acc, item) => {
      const bankName = item.products.banks.name;
      if (!acc[bankName]) acc[bankName] = [];
      acc[bankName].push(item);
      return acc;
    }, {} as Record<string, TransformedMatrixItem[]>);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="mt-5 first:mt-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <span className="text-[11px] bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {Object.entries(groupedByBank).map(([bankName, bankItems]) => (
          <div key={bankName}>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 pl-1">
              {bankName}
            </p>
            <div className="flex flex-col gap-2">
              {bankItems.map(item => (
                <ProductRow key={item.id} item={item} calcFilter={calcFilter} onInfoClick={onInfoClick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export function CreditTab({ items }: CreditTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<CreditSubTab>("mortgage");
  const [drawerItem, setDrawerItem] = useState<TransformedMatrixItem | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "RSD" | "EUR">("all");
  const [filters, setFilters] = useState<Record<CreditSubTab, CalcFilter>>({
    mortgage: { amount_eur: 80000, term_months: 240 },
    auto:     { amount_eur: 15000, term_months: 60  },
    consumer: { amount_eur: 5000,  term_months: 36  },
  });

  const currentFilter = filters[activeSubTab];

  const creditItems = useMemo(
    () => items.filter(i =>
      i.products.category === "credit_mortgage" || i.products.category === "credit_consumer"
    ),
    [items]
  );

  const itemsInSubTab = useMemo(
    () => creditItems.filter(i => getSubTab(i) === activeSubTab),
    [creditItems, activeSubTab]
  );

  // Валюты считаем по ВСЕЙ категории кредитов, а не только текущей подвкладке —
  // иначе на Ипотеке (всегда EUR) и Потребительском (всегда RSD) фильтр пропадал бы,
  // хотя это общий фильтр, который должен быть на месте всегда (как в Сбережениях).
  const currencyOptions = useMemo(() => {
    const set = new Set<"RSD" | "EUR">();
    creditItems.forEach(i => set.add(getProductCurrency(i)));
    return Array.from(set);
  }, [creditItems]);

  const filtered = useMemo(() => {
    return itemsInSubTab.filter(item => {
      if (currencyFilter !== "all" && getProductCurrency(item) !== currencyFilter) return false;
      if (!matchesAmount(item, currentFilter.amount_eur)) return false;
      if (!matchesTerm(item, currentFilter.term_months)) return false;
      return true;
    });
  }, [itemsInSubTab, currencyFilter, currentFilter]);

  // Валютные секции — дефолтная структура (как в Сбережениях), не опция.
  // Внутри каждой секции — обязательная группировка по банку (как в Инвестфондах).
  const rsdItems = useMemo(() => filtered.filter(i => getProductCurrency(i) === "RSD"), [filtered]);
  const eurItems = useMemo(() => filtered.filter(i => getProductCurrency(i) === "EUR"), [filtered]);

  const totalInTab = itemsInSubTab.length;

  return (
    <div>
      {/* Подвкладки */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {SUBTABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSubTab === tab.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Фильтр валюты — общий, всегда на месте, до выбора суммы/срока.
          Группировка по банку — дефолтная структура, не опция. */}
      <div className="mb-4">
        <select
          value={currencyFilter}
          onChange={e => setCurrencyFilter(e.target.value as "all" | "RSD" | "EUR")}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800"
        >
          <option value="all">Все валюты</option>
          {currencyOptions.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Фильтр-калькулятор */}
      <CalcFilterPanel
        subTab={activeSubTab}
        filter={currentFilter}
        onChange={f => setFilters(prev => ({ ...prev, [activeSubTab]: f }))}
      />

      {/* Дисклеймер */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800 mb-4">
        <span className="font-bold">⚠ Важно: </span>
        {activeSubTab === "mortgage"
          ? "Ипотека доступна с ВНЖ 1+ год. Банки требуют подтверждение дохода из сербских источников. Ставки приблизительные."
          : activeSubTab === "auto"
            ? "Автокредит требует ВНЖ и подтверждение дохода. Ставки приблизительные — уточняйте в банке."
            : "Потребительский кредит требует ВНЖ и подтверждение дохода (сербская зарплата или декларация ИП)."}
      </div>

      {/* Счётчик */}
      <p className="text-xs text-slate-400 mb-3">
        Найдено: <span className="font-semibold text-slate-700">{filtered.length}</span> из {totalInTab}
        {filtered.length < totalInTab && (
          <span className="ml-1 text-amber-600">
            — фильтр по сумме/сроку{currencyFilter !== "all" ? "/валюте" : ""} сужает выборку
          </span>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
          Нет продуктов по выбранным параметрам
        </div>
      ) : (
        <>
          <CreditSection title="RSD-кредиты" items={rsdItems} calcFilter={currentFilter} onInfoClick={setDrawerItem} />
          <CreditSection title="EUR-кредиты" items={eurItems} calcFilter={currentFilter} onInfoClick={setDrawerItem} />
        </>
      )}

      <CreditDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </div>
  );
}
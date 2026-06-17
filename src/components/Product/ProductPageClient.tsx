// src/components/Product/ProductPageClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { BankJSON, BankProduct, KYCRule, ResidencyStatus, LegalType, Probability } from "@/types/bank";

// ─── Вспомогательные функции ──────────────────────────────────────────────────

function formatStatus(status: ResidencyStatus): string {
  const map: Record<ResidencyStatus, string> = {
    non_resident: "Нерезидент",
    resident_less_1y: "ВНЖ до 1 года",
    resident_more_1y: "Резидент 1+ год",
    permanent_resident: "ПМЖ",
    citizen: "Гражданин",
  };
  return map[status];
}

function formatLegal(t: LegalType): string {
  return t === "business" ? "ИП / Юрлицо" : "Физическое лицо";
}

function probLabel(p: Probability, available: boolean): string {
  if (!available || p === "blocked") return "Отказ";
  if (p === "high") return "Высокая вероятность";
  if (p === "medium") return "50/50 — сербский рандом";
  return "Сложно — нужен помогатор";
}

function probClass(p: Probability, available: boolean): string {
  if (!available || p === "blocked") return "bg-red-50 text-red-800 border-red-200";
  if (p === "high") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (p === "medium") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-orange-50 text-orange-800 border-orange-200";
}

function backHref(category: BankProduct["category"]): { href: string; label: string } {
  switch (category) {
    case "personal_account":   return { href: "/?tab=accounts",          label: "← Все счета" };
    case "business_account":   return { href: "/?tab=business_account",  label: "← РКО для бизнеса" };
    case "savings_deposit":    return { href: "/?tab=savings_deposit",   label: "← Все вклады" };
    case "investment_bonds":   return { href: "/?tab=investment_bonds",  label: "← Инвестиции" };
    case "credit_mortgage":    return { href: "/?tab=credit_mortgage",   label: "← Все кредиты" };
    case "credit_consumer":    return { href: "/?tab=credit_mortgage",   label: "← Все кредиты" };
    case "transfer":           return { href: "/?tab=transfer",          label: "← Переводы" };
  }
}

function breadcrumb(category: BankProduct["category"]): string {
  switch (category) {
    case "personal_account":   return "Счета и карты";
    case "business_account":   return "РКО для бизнеса";
    case "savings_deposit":    return "Вклады";
    case "investment_bonds":   return "Инвестиции";
    case "credit_mortgage":    return "Ипотека";
    case "credit_consumer":    return "Кредиты";
    case "transfer":           return "Переводы";
  }
}

function avatarColor(category: BankProduct["category"]): string {
  switch (category) {
    case "personal_account":
    case "business_account":   return "bg-red-500 text-white";
    case "savings_deposit":    return "bg-amber-500 text-amber-900";
    case "investment_bonds":   return "bg-emerald-600 text-white";
    case "credit_mortgage":
    case "credit_consumer":    return "bg-purple-600 text-white";
    case "transfer":           return "bg-teal-600 text-white";
  }
}

// ─── Строки таблицы ───────────────────────────────────────────────────────────

function Row({ label, value, green, amber, zebra, small }: {
  label: string;
  value: string;
  green?: boolean;
  amber?: boolean;
  zebra?: boolean;
  small?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between py-2.5 border-b border-slate-100 text-sm ${zebra ? "bg-slate-50 -mx-5 px-5" : ""}`}>
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-right ${green ? "text-emerald-700" : amber ? "text-amber-700" : "text-slate-900"}`}>
        {value}
        {small && <span className="block text-xs font-normal text-slate-400 mt-0.5">{small}</span>}
      </span>
    </div>
  );
}

function InfoBox({ type, children }: { type: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div className={`mt-4 mb-1 flex gap-2.5 items-start p-3 rounded-lg text-xs leading-relaxed ${
      type === "info"
        ? "bg-blue-50 border border-blue-100 text-blue-900"
        : "bg-amber-50 border border-amber-100 text-amber-900"
    }`}>
      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        {type === "info"
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        }
      </svg>
      <span>{children}</span>
    </div>
  );
}

// ─── Левые колонки по категориям ─────────────────────────────────────────────

function LeftSavings({ product }: { product: BankProduct }) {
  const terms = product.terms ?? [];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [amount, setAmount] = useState(100000);

  const selected = terms[selectedIdx];
  const income = selected
    ? Math.round(amount * (selected.rate_pct / 100) * (selected.term_months / 12))
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Настройки вклада</h3>

      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1.5">Сумма вклада</div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-base font-semibold text-slate-900 min-w-[110px]">
            {amount.toLocaleString("ru-RU")} RSD
          </span>
          <input
            type="range"
            min={10000}
            max={5000000}
            step={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>10 000</span><span>5 000 000 RSD</span>
        </div>
      </div>

      {terms.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-1.5">Срок</div>
          <div className="flex flex-wrap gap-2">
            {terms.map((t, i) => (
              <button
                key={t.term_months}
                onClick={() => setSelectedIdx(i)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  i === selectedIdx
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {t.term_months} мес — {t.rate_pct}%
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-3 flex items-baseline gap-2">
        <span className="text-lg font-bold text-emerald-600">
          + {income.toLocaleString("ru-RU")} RSD
        </span>
        <span className="text-xs text-slate-400">доход за срок · налог 0%</span>
      </div>

      
        <Link
        href="/?tab=savings_deposit"
        className="block mt-3 text-xs text-blue-600 hover:underline"
      >
        Подробнее о вкладах →
      </Link>
        Подробнее о вкладе →
      
    </div>
  );
}

function LeftMortgage({ product }: { product: BankProduct }) {
  const maxAmount = product.max_amount_eur ?? 500000;
  const minDown = product.min_down_payment_pct ?? 20;
  const rate = product.rate_approx_total_pct ?? 5;
  const maxYears = product.loan_term_years ? Math.max(...product.loan_term_years) : 30;

  const [price, setPrice] = useState(Math.min(100000, maxAmount));
  const [years, setYears] = useState(Math.min(20, maxYears));

  const downPayment = Math.round(price * (minDown / 100));
  const loan = price - downPayment;
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const monthly = n > 0 && monthlyRate > 0
    ? Math.round(loan * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1))
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Настройки ипотеки</h3>

      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1.5">Стоимость недвижимости</div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-slate-900 min-w-[100px]">
            €{price.toLocaleString("ru-RU")}
          </span>
          <input
            type="range"
            min={25000}
            max={maxAmount}
            step={5000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>€25 000</span><span>€{maxAmount.toLocaleString("ru-RU")}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1.5">Срок (лет)</div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-slate-900 min-w-[60px]">{years} лет</span>
          <input
            type="range"
            min={5}
            max={maxYears}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Первый взнос ({minDown}%)</span>
          <span className="font-medium text-slate-900">€{downPayment.toLocaleString("ru-RU")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Сумма кредита</span>
          <span className="font-medium text-slate-900">€{loan.toLocaleString("ru-RU")}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-200">
          <span className="text-slate-500 font-medium">Платёж / мес (~)</span>
          <span className="font-bold text-slate-900">€{monthly.toLocaleString("ru-RU")}</span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
        Предварительный расчёт. Ставка ~{rate}%. Не является офертой.
      </p>
    </div>
  );
}

function LeftConsumer({ product }: { product: BankProduct }) {
  const rate = product.rate_approx_pct ?? 10;
  const maxMonths = product.loan_term_months ? Math.max(...product.loan_term_months) : 60;

  const [amount, setAmount] = useState(5000);
  const [months, setMonths] = useState(12);

  const monthlyRate = rate / 100 / 12;
  const monthly = Math.round(
    amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  );
  const total = monthly * months;
  const overpay = total - amount;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Настройки кредита</h3>

      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1.5">Сумма кредита</div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-slate-900 min-w-[90px]">
            €{amount.toLocaleString("ru-RU")}
          </span>
          <input
            type="range" min={500} max={product.max_amount_eur ?? 50000} step={500}
            value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1.5">Срок (месяцев)</div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-slate-900 min-w-[60px]">{months} мес</span>
          <input
            type="range" min={6} max={maxMonths} step={6}
            value={months} onChange={(e) => setMonths(Number(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Платёж / мес (~)</span>
          <span className="font-bold text-slate-900">€{monthly.toLocaleString("ru-RU")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Переплата (~)</span>
          <span className="font-medium text-amber-700">€{overpay.toLocaleString("ru-RU")}</span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">Ставка ~{rate}%. Предварительный расчёт.</p>
    </div>
  );
}

function LeftTransfer({ product }: { product: BankProduct }) {
  const [amount, setAmount] = useState(1000);
  const inPct = product.fee_incoming_pct ?? 0;
  const outPct = product.fee_outgoing_pct ?? 0;
  const inFee = Math.max(
    Math.round(amount * (inPct / 100)),
    product.fee_incoming_min_rsd ? Math.round(product.fee_incoming_min_rsd / 117) : 0
  );
  const outFee = Math.max(
    Math.round(amount * (outPct / 100)),
    product.fee_outgoing_min_rsd ? Math.round(product.fee_outgoing_min_rsd / 117) : 0
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Калькулятор перевода</h3>

      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1.5">Сумма перевода</div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-slate-900 min-w-[80px]">
            €{amount.toLocaleString("ru-RU")}
          </span>
          <input
            type="range" min={100} max={50000} step={100}
            value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>€100</span><span>€50 000</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Входящий SWIFT ({inPct}%)</span>
          <span className={`font-medium ${inFee === 0 ? "text-emerald-700" : "text-slate-900"}`}>
            {inFee === 0 ? "Бесплатно" : `≈ €${inFee}`}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-200">
          <span className="text-slate-500 font-medium">Исходящий SWIFT ({outPct}%)</span>
          <span className="font-bold text-amber-700">≈ €{outFee}</span>
        </div>
      </div>
    </div>
  );
}

function LeftBonds({ product }: { product: BankProduct }) {
  const [amount, setAmount] = useState(10000);
  const yield_pct = product.yield_eur_approx_pct ?? product.yield_rsd_approx_pct ?? 4;
  const entry = product.entry_fee_pct ?? 0;
  const custody = product.custody_fee_pct_annual ?? 0;
  const grossIncome = Math.round(amount * (yield_pct / 100));
  const entryFee = Math.round(amount * (entry / 100));
  const custodyFee = Math.round(amount * (custody / 100));
  const net = grossIncome - entryFee - custodyFee;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Калькулятор облигации</h3>

      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1.5">Сумма инвестиции</div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-slate-900 min-w-[80px]">
            €{amount.toLocaleString("ru-RU")}
          </span>
          <input
            type="range" min={1000} max={100000} step={1000}
            value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Купон ({yield_pct}%)</span>
          <span className="font-medium text-emerald-700">+ €{grossIncome.toLocaleString("ru-RU")}</span>
        </div>
        {entry > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Комиссия входа ({entry}%)</span>
            <span className="font-medium text-rose-600">− €{entryFee.toLocaleString("ru-RU")}</span>
          </div>
        )}
        {custody > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Хранение ({custody}% / год)</span>
            <span className="font-medium text-rose-600">− €{custodyFee.toLocaleString("ru-RU")}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t border-slate-200">
          <span className="text-slate-500 font-medium">Чистый доход</span>
          <span className={`font-bold ${net >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {net >= 0 ? "+" : ""}€{net.toLocaleString("ru-RU")}
          </span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">Налог на купон: 0% (Tax Free).</p>
    </div>
  );
}

function LeftAccount({ product, kycRule }: { product: BankProduct; kycRule: KYCRule | null }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Требования для открытия</h3>
      {kycRule?.is_available ? (
        <ul className="space-y-2">
          {kycRule.required_docs.map((doc) => (
            <li key={doc} className="flex items-start gap-2 text-sm text-slate-700">
              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {doc}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-slate-500">
          {kycRule?.red_flags?.[0] ?? "Условия открытия уточняйте в банке."}
        </div>
      )}

      {(kycRule?.red_flags?.length ?? 0) > 0 && kycRule?.is_available && (
        <InfoBox type="warn">{kycRule.red_flags[0]}</InfoBox>
      )}

      {product.notes && (
        <InfoBox type="info">{product.notes}</InfoBox>
      )}
    </div>
  );
}

// ─── Правые колонки — sticky CTA блок ────────────────────────────────────────

function RightCard({
  children,
  kycRule,
  bankWebsite,
  backHref: back,
  backLabel,
  disclaimer,
}: {
  children: React.ReactNode;
  kycRule: KYCRule | null;
  bankWebsite: string;
  backHref: string;
  backLabel: string;
  disclaimer?: string;
}) {
  const isAvailable = kycRule?.is_available ?? true;
  const prob = kycRule?.probability ?? "medium";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-24">
      {children}

      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border mb-4 ${probClass(prob, isAvailable)}`}>
        {probLabel(prob, isAvailable)}
      </span>

      <a
        href={bankWebsite}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors mb-2"
      >
        Открыть в банке →
      </a>
      <Link
        href={back}
        className="block w-full text-center py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
      >
        {backLabel}
      </Link>

      {disclaimer && (
        <p className="mt-3 text-[10px] text-slate-400 text-center leading-relaxed">{disclaimer}</p>
      )}
    </div>
  );
}

// ─── Табы детального блока ────────────────────────────────────────────────────

type TabId = "conditions" | "requirements" | "limits" | "perks" | "about";

const TAB_LABELS: Record<TabId, string> = {
  conditions:   "Условия",
  requirements: "Требования",
  limits:       "Лимиты и комиссии",
  perks:        "Привилегии",
  about:        "О банке",
};

function tabsForCategory(cat: BankProduct["category"]): TabId[] {
  switch (cat) {
    case "personal_account":
    case "business_account":
      return ["conditions", "requirements", "limits", "perks", "about"];
    case "savings_deposit":
      return ["conditions", "requirements", "about"];
    case "investment_bonds":
      return ["conditions", "requirements", "about"];
    case "credit_mortgage":
    case "credit_consumer":
      return ["conditions", "requirements", "about"];
    case "transfer":
      return ["conditions", "requirements", "about"];
  }
}

// ─── Содержимое табов ─────────────────────────────────────────────────────────

function TabConditions({ product }: { product: BankProduct }) {
  switch (product.category) {
    case "personal_account":
    case "business_account":
      return (
        <>
          <Row label="Стоимость обслуживания" value={product.maintenance_fee_rsd === 0 ? "Бесплатно" : `${product.maintenance_fee_rsd ?? "—"} RSD / мес`} green={product.maintenance_fee_rsd === 0} />
          <Row label="Порядок открытия" value="В отделении или онлайн" zebra />
          <Row label="Карты" value={[...(product.cards?.international ?? [])].join(", ") || "DinaCard"} />
          <Row label="Валюты счёта" value={product.supported_currencies?.join(", ") ?? "RSD"} zebra />
          <Row label="Мультивалютный" value={product.is_multicurrency ? "Да" : "Нет"} green={product.is_multicurrency ?? false} />
          {product.features && (
            <>
                <Row label="Apple Pay"      value={product.features.apple_pay  ? "Да" : "Нет"} green={product.features.apple_pay  ?? false} zebra />
                <Row label="Google Pay"     value={product.features.google_pay ? "Да" : "Нет"} green={product.features.google_pay ?? false} />
                <Row label="Prenesi"        value={product.features.prenesi    ? "Доступен" : "Нет"} green={product.features.prenesi    ?? false} zebra />
                <Row label="IPS QR-платежи" value={product.features.ips_qr     ? "Работают" : "Нет"} green={product.features.ips_qr     ?? false} />
            </>
)}
          {product.notes && <InfoBox type="info">{product.notes}</InfoBox>}
        </>
      );

    case "savings_deposit":
      return (
        <>
          <Row label="Тип вклада" value="Срочный" />
          <Row label="Валюта" value={product.currency ?? "RSD"} zebra />
          <Row label="Налог на доход" value={product.tax_on_interest_pct === 0 ? "0% — Tax Free" : `${product.tax_on_interest_pct ?? 15}%`} green={product.tax_on_interest_pct === 0} />
          <Row label="Доступен нерезидентам" value={product.is_available_non_resident ? "Да" : "Нет"} green={product.is_available_non_resident ?? false} zebra />
          {product.min_amount_rsd != null && (
            <Row label="Минимальная сумма" value={`${product.min_amount_rsd.toLocaleString("ru-RU")} RSD`} />
          )}
          {product.terms && product.terms.length > 0 && (
            <>
              <div className="pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Таблица ставок</div>
              {product.terms.map((t, i) => (
                <Row
                  key={t.term_months}
                  label={`${t.term_months} мес`}
                  value={`${t.rate_pct}% годовых`}
                  green
                  zebra={i % 2 === 1}
                />
              ))}
            </>
          )}
          {product.notes && <InfoBox type="info">{product.notes}</InfoBox>}
        </>
      );

    case "investment_bonds":
      return (
        <>
          {product.yield_eur_approx_pct != null && (
            <Row label="Доходность EUR" value={`~${product.yield_eur_approx_pct}%`} green />
          )}
          {product.yield_rsd_approx_pct != null && (
            <Row label="Доходность RSD" value={`~${product.yield_rsd_approx_pct}%`} green zebra />
          )}
          <Row label="Налог на купон" value="0% — Tax Free" green />
          <Row label="Налог на прирост" value="0%" green zebra />
          <Row label="Комиссия входа" value={product.entry_fee_pct != null ? `${product.entry_fee_pct}%` : "—"} amber={!!product.entry_fee_pct && product.entry_fee_pct > 1} />
          {product.custody_fee_pct_annual != null && (
            <Row label="Хранение (год)" value={`${product.custody_fee_pct_annual}%`} amber zebra />
          )}
          <Row label="Способ покупки" value={product.access_method ?? "В отделении банка"} />
          {product.min_investment_eur != null && (
            <Row label="Минимальная инвестиция" value={`€${product.min_investment_eur.toLocaleString("ru-RU")}`} zebra />
          )}
          {product.notes && <InfoBox type="info">{product.notes}</InfoBox>}
        </>
      );

    case "credit_mortgage":
      return (
        <>
          <Row label="Ставка (примерная)" value={`~${product.rate_approx_total_pct}% годовых`} />
          <Row label="Тип ставки" value={product.rate_type ?? "Переменная"} zebra />
          {product.rate_type === "variable" && (
            <Row label="База" value="EURIBOR 6M" />
          )}
          <Row label="LTV (макс.)" value={`${product.max_ltv_pct}%`} zebra />
          <Row label="Первый взнос от" value={`${product.min_down_payment_pct}%`} />
          <Row label="Срок" value={product.loan_term_years ? `${Math.min(...product.loan_term_years)}–${Math.max(...product.loan_term_years)} лет` : "—"} zebra />
          {product.min_amount_eur_credit != null && (
            <Row label="Сумма от" value={`€${product.min_amount_eur_credit.toLocaleString("ru-RU")}`} />
          )}
          {product.max_amount_eur != null && (
            <Row label="Сумма до" value={`€${product.max_amount_eur.toLocaleString("ru-RU")}`} zebra />
          )}
          {product.notes && <InfoBox type="info">{product.notes}</InfoBox>}
        </>
      );

    case "credit_consumer":
      return (
        <>
          <Row label="Ставка (примерная)" value={`~${product.rate_approx_pct}% годовых`} />
          <Row label="Срок" value={product.loan_term_months ? `${Math.min(...product.loan_term_months)}–${Math.max(...product.loan_term_months)} мес` : "—"} zebra />
          {product.max_amount_eur != null && (
            <Row label="Сумма до" value={`€${product.max_amount_eur.toLocaleString("ru-RU")}`} />
          )}
          {product.income_requirement && (
            <Row label="Требование к доходу" value={product.income_requirement} zebra />
          )}
          {product.notes && <InfoBox type="info">{product.notes}</InfoBox>}
        </>
      );

    case "transfer":
      return (
        <>
          <Row label="Входящий SWIFT" value={product.fee_incoming_pct === 0 ? "Бесплатно" : `${product.fee_incoming_pct}%`} green={product.fee_incoming_pct === 0} small={product.fee_incoming_min_rsd ? `Мин ${product.fee_incoming_min_rsd} RSD` : undefined} />
          <Row label="Исходящий SWIFT" value={`${product.fee_outgoing_pct}%`} amber={!!product.fee_outgoing_pct && product.fee_outgoing_pct > 0.3} small={product.fee_outgoing_min_rsd ? `Мин ${product.fee_outgoing_min_rsd} RSD` : undefined} zebra />
          {product.currencies && (
            <Row label="Поддерживаемые валюты" value={product.currencies.join(", ")} />
          )}
          {product.available_directions && (
            <Row label="Направления" value={product.available_directions.join(" / ")} zebra />
          )}
          {product.outgoing_resident_restriction && (
            <InfoBox type="warn">{product.outgoing_resident_restriction}</InfoBox>
          )}
          {product.notes && <InfoBox type="info">{product.notes}</InfoBox>}
        </>
      );
  }
}

function TabRequirements({ product, kycRule }: { product: BankProduct; kycRule: KYCRule | null }) {
  return (
    <>
      {!kycRule?.is_available && (
        <InfoBox type="warn">
          {kycRule?.red_flags?.[0] ?? "Счёт недоступен для текущего статуса резидентства."}
        </InfoBox>
      )}
      {kycRule?.required_docs && kycRule.required_docs.length > 0 ? (
        kycRule.required_docs.map((doc, i) => (
          <Row key={doc} label={`Документ ${i + 1}`} value={doc} zebra={i % 2 === 1} />
        ))
      ) : (
        <div className="py-4 text-sm text-slate-400 text-center">
          Список документов уточняйте в отделении банка.
        </div>
      )}
      {kycRule?.red_flags && kycRule.red_flags.length > 0 && kycRule.is_available && (
        <InfoBox type="warn">{kycRule.red_flags[0]}</InfoBox>
      )}
      {product.required_docs && product.required_docs.length > 0 && (
        <>
          <div className="pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Дополнительно</div>
          {product.required_docs.map((doc, i) => (
            <Row key={doc} label={`${i + 1}.`} value={doc} zebra={i % 2 === 1} />
          ))}
        </>
      )}
    </>
  );
}

function TabLimits({ product }: { product: BankProduct }) {
  return (
    <>
      {product.swift_in && (
        <Row label="SWIFT входящий" value={`${product.swift_in.pct}%`} small={product.swift_in.min_rsd ? `Мин ${product.swift_in.min_rsd} RSD` : undefined} />
      )}
      {product.swift_out && (
        <Row label="SWIFT исходящий" value={`${product.swift_out.pct}%`} amber small={product.swift_out.min_rsd ? `Мин ${product.swift_out.min_rsd} RSD` : undefined} zebra />
      )}
      {product.swift_in?.notes && <InfoBox type="info">{product.swift_in.notes}</InfoBox>}
      {product.swift_out?.notes && <InfoBox type="warn">{product.swift_out.notes}</InfoBox>}
      {!product.swift_in && !product.swift_out && (
        <div className="py-4 text-sm text-slate-400 text-center">
          Лимиты и комиссии для данной категории уточняйте в банке.
        </div>
      )}
    </>
  );
}

function TabAbout({ bank }: { bank: BankJSON }) {
  return (
    <>
      <Row label="Название банка" value={bank.brand_name} />
      <Row label="Официальное название" value={bank.official_name} zebra />
      <Row label="Матични број" value={bank.maticni_broj} />
      <Row label="Сайт" value={bank.website} zebra />
      <Row label="Данные обновлены" value={bank.last_updated} />
    </>
  );
}

// ─── Правые метрики по категориям ────────────────────────────────────────────

function RightMetrics({ product }: { product: BankProduct }) {
  switch (product.category) {
    case "savings_deposit": {
      const best = product.terms ? Math.max(...product.terms.map((t) => t.rate_pct)) : null;
      return (
        <>
          <div className="text-xs text-slate-400 mb-1">Максимальная ставка</div>
          <div className="text-2xl font-bold text-emerald-600 mb-3">
            {best != null ? `${best}%` : "—"}
            <span className="text-sm font-normal text-slate-400 ml-1">годовых</span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-2.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Налог на доход</span>
              <span className="font-medium text-emerald-700">0% — Tax Free</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Нерезиденты</span>
              <span className={`font-medium ${product.is_available_non_resident ? "text-emerald-700" : "text-slate-500"}`}>
                {product.is_available_non_resident ? "Принимают" : "Уточняйте"}
              </span>
            </div>
          </div>
        </>
      );
    }

    case "investment_bonds":
      return (
        <>
          <div className="text-xs text-slate-400 mb-1">Доходность EUR</div>
          <div className="text-2xl font-bold text-emerald-600 mb-3">
            ~{product.yield_eur_approx_pct ?? product.yield_rsd_approx_pct ?? "—"}%
            <span className="text-sm font-normal text-slate-400 ml-1">годовых</span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-2.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Налог на купон</span>
              <span className="font-medium text-emerald-700">0% — Tax Free</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Комиссия входа</span>
              <span className={`font-medium ${product.entry_fee_pct ? "text-amber-700" : "text-slate-700"}`}>
                {product.entry_fee_pct ? `${product.entry_fee_pct}%` : "—"}
              </span>
            </div>
          </div>
        </>
      );

    case "credit_mortgage":
      return (
        <>
          <div className="text-xs text-slate-400 mb-1">Ставка от</div>
          <div className="text-2xl font-bold text-slate-900 mb-3">
            ~{product.rate_approx_total_pct}%
            <span className="text-sm font-normal text-slate-400 ml-1">годовых</span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-2.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">LTV макс.</span>
              <span className="font-medium text-slate-900">{product.max_ltv_pct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Взнос от</span>
              <span className="font-medium text-slate-900">{product.min_down_payment_pct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Срок до</span>
              <span className="font-medium text-slate-900">
                {product.loan_term_years ? `${Math.max(...product.loan_term_years)} лет` : "—"}
              </span>
            </div>
          </div>
        </>
      );

    case "credit_consumer":
      return (
        <>
          <div className="text-xs text-slate-400 mb-1">Ставка от</div>
          <div className="text-2xl font-bold text-slate-900 mb-3">
            ~{product.rate_approx_pct}%
            <span className="text-sm font-normal text-slate-400 ml-1">годовых</span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-2.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Сумма до</span>
              <span className="font-medium text-slate-900">
                {product.max_amount_eur ? `€${product.max_amount_eur.toLocaleString("ru-RU")}` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Срок до</span>
              <span className="font-medium text-slate-900">
                {product.loan_term_months ? `${Math.max(...product.loan_term_months)} мес` : "—"}
              </span>
            </div>
          </div>
        </>
      );

    case "transfer":
      return (
        <>
          <div className="text-xs text-slate-400 mb-1">Входящий SWIFT</div>
          <div className="text-2xl font-bold text-emerald-600 mb-3">
            {product.fee_incoming_pct === 0 ? "0%" : `${product.fee_incoming_pct}%`}
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-2.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Исходящий SWIFT</span>
              <span className="font-medium text-amber-700">{product.fee_outgoing_pct}%</span>
            </div>
          </div>
        </>
      );

    default:
      return (
        <>
          <div className="text-xs text-slate-400 mb-1">Обслуживание</div>
          <div className="text-2xl font-bold text-slate-900 mb-3">
            {product.maintenance_fee_rsd === 0
              ? "Бесплатно"
              : product.maintenance_fee_rsd != null
                ? `${product.maintenance_fee_rsd} RSD`
                : "—"}
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-2.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Входящий SWIFT</span>
              <span className="font-medium text-slate-900">
                {product.swift_in?.pct != null ? `${product.swift_in.pct}%` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Исходящий SWIFT</span>
              <span className="font-medium text-amber-700">
                {product.swift_out?.pct != null ? `${product.swift_out.pct}%` : "—"}
              </span>
            </div>
          </div>
        </>
      );
  }
}

// ─── Главный компонент ────────────────────────────────────────────────────────

interface Props {
  bank: BankJSON;
  product: BankProduct;
  kycRule: KYCRule | null;
  userStatus: ResidencyStatus;
  userLegalType: LegalType;
}

export function ProductPageClient({ bank, product, kycRule, userStatus, userLegalType }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("conditions");
  const tabs = tabsForCategory(product.category);
  const back = backHref(product.category);
  const initials = bank.brand_name.slice(0, 2).toUpperCase();
  const isAvailable = kycRule?.is_available ?? true;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">

      {/* Breadcrumbs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-700 transition-colors">Главная</Link>
        <span>/</span>
        <Link href={back.href} className="hover:text-slate-700 transition-colors">
          {breadcrumb(product.category)}
        </Link>
        <span>/</span>
        <span className="text-slate-700 truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Шапка продукта */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(product.category)}`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 leading-snug truncate">
              {product.name}
            </h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[10px] px-2 py-0.5 border border-slate-200 rounded text-slate-500 bg-slate-50">
                {bank.brand_name}
              </span>
              <span className="text-[10px] px-2 py-0.5 border border-slate-200 rounded text-slate-500 bg-slate-50">
                {breadcrumb(product.category)}
              </span>
              {!isAvailable && (
                <span className="text-[10px] px-2 py-0.5 border border-red-200 rounded text-red-700 bg-red-50 font-semibold">
                  Недоступен для вашего статуса
                </span>
              )}
            </div>
          </div>
          <button
            aria-label="Поделиться"
            className="w-8 h-8 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Двухколоночный layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

          {/* Левая колонка — калькулятор / конфигуратор */}
          <div className="space-y-4">
            {product.category === "savings_deposit"  && <LeftSavings product={product} />}
            {product.category === "investment_bonds" && <LeftBonds product={product} />}
            {product.category === "credit_mortgage"  && <LeftMortgage product={product} />}
            {product.category === "credit_consumer"  && <LeftConsumer product={product} />}
            {product.category === "transfer"         && <LeftTransfer product={product} />}
            {(product.category === "personal_account" || product.category === "business_account") && (
              <LeftAccount product={product} kycRule={kycRule} />
            )}

            {/* Блок эксперта-заглушка */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 mb-0.5">Проверенные эксперты</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Русскоязычные специалисты в Сербии — помогут открыть продукт с вашим ВНЖ.
                </div>
                <Link
                  href="/?tab=services"
                  className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Найти специалиста →
                </Link>
              </div>
            </div>
          </div>

          {/* Правая колонка — sticky CTA */}
          <RightCard
            kycRule={kycRule}
            bankWebsite={bank.website}
            backHref={back.href}
            backLabel={back.label}
            disclaimer="Предварительные данные. Не являются офертой."
          >
            <RightMetrics product={product} />
          </RightCard>
        </div>

        {/* Детальный блок — полная ширина */}
        <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-0">
            <h2 className="text-sm font-bold text-slate-900 mb-0.5">
              {product.category === "savings_deposit" ? "Параметры вклада"
                : product.category === "investment_bonds" ? "Параметры облигации"
                : product.category === "credit_mortgage" ? "Об ипотеке"
                : product.category === "credit_consumer" ? "О кредите"
                : product.category === "transfer" ? "О переводах"
                : `О счёте «${product.name}»`}
            </h2>
            {product.notes && (
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{product.notes}</p>
            )}
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors font-medium ${
                    activeTab === tab
                      ? "border-blue-600 text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-2">
            {activeTab === "conditions"   && <TabConditions product={product} />}
            {activeTab === "requirements" && <TabRequirements product={product} kycRule={kycRule} />}
            {activeTab === "limits"       && <TabLimits product={product} />}
            {activeTab === "perks"        && (
              <div className="py-4 text-sm text-slate-400 text-center">
                Информация о привилегиях и бонусах на сайте банка.
              </div>
            )}
            {activeTab === "about"        && <TabAbout bank={bank} />}
          </div>

          <div className="px-5 pb-4 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Данные на основе официальных тарифов банка. Актуально на {bank.last_updated}.
            Уточняйте актуальные условия на сайте банка или в отделении.
          </div>
        </div>

        {/* Profile bar */}
        <div className="mt-3 bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Условия отображены для:{" "}
            <strong className="text-slate-900">{formatStatus(userStatus)} · {formatLegal(userLegalType)}</strong>
          </span>
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Изменить профиль →
          </Link>
        </div>

      </div>
    </div>
  );
}
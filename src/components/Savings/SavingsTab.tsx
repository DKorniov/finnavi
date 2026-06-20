// src/components/Savings/SavingsTab.tsx
"use client";

import { useState, useMemo, useEffect, useCallback, useRef, type ReactElement } from "react";
import Link from "next/link";
import type { TransformedMatrixItem } from "@/types/bank";

// ─────────────────────────────────────────────────────────────────────────────
// Расширенный тип — новые поля v2.5 (совместимость до обновления bank.ts)
// ─────────────────────────────────────────────────────────────────────────────
type SavingsProduct = TransformedMatrixItem["products"] & {
  capitalization_type?: "daily" | "monthly" | "quarterly" | "at_end" | null;
  interest_payout?:     "daily" | "monthly" | "quarterly" | "at_end" | null;
  replenishment_allowed?:      boolean | null;
  partial_withdrawal_allowed?: boolean | null;
  grace_period_termination?:   boolean | null;
  grace_period_note?:          string  | null;
  early_withdrawal_penalty?:
    | "full_loss" | "recalculated_vista" | "recalculated"
    | "partial_loss" | "none" | null;
  deposit_type?: string;
  currencies?:   string[];
};

function asSavings(item: TransformedMatrixItem): SavingsProduct {
  return item.products as SavingsProduct;
}

// ─────────────────────────────────────────────────────────────────────────────
// Справочники
// ─────────────────────────────────────────────────────────────────────────────
const BANKS_COLOR: Record<string, string> = {
  "Alta Banka":           "#E31837",
  "OTP Banka":            "#00A650",
  "Banca Intesa":         "#009A44",
  "Raiffeisen Bank":      "#FFCC00",
  "Poštanska Štedionica": "#F7A600",
};
const BANKS_INITIALS: Record<string, string> = {
  "Alta Banka":           "AB",
  "OTP Banka":            "OB",
  "Banca Intesa":         "BI",
  "Raiffeisen Bank":      "RB",
  "Poštanska Štedionica": "PŠ",
};
const BANKS_DARK = new Set(["Raiffeisen Bank"]);

const CAP_LABEL: Record<string, string> = {
  daily:     "Ежедневная",
  monthly:   "Ежемесячная",
  quarterly: "Ежеквартальная",
  at_end:    "В конце срока",
};
const PAYOUT_LABEL: Record<string, string> = {
  monthly: "Ежемесячно",
  at_end:  "В конце срока",
};
const PENALTY_LABEL: Record<string, string> = {
  full_loss:          "Полная потеря процентов",
  recalculated_vista: "Пересчёт по ставке виста",
  recalculated:       "Пересчёт по договору",
  partial_loss:       "Частичная потеря",
  none:               "Без штрафа",
};

// ─────────────────────────────────────────────────────────────────────────────
// Общие переиспользуемые компоненты (стиль ProductTabsClient)
// ─────────────────────────────────────────────────────────────────────────────
function Row({
  label, value, sub, valueClass,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-sm text-slate-500 shrink-0 max-w-[180px] leading-snug">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-medium ${valueClass ?? "text-slate-900"}`}>{value}</span>
        {sub && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{sub}</p>}
      </div>
    </div>
  );
}

function InfoBox({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warn" | "danger" }) {
  const cls = {
    info:   "bg-blue-50 border-blue-100 text-blue-800",
    warn:   "bg-amber-50 border-amber-100 text-amber-800",
    danger: "bg-red-50 border-red-200 text-red-800",
  }[variant];
  return <div className={`border rounded-xl p-3.5 text-sm leading-relaxed my-3 ${cls}`}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-5 mb-1 first:mt-0">
      {children}
    </h4>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer — боковая панель с деталями вклада (стиль ProductDrawer)
// ─────────────────────────────────────────────────────────────────────────────
type DrawerTab = "conditions" | "rates" | "bank";

interface SavingsDrawerProps {
  item:    TransformedMatrixItem | null;
  onClose: () => void;
}

function SavingsDrawer({ item, onClose }: SavingsDrawerProps) {
  // Сброс таба при смене продукта: useRef хранит предыдущий id,
  // сравниваем во время рендера — никакого useEffect не нужно.
  const [activeTab, setActiveTab] = useState<DrawerTab>("conditions");
  const prevIdRef = useRef<string | null>(null);
  const currentId = item?.products.product_id ?? null;
  if (currentId !== prevIdRef.current) {
    prevIdRef.current = currentId;
    if (currentId !== null) {
      // Прямое обновление стейта во время рендера корректно в React 18
      // (паттерн «derived state from props» — см. react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
      setActiveTab("conditions");
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  // Единственный эффект — только DOM-сайдэффекты, никакого setState
  useEffect(() => {
    if (item) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, handleKeyDown]);

  const isOpen = item !== null;
  const p = item ? asSavings(item) : null;

  const logoColor = BANKS_COLOR[p?.banks.name ?? ""] ?? "#1e293b";
  const logoText  = BANKS_DARK.has(p?.banks.name ?? "") ? "#1e293b" : "#ffffff";
  const logoInit  = BANKS_INITIALS[p?.banks.name ?? ""] ?? "?";

  const terms = p?.terms ?? [];
  const bestRate = terms.length > 0 ? Math.max(...terms.map(t => t.rate_pct)) : 0;

  const bankDescriptions: Record<string, string> = {
    "Alta Banka":           "Средний сербский банк с лояльной политикой к иностранцам. Принимает переводы в рублях и юанях. Рекомендован экспат-комьюнити как один из самых доступных для нерезидентов.",
    "OTP Banka":            "Венгерский OTP Group, топ-5 банков Сербии. Один из немногих, кто открывает брокерский счёт нерезидентам для покупки гособлигаций.",
    "Banca Intesa":         "Крупнейший банк Сербии по кредитному портфелю, дочерняя структура Intesa Sanpaolo (Италия). С 2022 года строгая AML-политика для граждан РФ/РБ.",
    "Raiffeisen Bank":      "Дочерняя структура австрийской RBI. Сильная технологическая платформа. С 2024 года ужесточены требования для граждан РФ/РБ.",
    "Poštanska Štedionica": "Государственный банк Сербии с сетью через Pošta Serbia. Самый лояльный к нерезидентам. Рекомендован как первый банк для только что приехавших.",
  };

  const TABS: { id: DrawerTab; label: string }[] = [
    { id: "conditions", label: "Условия" },
    { id: "rates",      label: "Ставки" },
    { id: "bank",       label: "О банке" },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Детали: ${p?.name ?? ""}`}
        className={`fixed top-0 right-0 bottom-0 w-[400px] bg-white z-50 flex flex-col
          border-l border-slate-200 shadow-xl transition-transform duration-250 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Шапка */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ backgroundColor: logoColor, color: logoText }}
          >
            {logoInit}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{p?.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{p?.banks.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Таб-навигация */}
        <div className="flex gap-0 border-b border-slate-200 shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors font-medium shrink-0 ${
                activeTab === tab.id
                  ? "border-blue-600 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Тело — скролл */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── Вкладка: Условия ── */}
          {activeTab === "conditions" && p && (
            <div>
              <SectionTitle>Основные параметры</SectionTitle>
              <Row
                label="Тип вклада"
                value={
                  p.deposit_type === "renta"   ? "Рентный (ежемес. выплата)" :
                  p.deposit_type === "flexi"   ? "Флекси (пополнение + снятие)" :
                  p.deposit_type === "combi"   ? "Комби (депозит + фонд)" :
                  p.deposit_type === "a_vista" ? "До востребования" :
                  "Срочный"
                }
              />
              <Row
                label="Валюта"
                value={(p.currencies ?? ["RSD"]).join(", ")}
              />
              <Row
                label="Налог на проценты"
                value={(p.tax_on_interest_pct ?? 0) === 0 ? "0% — Tax Free" : `${p.tax_on_interest_pct}%`}
                valueClass={(p.tax_on_interest_pct ?? 0) === 0 ? "text-emerald-700" : undefined}
              />
              <Row
                label="Выплата процентов"
                value={p.interest_payout ? PAYOUT_LABEL[p.interest_payout] ?? p.interest_payout : "Не указано"}
              />
              <Row
                label="Капитализация"
                value={p.capitalization_type ? CAP_LABEL[p.capitalization_type] ?? p.capitalization_type : "Не указана"}
              />

              <SectionTitle>Условия пополнения и снятия</SectionTitle>
              <Row
                label="Пополнение"
                value={p.replenishment_allowed === true ? "Возможно" : p.replenishment_allowed === false ? "Нет" : "Нет данных"}
                valueClass={p.replenishment_allowed === true ? "text-emerald-700" : "text-slate-400"}
              />
              <Row
                label="Частичное снятие"
                value={p.partial_withdrawal_allowed === true ? "Возможно" : p.partial_withdrawal_allowed === false ? "Нет" : "Нет данных"}
                valueClass={p.partial_withdrawal_allowed === true ? "text-emerald-700" : "text-slate-400"}
              />

              <SectionTitle>Досрочное расторжение</SectionTitle>
              <Row
                label="Льготное расторжение"
                value={p.grace_period_termination === true ? "Есть" : p.grace_period_termination === false ? "Нет" : "Нет данных"}
                valueClass={
                  p.grace_period_termination === true  ? "text-emerald-700" :
                  p.grace_period_termination === false ? "text-red-600" :
                  "text-slate-400"
                }
                sub={p.grace_period_note ?? undefined}
              />
              <Row
                label="Штраф при досрочном"
                value={p.early_withdrawal_penalty
                  ? PENALTY_LABEL[p.early_withdrawal_penalty] ?? p.early_withdrawal_penalty
                  : "Не указано"}
                valueClass={p.early_withdrawal_penalty === "full_loss" ? "text-red-600" : "text-emerald-700"}
              />

              <SectionTitle>Доступность</SectionTitle>
              {p.min_amount_rsd && (
                <Row label="Мин. сумма" value={`${p.min_amount_rsd.toLocaleString("ru-RU")} RSD`} />
              )}
              {p.min_amount_eur && (
                <Row label="Мин. сумма" value={`${p.min_amount_eur} EUR`} />
              )}
              <Row
                label="Доступен нерезидентам"
                value={p.is_available_non_resident === true ? "Да" : p.is_available_non_resident === false ? "Нет" : "Нет данных"}
                valueClass={p.is_available_non_resident === true ? "text-emerald-700" : "text-red-600"}
              />

              {p.notes && <InfoBox variant="info">{p.notes}</InfoBox>}
            </div>
          )}

          {/* ── Вкладка: Ставки ── */}
          {activeTab === "rates" && p && (
            <div>
              {terms.length > 0 ? (
                <>
                  <SectionTitle>Ставки по срокам</SectionTitle>
                  {terms.map(t => (
                    <Row
                      key={t.term_months}
                      label={t.term_months === 0 ? "До востребования" : `${t.term_months} мес`}
                      value={t.rate_pct > 0 ? `${t.rate_pct}%` : "0% (без дохода)"}
                      valueClass={
                        t.rate_pct === bestRate && bestRate > 0
                          ? "text-emerald-700 font-semibold"
                          : t.rate_pct === 0
                            ? "text-slate-400"
                            : "text-slate-900"
                      }
                      sub={t.rate_pct === bestRate && bestRate > 0 ? "Лучшая ставка" : undefined}
                    />
                  ))}

                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Максимальная ставка{" "}
                      <span className="font-semibold text-emerald-700">{bestRate}%</span>.{" "}
                      {(p.tax_on_interest_pct ?? 0) === 0
                        ? "Налог на проценты — 0% (RSD-вклад)."
                        : `Налог на проценты — ${p.tax_on_interest_pct}%. Банк является налоговым агентом.`}
                    </p>
                  </div>
                </>
              ) : (
                <InfoBox variant="warn">
                  Конкретные ставки по срокам не указаны в официальном тарифе. Уточняйте в отделении банка.
                </InfoBox>
              )}

              {p.notes && p.notes.includes("%") && (
                <InfoBox variant="info">{p.notes}</InfoBox>
              )}
            </div>
          )}

          {/* ── Вкладка: О банке ── */}
          {activeTab === "bank" && p && (
            <div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
                  style={{ backgroundColor: logoColor, color: logoText }}
                >
                  {logoInit}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{p.banks.name}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {bankDescriptions[p.banks.name] ?? `${p.banks.name} — банк под надзором Народного банка Сербии (НБС).`}
                  </p>
                </div>
              </div>
              <Row label="Регулятор" value="Народный банк Сербии (НБС)" />
              <Row label="Гарантирование вкладов" value="АДВ — до 50 000 EUR" valueClass="text-emerald-700" />
              {p.banks.official_site && (
                <a
                  href={p.banks.official_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-4"
                >
                  Официальный сайт банка
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Футер sticky */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center">
            Данные из официальных тарифов банка. Уточняйте условия перед открытием.
          </p>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Фильтры
// ─────────────────────────────────────────────────────────────────────────────
interface Filters {
  cur:     "all" | "RSD" | "EUR";
  term:    "all" | "1" | "3" | "6" | "12" | "24" | "36";
  sort:    "rate" | "bank" | "min";
  nonres:  boolean;
  monthly: boolean;
  partial: boolean;
  grace:   boolean;
  cap:     boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательные функции
// ─────────────────────────────────────────────────────────────────────────────
function bestRate(item: TransformedMatrixItem): number {
  const terms = asSavings(item).terms ?? [];
  return terms.length > 0 ? Math.max(...terms.map(t => t.rate_pct)) : 0;
}

// Ставка за КОНКРЕТНЫЙ срок — для корректного сравнения "3 мес у банка А vs 3 мес у банка Б".
// В отличие от bestRate() (максимум по всем срокам сразу), эта функция не вводит в заблуждение.
function rateForTerm(item: TransformedMatrixItem, months: number): number | null {
  const terms = asSavings(item).terms ?? [];
  const match = terms.find(t => t.term_months === months);
  return match ? match.rate_pct : null;
}

// Ставка для отображения с учётом выбранного в фильтре срока: если срок не выбран —
// обычный максимум (обзорный режим), если выбран — именно ставка за этот срок.
function effectiveRate(item: TransformedMatrixItem, selectedTermMonths: number | null): number {
  if (selectedTermMonths == null) return bestRate(item);
  return rateForTerm(item, selectedTermMonths) ?? 0;
}

function termLabel(months: number): string {
  if (months === 0)  return "До вост.";
  if (months === 1)  return "1 мес";
  if (months === 25) return "25 мес";
  if (months === 60) return "60 мес";
  return `${months} мес`;
}

function getCurrency(item: TransformedMatrixItem): string {
  const c = asSavings(item).currencies;
  return c && c.length > 0 ? c[0] : "RSD";
}

function isRSD(item: TransformedMatrixItem): boolean {
  return getCurrency(item) === "RSD";
}

function hasTerm(item: TransformedMatrixItem, months: number): boolean {
  return (asSavings(item).terms ?? []).some(t => t.term_months === months);
}

function minStr(item: TransformedMatrixItem): string {
  const p = asSavings(item);
  if (p.min_amount_rsd) return `от ${p.min_amount_rsd.toLocaleString("ru-RU")} RSD`;
  if (p.min_amount_eur) return `от ${p.min_amount_eur} EUR`;
  return "";
}



// ─────────────────────────────────────────────────────────────────────────────
// Панель фильтров
// ─────────────────────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, bestRsd, bestEur, selectedTermMonths }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  bestRsd: number | null;
  bestEur: number | null;
  selectedTermMonths: number | null;
}) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const termSuffix = selectedTermMonths != null ? ` (${termLabel(selectedTermMonths)})` : "";

  const checkboxes: Array<{ key: keyof Pick<Filters, "nonres"|"monthly"|"partial"|"grace"|"cap">; label: string }> = [
    { key: "nonres",  label: "Нерезидентам" },
    { key: "monthly", label: "Ежемесячный доход" },
    { key: "partial", label: "Частичное снятие" },
    { key: "grace",   label: "Льготное расторжение" },
    { key: "cap",     label: "Есть капитализация" },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 shadow-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <select value={filters.cur} onChange={e => set("cur", e.target.value as Filters["cur"])}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800">
          <option value="all">Все валюты</option>
          <option value="RSD">RSD (0% налог)</option>
          <option value="EUR">EUR / USD (15% налог)</option>
        </select>
        <select value={filters.term} onChange={e => set("term", e.target.value as Filters["term"])}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800">
          <option value="all">Любой срок</option>
          {(["1","3","6","12","24","36"] as const).map(t => (
            <option key={t} value={t}>{t === "1" ? "1 месяц" : `${t} месяцев`}</option>
          ))}
        </select>
        <select value={filters.sort} onChange={e => set("sort", e.target.value as Filters["sort"])}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800">
          <option value="rate">По ставке ↓</option>
          <option value="bank">По банку</option>
          <option value="min">По мин. сумме</option>
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          {bestRsd !== null && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              RSD до {bestRsd}%{termSuffix}
            </span>
          )}
          {bestEur !== null && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
              EUR до {bestEur}%{termSuffix}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {checkboxes.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={filters[key]} onChange={e => set(key, e.target.checked)}
              className="accent-slate-800" />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Строка продукта — стиль BankMatrix (горизонтальная плашка)
// ─────────────────────────────────────────────────────────────────────────────
function probLabel(probability: TransformedMatrixItem["probability"], isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "Не открывают";
  if (probability === "high") return "Высокая вероятность";
  if (probability === "medium") return "Сербский рандом";
  return "Сложно открыть";
}

function probBadgeClass(probability: TransformedMatrixItem["probability"], isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "bg-red-50 text-red-700";
  if (probability === "high") return "bg-emerald-50 text-emerald-700";
  if (probability === "medium") return "bg-amber-50 text-amber-700";
  return "bg-orange-50 text-orange-700";
}

function ProductRow({ item, onDrawer, selectedTermMonths }: {
  item: TransformedMatrixItem;
  onDrawer: (item: TransformedMatrixItem) => void;
  selectedTermMonths: number | null;
}) {
  const p = asSavings(item);
  const bankName  = p.banks.name;
  const logoColor = BANKS_COLOR[bankName] ?? "#1e293b";
  const logoText  = BANKS_DARK.has(bankName) ? "#1e293b" : "#ffffff";
  const logoInit  = BANKS_INITIALS[bankName] ?? "??";
  const terms     = p.terms ?? [];
  const best      = bestRate(item);
  const displayRate = effectiveRate(item, selectedTermMonths);
  const isBlocked = !item.is_available || item.probability === "blocked";

  // Тег-чипы
  const tags: ReactElement[] = [];
  if ((p.tax_on_interest_pct ?? 0) === 0)
    tags.push(<span key="tax" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">0% налог</span>);
  else
    tags.push(<span key="tax" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">15% налог</span>);

  if (p.is_available_non_resident === true)
    tags.push(<span key="nonres" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Нерезидентам</span>);

  if (p.interest_payout === "monthly")
    tags.push(<span key="payout" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">% ежемесячно</span>);
  else
    tags.push(<span key="payout" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">% в конце</span>);

  if (p.capitalization_type && p.capitalization_type !== "at_end")
    tags.push(<span key="cap" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Капит. {CAP_LABEL[p.capitalization_type]}</span>);

  if (p.partial_withdrawal_allowed === true)
    tags.push(<span key="partial" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Частичное снятие</span>);

  if (p.grace_period_termination === true)
    tags.push(<span key="grace" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Льготное расторжение</span>);

  if (p.deposit_type === "combi")
    tags.push(<span key="combi" className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Combi</span>);

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

        {/* Ставка — за выбранный срок, либо максимум по всем срокам в обзорном режиме */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">
            {selectedTermMonths != null ? `ставка ${termLabel(selectedTermMonths)}` : "макс. ставка"}
          </p>
          <p className={`text-sm font-semibold ${displayRate > 0 ? "text-emerald-700" : "text-slate-400"}`}>
            {displayRate > 0 ? `${displayRate % 1 === 0 ? displayRate : displayRate.toFixed(2)}%` : "—"}
          </p>
        </div>

        {/* Мин. сумма */}
        {minStr(item) && (
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-[11px] text-slate-400">мин. сумма</p>
            <p className="text-sm font-semibold text-slate-800">{minStr(item)}</p>
          </div>
        )}

        {/* Вероятность */}
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${probBadgeClass(item.probability, item.is_available)}`}>
          {probLabel(item.probability, item.is_available)}
        </span>

        {/* Кнопка ⓘ */}
        <button
          onClick={() => onDrawer(item)}
          aria-label={`Условия: ${p.name}`}
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

      {/* Чипы сроков + теги — отдельной строкой снизу */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
        {terms.slice(0, 6).map(t => {
          const isHighlighted = selectedTermMonths != null
            ? t.term_months === selectedTermMonths
            : (t.rate_pct === best && best > 0);
          return (
            <div key={t.term_months}
              className={`flex flex-col items-center px-2 py-1 rounded-lg border min-w-[44px] ${
                isHighlighted ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
              }`}>
              <span className="text-[9px] text-slate-400">{termLabel(t.term_months)}</span>
              <span className={`text-xs font-bold ${
                isHighlighted ? "text-emerald-700" : t.rate_pct === 0 ? "text-slate-400" : "text-slate-800"
              }`}>{t.rate_pct > 0 ? `${t.rate_pct}%` : "0%"}</span>
            </div>
          );
        })}
        {terms.length > 6 && (
          <div className="flex flex-col items-center px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 min-w-[44px]">
            <span className="text-[9px] text-slate-400">ещё</span>
            <span className="text-xs font-bold text-slate-500">+{terms.length - 6}</span>
          </div>
        )}
        <div className="w-px h-6 bg-slate-200 mx-1" />
        {tags}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Секция (RSD / EUR) — опционально с под-группировкой по банку внутри
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, items, onDrawer, groupByBank, selectedTermMonths }: {
  title: string;
  items: TransformedMatrixItem[];
  onDrawer: (item: TransformedMatrixItem) => void;
  groupByBank: boolean;
  selectedTermMonths: number | null;
}) {
  const groupedByBank = useMemo(() => {
    if (!groupByBank) return null;
    return items.reduce((acc, item) => {
      const bankName = item.products.banks.name;
      if (!acc[bankName]) acc[bankName] = [];
      acc[bankName].push(item);
      return acc;
    }, {} as Record<string, TransformedMatrixItem[]>);
  }, [items, groupByBank]);

  if (items.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <span className="text-[11px] bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
          {items.length}
        </span>
      </div>

      {groupedByBank ? (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedByBank).map(([bankName, bankItems]) => (
            <div key={bankName}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 pl-1">
                {bankName}
              </p>
              <div className="flex flex-col gap-2">
                {bankItems.map(item => (
                  <ProductRow key={item.id} item={item} onDrawer={onDrawer} selectedTermMonths={selectedTermMonths} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <ProductRow key={item.id} item={item} onDrawer={onDrawer} selectedTermMonths={selectedTermMonths} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────────────────────────────────────────
interface SavingsTabProps {
  items: TransformedMatrixItem[];
}

export function SavingsTab({ items }: SavingsTabProps) {
  const [filters, setFilters] = useState<Filters>({
    cur: "all", term: "all", sort: "rate",
    nonres: false, monthly: false, partial: false, grace: false, cap: false,
  });
  const [drawerItem, setDrawerItem] = useState<TransformedMatrixItem | null>(null);

  const selectedTermMonths = filters.term !== "all" ? parseInt(filters.term, 10) : null;

  const filtered = useMemo(() => {
    let list = items.filter(i => i.products.category === "savings_deposit");
    if (filters.cur === "RSD") list = list.filter(isRSD);
    if (filters.cur === "EUR") list = list.filter(i => !isRSD(i));
    if (filters.term !== "all") {
      const t = parseInt(filters.term, 10);
      list = list.filter(i => hasTerm(i, t));
    }
    if (filters.nonres)  list = list.filter(i => asSavings(i).is_available_non_resident === true);
    if (filters.monthly) list = list.filter(i => asSavings(i).interest_payout === "monthly");
    if (filters.partial) list = list.filter(i => asSavings(i).partial_withdrawal_allowed === true);
    if (filters.grace)   list = list.filter(i => asSavings(i).grace_period_termination === true);
    if (filters.cap)     list = list.filter(i => asSavings(i).capitalization_type != null);
    // Сортировка по ставке — за выбранный срок, если он выбран (иначе по максимуму,
    // как и раньше). Без этого "По ставке" сортировала бы по чужому для пользователя
    // числу, когда он уже сузил выбор до конкретного срока.
    if (filters.sort === "rate") list.sort((a, b) => effectiveRate(b, selectedTermMonths) - effectiveRate(a, selectedTermMonths));
    else if (filters.sort === "bank") list.sort((a, b) => a.products.banks.name.localeCompare(b.products.banks.name));
    else if (filters.sort === "min") {
      list.sort((a, b) => {
        const pa = asSavings(a); const pb = asSavings(b);
        return (pa.min_amount_rsd ?? pa.min_amount_eur ?? 0) - (pb.min_amount_rsd ?? pb.min_amount_eur ?? 0);
      });
    }
    return list;
  }, [items, filters, selectedTermMonths]);

  const rsdItems = useMemo(() => filtered.filter(isRSD), [filtered]);
  const eurItems = useMemo(() => filtered.filter(i => !isRSD(i)), [filtered]);
  const bestRsd = rsdItems.length ? Math.max(...rsdItems.map(i => effectiveRate(i, selectedTermMonths))) : null;
  const bestEur = eurItems.length ? Math.max(...eurItems.map(i => effectiveRate(i, selectedTermMonths))) : null;

  const handleDrawer = useCallback((item: TransformedMatrixItem) => setDrawerItem(item), []);

  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} bestRsd={bestRsd} bestEur={bestEur} selectedTermMonths={selectedTermMonths} />

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm mt-4">
          Нет вкладов по выбранным параметрам
        </div>
      ) : (
        <>
          <Section title="RSD-вклады (0% налог)"       items={rsdItems} onDrawer={handleDrawer} groupByBank selectedTermMonths={selectedTermMonths} />
          <Section title="Валютные вклады (15% налог)" items={eurItems} onDrawer={handleDrawer} groupByBank selectedTermMonths={selectedTermMonths} />
        </>
      )}

      <SavingsDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </>
  );
}
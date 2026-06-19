// src/components/Product/FundProductClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { TransformedFundItem, Probability } from "@/types/fund";
import type { ResidencyStatus } from "@/types/bank";

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

function probLabel(p: Probability, available: boolean): string {
  if (!available || p === "blocked") return "Отказ";
  if (p === "high") return "Высокая вероятность";
  if (p === "medium") return "50/50 — сербский рандом";
  return "Сложно";
}

function probClass(p: Probability, available: boolean): string {
  if (!available || p === "blocked") return "bg-red-50 text-red-800 border-red-200";
  if (p === "high") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (p === "medium") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-orange-50 text-orange-800 border-orange-200";
}

function fundTypeLabel(type: string): string {
  const map: Record<string, string> = {
    money_market: "Денежный рынок",
    bond: "Облигационный",
    equity: "Акционный",
    mixed: "Смешанный",
    real_estate: "Недвижимость",
  };
  return map[type] ?? type;
}

function riskLabel(level: number | null): string {
  if (level == null) return "Не указан";
  if (level <= 2) return `${level} / 7 — Низкий риск`;
  if (level <= 4) return `${level} / 7 — Умеренный риск`;
  return `${level} / 7 — Высокий риск`;
}

function Row({ label, value, green, red, small }: {
  label: string;
  value: string;
  green?: boolean;
  red?: boolean;
  small?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-2.5 border-b border-slate-100 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-right ${green ? "text-emerald-700" : red ? "text-red-600" : "text-slate-900"}`}>
        {value}
        {small && <span className="block text-xs font-normal text-slate-400 mt-0.5">{small}</span>}
      </span>
    </div>
  );
}

// ─── Левая колонка: доходность по годам ──────────────────────────────────────

function LeftReturns({ item }: { item: TransformedFundItem }) {
  const r = item.product.returns;
  const yearData = ([
    ["2021", r.return_2021_pct],
    ["2022", r.return_2022_pct],
    ["2023", r.return_2023_pct],
    ["2024", r.return_2024_pct],
    ["2025", r.return_2025_pct],
  ] as [string, number | null | undefined][]).filter(([, v]) => v != null);

  const maxAbs = Math.max(1, ...yearData.map(([, v]) => Math.abs(v as number)));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Доходность по годам</h3>

      {yearData.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          Данные по годовой доходности пока не опубликованы для этого фонда.
        </p>
      ) : (
        <div className="space-y-3">
          {yearData.map(([year, value]) => {
            const v = value as number;
            const widthPct = Math.min(100, (Math.abs(v) / maxAbs) * 100);
            return (
              <div key={year} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-10 shrink-0">{year}</span>
                <div className="flex-1 h-6 bg-slate-50 rounded-md relative overflow-hidden">
                  <div
                    className={`h-full rounded-md ${v >= 0 ? "bg-emerald-200" : "bg-red-200"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold w-16 text-right shrink-0 ${v >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {v >= 0 ? "+" : ""}{v}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {r.return_since_inception_annualized_pct != null && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Среднегодовая с основания</span>
          <span className="text-base font-bold text-slate-900">{r.return_since_inception_annualized_pct}%</span>
        </div>
      )}

      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        Исторические данные не являются гарантией будущих результатов. Источник: {r.returns_date ? `отчёт на ${r.returns_date}` : "официальные данные УК"}.
      </p>
    </div>
  );
}

// ─── Правая колонка ───────────────────────────────────────────────────────────

function RightCard({ item }: { item: TransformedFundItem }) {
  const isAvailable = item.is_available;
  const p = item.product;

  return (
    <div className="lg:sticky lg:top-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-4">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${probClass(item.probability, isAvailable)}`}>
          {probLabel(item.probability, isAvailable)}
        </span>

        <Row label="TER" value={p.fees.ter_approx_pct != null ? `≈${p.fees.ter_approx_pct}%` : "Нет данных"} green={p.fees.ter_approx_pct != null && p.fees.ter_approx_pct < 1} />
        <Row label="Управление" value={p.fees.management_fee_pct != null ? `${p.fees.management_fee_pct}%` : "—"} />
        <Row label="Вход" value={p.fees.entry_fee_pct === 0 ? "Бесплатно" : p.fees.entry_fee_pct != null ? `${p.fees.entry_fee_pct}%` : "—"} green={p.fees.entry_fee_pct === 0} />
        <Row label="Выход" value={p.fees.exit_fee_pct === 0 ? "Бесплатно" : p.fees.exit_fee_pct != null ? `${p.fees.exit_fee_pct}%` : "—"} green={p.fees.exit_fee_pct === 0} />
        <Row label="Налог в Сербии" value={`${p.tax_serbia_pct}% CGT`} />

        {item.availability_notes && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 text-xs text-slate-600 leading-relaxed">
            {item.availability_notes}
          </div>
        )}
      </div>

      <div className="p-4 pt-0 space-y-2">
        <a
          href={p.company.website ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-sm font-semibold py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Сайт {p.company.name} →
        </a>
        <Link
          href="/?tab=investment_bonds&invest=funds"
          className="block w-full text-center text-sm font-medium py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
        >
          ← Все фонды
        </Link>
      </div>

      <p className="px-4 pb-4 text-[10px] text-slate-400 leading-relaxed">
        Предварительные данные. Не являются инвестиционной рекомендацией.
      </p>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

interface FundProductClientProps {
  item: TransformedFundItem;
  userStatus: ResidencyStatus;
}

export function FundProductClient({ item, userStatus }: FundProductClientProps) {
  const [activeTab, setActiveTab] = useState<"about" | "fees" | "access">("about");
  const p = item.product;
  const initials = p.company.name.slice(0, 2).toUpperCase();

  const TAB_LABELS: Record<typeof activeTab, string> = {
    about: "О фонде",
    fees: "Комиссии",
    access: "Как купить",
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">

      {/* Breadcrumbs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-700 transition-colors">Главная</Link>
        <span>/</span>
        <Link href="/?tab=investment_bonds&invest=funds" className="hover:text-slate-700 transition-colors">
          Инвестфонды
        </Link>
        <span>/</span>
        <span className="text-slate-700 truncate max-w-[200px]">{p.name}</span>
      </div>

      {/* Шапка продукта */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
            style={{ backgroundColor: p.company.logo_color ?? "#1e293b" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 leading-snug truncate">{p.name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[10px] px-2 py-0.5 border border-slate-200 rounded text-slate-500 bg-slate-50">
                {p.company.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 border border-slate-200 rounded text-slate-500 bg-slate-50">
                {fundTypeLabel(p.fund_type)}
              </span>
              {!item.is_available && (
                <span className="text-[10px] px-2 py-0.5 border border-red-200 rounded text-red-700 bg-red-50 font-semibold">
                  Недоступен для вашего статуса
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Двухколоночный layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

          <div className="space-y-4">
            <LeftReturns item={item} />

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 mb-0.5">Проверенные эксперты</div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Русскоязычные специалисты в Сербии — помогут разобраться с покупкой паёв и налогами.
                </div>
                <Link href="/?tab=services" className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline">
                  Найти специалиста →
                </Link>
              </div>
            </div>
          </div>

          <RightCard item={item} />
        </div>

        {/* Детальный блок */}
        <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-0">
            <h2 className="text-sm font-bold text-slate-900 mb-0.5">О фонде «{p.name}»</h2>
            {p.investment_focus && (
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{p.investment_focus}</p>
            )}
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {(Object.keys(TAB_LABELS) as (typeof activeTab)[]).map(tab => (
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

          <div className="px-5 py-4">
            {activeTab === "about" && (
              <div className="space-y-1">
                <Row label="Тип фонда" value={fundTypeLabel(p.fund_type)} />
                <Row label="Уровень риска (SRRI)" value={riskLabel(p.risk_level)} />
                <Row label="Валюта" value={p.currency} />
                <Row label="Политика дохода" value={p.dividend_policy === "accumulating" ? "Накопительная" : "Распределительная"} />
                {p.recommended_horizon_months != null && (
                  <Row
                    label="Рекомендуемый горизонт"
                    value={p.recommended_horizon_months >= 12 ? `${Math.round(p.recommended_horizon_months / 12)} лет` : `${p.recommended_horizon_months} мес`}
                  />
                )}
                {p.inception_date && <Row label="Дата основания фонда" value={p.inception_date} />}
                {p.aum_eur_approx != null && (
                  <Row label="Активы фонда (AUM)" value={`€${Math.round(p.aum_eur_approx).toLocaleString("ru-RU")}`} small={p.aum_date ?? undefined} />
                )}
                {p.nav_per_unit_eur != null && <Row label="Цена пая" value={`€${p.nav_per_unit_eur}`} />}
              </div>
            )}

            {activeTab === "fees" && (
              <div className="space-y-1">
                <Row label="Управляющая комиссия" value={p.fees.management_fee_pct != null ? `${p.fees.management_fee_pct}% / год` : "Нет данных"} />
                <Row label="Депозитарий" value={p.fees.depozitar_fee_pct != null ? `${p.fees.depozitar_fee_pct}%` : "Нет данных"} />
                <Row label="Комиссия за вход" value={p.fees.entry_fee_pct === 0 ? "Бесплатно" : p.fees.entry_fee_pct != null ? `${p.fees.entry_fee_pct}%` : "Нет данных"} green={p.fees.entry_fee_pct === 0} />
                <Row label="Комиссия за выход" value={p.fees.exit_fee_pct === 0 ? "Бесплатно" : p.fees.exit_fee_pct != null ? `${p.fees.exit_fee_pct}%` : "Нет данных"} green={p.fees.exit_fee_pct === 0} />
                {p.fees.performance_fee_pct != null && (
                  <Row label="Комиссия за успех" value={`${p.fees.performance_fee_pct}%`} />
                )}
                <Row label="TER (общие расходы)" value={p.fees.ter_approx_pct != null ? `≈${p.fees.ter_approx_pct}%` : "Нет данных"} />
                {p.fees.notes && (
                  <p className="text-xs text-slate-500 leading-relaxed pt-3">{p.fees.notes}</p>
                )}
              </div>
            )}

            {activeTab === "access" && (
              <div className="space-y-1">
                <Row
                  label="Онлайн"
                  value={p.company.access_methods.online ? "Доступно" : "Нет данных"}
                  green={!!p.company.access_methods.online}
                />
                <Row
                  label="В отделении"
                  value={p.company.access_methods.offline_branch ? "Доступно" : "Нет данных"}
                  green={!!p.company.access_methods.offline_branch}
                />
                <Row label="Депозитарий" value={p.company.depozitar ?? "Не указан"} />
                <Row label="Регулятор" value={p.company.regulator} />
                {p.company.access_methods.notes && (
                  <p className="text-xs text-slate-500 leading-relaxed pt-3">{p.company.access_methods.notes}</p>
                )}
                {p.company.risks.length > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-800 mb-2">Риски</p>
                    <ul className="space-y-1.5">
                      {p.company.risks.map((risk, i) => (
                        <li key={i} className="flex gap-2 text-xs text-red-700 leading-relaxed">
                          <span className="shrink-0 font-semibold">!</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-5 pb-4 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Данные предоставлены управляющей компанией {p.company.name}.
          </div>
        </div>

        {/* Profile bar */}
        <div className="mt-3 bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Доступность отображена для: <strong className="text-slate-900">{formatStatus(userStatus)}</strong>
          </span>
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Изменить профиль →
          </Link>
        </div>

      </div>
    </div>
  );
}
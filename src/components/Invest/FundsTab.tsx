// src/components/Invest/FundsTab.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FundDrawer } from "@/components/Invest/FundDrawer";
import type { TransformedFundItem, Probability } from "@/types/fund";

interface FundsTabProps {
  items: TransformedFundItem[];
}

function probLabel(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "Недоступен";
  if (probability === "high") return "Высокая вероятность";
  if (probability === "medium") return "Сербский рандом";
  return "Сложно";
}

function probBadgeClass(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "bg-red-50 text-red-700";
  if (probability === "high") return "bg-emerald-50 text-emerald-700";
  if (probability === "medium") return "bg-amber-50 text-amber-700";
  return "bg-orange-50 text-orange-700";
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

function fundTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    money_market: "bg-blue-50 text-blue-700 border-blue-200",
    bond: "bg-emerald-50 text-emerald-700 border-emerald-200",
    equity: "bg-amber-50 text-amber-700 border-amber-200",
    mixed: "bg-purple-50 text-purple-700 border-purple-200",
    real_estate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return map[type] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

// Последняя известная годовая доходность — берём 2025, иначе 1y, иначе null
function latestReturn(item: TransformedFundItem): number | null {
  const r = item.product.returns;
  return r.return_2025_pct ?? r.return_1y_pct ?? null;
}

type FundTypeFilter = "all" | "money_market" | "bond" | "equity" | "mixed";

export function FundsTab({ items }: FundsTabProps) {
  const [typeFilter, setTypeFilter] = useState<FundTypeFilter>("all");
  const [drawerItem, setDrawerItem] = useState<TransformedFundItem | null>(null);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return items;
    return items.filter(i => i.product.fund_type === typeFilter);
  }, [items, typeFilter]);

  const groupedByCompany = useMemo(() => {
    return filtered.reduce((acc, item) => {
      const name = item.product.company.name;
      if (!acc[name]) acc[name] = [];
      acc[name].push(item);
      return acc;
    }, {} as Record<string, TransformedFundItem[]>);
  }, [filtered]);

  const TYPE_OPTIONS: { id: FundTypeFilter; label: string }[] = [
    { id: "all",          label: "Все типы"        },
    { id: "money_market", label: "Денежный рынок"  },
    { id: "bond",         label: "Облигационные"   },
    { id: "equity",       label: "Акционные"       },
    { id: "mixed",        label: "Смешанные"       },
  ];

  return (
    <div>
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5 text-sm text-purple-800">
        <span className="font-bold block mb-1">Локальные инвестиционные фонды (УК)</span>
        Альтернатива ETF для тех кто не открыл международного брокера. Покупка через УК-партнёра банка или онлайн. Налог 15% на прирост капитала.
      </div>

      {/* Фильтр по типу */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setTypeFilter(opt.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              typeFilter === opt.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Найдено: {filtered.length} фонд{filtered.length === 1 ? "" : filtered.length < 5 ? "а" : "ов"}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base font-semibold text-slate-700">Нет фондов под выбранный фильтр</h3>
          <p className="text-sm text-slate-400 mt-1">Измените параметры фильтрации</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByCompany).map(([companyName, companyItems]) => (
            <section key={companyName}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: companyItems[0]?.product.company.logo_color ?? "#1e293b" }}
                >
                  {companyName.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-slate-900">{companyName}</h3>
                <span className="text-[11px] bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
                  {companyItems.length} {companyItems.length === 1 ? "фонд" : "фонда"}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {companyItems.map(item => (
                  <FundRow key={item.id} item={item} onInfoClick={setDrawerItem} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <FundDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </div>
  );
}

// ─────────────────────────────────────────
// Строка фонда — стиль BankMatrix
// ─────────────────────────────────────────
function FundRow({ item, onInfoClick }: { item: TransformedFundItem; onInfoClick: (i: TransformedFundItem) => void }) {
  const p = item.product;
  const isBlocked = !item.is_available || item.probability === "blocked";
  const ret = latestReturn(item);
  const logoColor = p.company.logo_color ?? "#1e293b";
  const logoTextColor = logoColor === "#FFCC00" ? "#1e293b" : "#ffffff";
  const logoInitials = p.company.name.slice(0, 2).toUpperCase();

  return (
    <article
      className={`bg-white border rounded-2xl px-5 py-4 transition-colors ${
        isBlocked ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Логотип */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ backgroundColor: logoColor, color: logoTextColor }}
        >
          {logoInitials}
        </div>

        {/* Название + банк */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{p.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{p.company.name}</p>
        </div>

        {/* Доходность */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Доходность {ret != null ? "(2025)" : ""}</p>
          <p className={`text-sm font-semibold ${ret != null ? (ret >= 0 ? "text-emerald-700" : "text-red-600") : "text-slate-400"}`}>
            {ret != null ? `${ret >= 0 ? "+" : ""}${ret}%` : "Нет данных"}
          </p>
        </div>

        {/* TER */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[11px] text-slate-400">TER</p>
          <p className="text-sm font-semibold text-slate-800">
            {p.fees.ter_approx_pct != null ? `≈${p.fees.ter_approx_pct}%` : p.fees.management_fee_pct != null ? `${p.fees.management_fee_pct}%` : "—"}
          </p>
        </div>

        {/* Вероятность */}
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${probBadgeClass(item.probability, item.is_available)}`}>
          {probLabel(item.probability, item.is_available)}
        </span>

        {/* Кнопка ⓘ */}
        <button
          onClick={() => onInfoClick(item)}
          aria-label={`Подробности о ${p.name}`}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Кнопка Подробнее */}
        <Link
          href={`/funds/product/${p.fund_product_id}`}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Подробнее
        </Link>
      </div>

      {/* Теги — тип фонда + риск + валюта */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
        <span className={`text-[11px] px-2 py-0.5 rounded-[4px] border ${fundTypeBadgeClass(p.fund_type)}`}>
          {fundTypeLabel(p.fund_type)}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600">
          Риск {p.risk_level != null ? `${p.risk_level}/7` : "—"}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600">
          {p.currency}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600">
          Вход {p.fees.entry_fee_pct === 0 ? "0%" : p.fees.entry_fee_pct != null ? `${p.fees.entry_fee_pct}%` : "—"} / выход {p.fees.exit_fee_pct === 0 ? "0%" : p.fees.exit_fee_pct != null ? `${p.fees.exit_fee_pct}%` : "—"}
        </span>
      </div>
    </article>
  );
}
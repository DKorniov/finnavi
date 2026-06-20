// src/components/Invest/BrokerTab.tsx
"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import type { BrokerJSON, FundingRoute, BrokerInstruments } from "@/types/broker";
import type { ResidencyStatus, Probability } from "@/types/bank";

// ─────────────────────────────────────────────────────────────────────────────
// Вероятность — единая логика с остальными разделами
// ─────────────────────────────────────────────────────────────────────────────
function probLabel(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "Недоступен";
  if (probability === "high") return "Стабилен";
  if (probability === "medium") return "Сербский рандом";
  return "Нестабилен";
}

function probBadgeClass(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "bg-red-50 text-red-700";
  if (probability === "high") return "bg-emerald-50 text-emerald-700";
  if (probability === "medium") return "bg-amber-50 text-amber-700";
  return "bg-orange-50 text-orange-700";
}

const INSTRUMENT_LABEL: Record<keyof BrokerInstruments, string> = {
  stocks: "Акции",
  etf: "ETF",
  bonds_world: "Облигации мира",
  bonds_serbia: "Облигации Сербии",
  options: "Опционы",
  crypto: "Крипто",
};

// Лучший маршрут пополнения: сначала по success_rate, при равенстве — по меньшей комиссии
const SUCCESS_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, blocked: 0 };
function bestRoute(routes: FundingRoute[]): FundingRoute | null {
  if (routes.length === 0) return null;
  return [...routes].sort((a, b) => {
    const rankDiff = SUCCESS_RANK[b.success_rate] - SUCCESS_RANK[a.success_rate];
    if (rankDiff !== 0) return rankDiff;
    return a.fee_pct - b.fee_pct;
  })[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Тег
// ─────────────────────────────────────────────────────────────────────────────
function Tag({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${cls}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Фильтры
// ─────────────────────────────────────────────────────────────────────────────
type SortKey = "fee" | "name";

interface Filters {
  instrument: "all" | keyof BrokerInstruments;
  sort: SortKey;
}

function FilterPanel({ filters, onChange, instrumentOptions }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  instrumentOptions: (keyof BrokerInstruments)[];
}) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 shadow-xs">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <select
          value={filters.instrument}
          onChange={e => set("instrument", e.target.value as Filters["instrument"])}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800"
        >
          <option value="all">Любой инструмент</option>
          {/* Опции строятся из реальных данных — показываются только инструменты,
              которые хотя бы у одного брокера действительно есть */}
          {instrumentOptions.map(key => (
            <option key={key} value={key}>{INSTRUMENT_LABEL[key]}</option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={e => set("sort", e.target.value as SortKey)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800"
        >
          <option value="fee">Дешевле пополнение ↑</option>
          <option value="name">По названию</option>
        </select>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Строка брокера
// ─────────────────────────────────────────────────────────────────────────────
function BrokerRow({ broker, currentStatus, onInfoClick }: {
  broker: BrokerJSON;
  currentStatus: ResidencyStatus;
  onInfoClick: (broker: BrokerJSON) => void;
}) {
  const availability = broker.availability.find(a => a.status === currentStatus);
  const isAvailable = availability?.is_available ?? true;
  const probability = availability?.probability ?? "medium";
  const route = bestRoute(broker.funding_routes);
  const logoText = broker.logo_color === "#FFCC00" ? "#1e293b" : "#ffffff";

  const instrumentTags = (Object.keys(INSTRUMENT_LABEL) as (keyof BrokerInstruments)[])
    .filter(key => broker.instruments[key]);

  return (
    <article
      className={`bg-white border rounded-2xl px-5 py-4 transition-colors ${
        !isAvailable ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Лого */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ backgroundColor: broker.logo_color, color: logoText }}
        >
          {broker.brand_name.slice(0, 2).toUpperCase()}
        </div>

        {/* Название */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{broker.brand_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {broker.broker_type === "international" ? "Международный брокер" : "Локальный брокер"}
          </p>
        </div>

        {/* Лучший маршрут пополнения */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Пополнение</p>
          <p className="text-sm font-semibold text-slate-900">
            {route ? `${route.fee_pct}%` : "—"}
          </p>
          {route && <p className="text-[10px] text-slate-400">{route.bank_name}</p>}
        </div>

        {/* Вероятность */}
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${probBadgeClass(probability, isAvailable)}`}>
          {probLabel(probability, isAvailable)}
        </span>

        {/* Кнопка ⓘ */}
        <button
          onClick={() => onInfoClick(broker)}
          aria-label={`Подробности о ${broker.brand_name}`}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Кнопка — внешняя ссылка, у брокеров нет внутренней страницы продукта */}
        <a
          href={broker.website}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Открыть счёт →
        </a>
      </div>

      {/* Инструменты */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
        {instrumentTags.map(key => (
          <Tag key={key} label={INSTRUMENT_LABEL[key]} cls="bg-blue-50 text-blue-700 border-blue-200" />
        ))}
        {broker.tax_serbia.etf_capital_gains_pct != null && (
          <Tag label={`ETF CGT ${broker.tax_serbia.etf_capital_gains_pct}%`} cls="bg-slate-100 text-slate-600 border-slate-200" />
        )}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer с деталями брокера — самостоятельный, т.к. отдельного BrokerDrawer
// в проекте пока нет (в отличие от ProductDrawer для счетов)
// ─────────────────────────────────────────────────────────────────────────────
function BrokerDrawer({ broker, currentStatus, onClose }: {
  broker: BrokerJSON | null;
  currentStatus: ResidencyStatus;
  onClose: () => void;
}) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (broker) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [broker, handleKeyDown]);

  const isOpen = broker !== null;
  const availability = broker?.availability.find(a => a.status === currentStatus);
  const logoText = broker?.logo_color === "#FFCC00" ? "#1e293b" : "#ffffff";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Детали: ${broker?.brand_name ?? ""}`}
        className={`fixed top-0 right-0 bottom-0 w-[380px] bg-white z-50 flex flex-col
          border-l border-slate-200 shadow-xl transition-transform duration-250 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Шапка */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ backgroundColor: broker?.logo_color ?? "#1e293b", color: logoText }}
          >
            {broker?.brand_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{broker?.brand_name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {broker?.broker_type === "international" ? "Международный брокер" : "Локальный брокер"}
            </p>
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

        {/* Тело */}
        <div className="flex-1 overflow-y-auto">
          {broker && (
            <>
              {/* Доступность для текущего статуса */}
              <div className="px-5 py-3 border-b border-slate-100">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Доступность для вашего статуса
                </h4>
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${probBadgeClass(availability?.probability ?? "medium", availability?.is_available ?? true)}`}>
                  {probLabel(availability?.probability ?? "medium", availability?.is_available ?? true)}
                </span>
                {availability?.notes && (
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">{availability.notes}</p>
                )}
              </div>

              {/* Маршруты пополнения */}
              <div className="px-5 py-3 border-b border-slate-100">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Маршруты пополнения
                </h4>
                <div className="space-y-2">
                  {broker.funding_routes.map((route, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-700">{route.bank_name}</span>
                        <span className="text-xs font-bold text-slate-900">{route.fee_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 uppercase">{route.method} · {route.currency}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          route.success_rate === "high" ? "bg-emerald-50 text-emerald-700"
                          : route.success_rate === "medium" ? "bg-amber-50 text-amber-700"
                          : route.success_rate === "low" ? "bg-orange-50 text-orange-700"
                          : "bg-red-50 text-red-700"
                        }`}>
                          {route.success_rate}
                        </span>
                      </div>
                      {route.notes && <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{route.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Налоги в Сербии */}
              <div className="px-5 py-3 border-b border-slate-100">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Налоги в Сербии
                </h4>
                <div className="space-y-1.5 text-xs">
                  {broker.tax_serbia.etf_capital_gains_pct != null && (
                    <div className="flex justify-between"><span className="text-slate-500">ETF, прирост капитала</span><span className="font-semibold text-slate-800">{broker.tax_serbia.etf_capital_gains_pct}%</span></div>
                  )}
                  {broker.tax_serbia.etf_dividend_pct != null && (
                    <div className="flex justify-between"><span className="text-slate-500">ETF, дивиденды</span><span className="font-semibold text-slate-800">{broker.tax_serbia.etf_dividend_pct}%</span></div>
                  )}
                  {broker.tax_serbia.bonds_coupon_pct != null && (
                    <div className="flex justify-between"><span className="text-slate-500">Облигации, купон</span><span className="font-semibold text-slate-800">{broker.tax_serbia.bonds_coupon_pct}%</span></div>
                  )}
                  {broker.tax_serbia.bonds_capital_gains_pct != null && (
                    <div className="flex justify-between"><span className="text-slate-500">Облигации, прирост капитала</span><span className="font-semibold text-slate-800">{broker.tax_serbia.bonds_capital_gains_pct}%</span></div>
                  )}
                </div>
                {broker.tax_serbia.notes && (
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-2">{broker.tax_serbia.notes}</p>
                )}
              </div>

              {/* Плюсы и риски */}
              <div className="px-5 py-3">
                {broker.pros.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Плюсы</h4>
                    <ul className="space-y-1.5">
                      {broker.pros.map((pro, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-700 leading-relaxed">
                          <span className="text-emerald-500 shrink-0">✓</span>{pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {broker.risks.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Риски</h4>
                    <ul className="space-y-1.5">
                      {broker.risks.map((risk, i) => (
                        <li key={i} className="flex gap-2 text-xs text-amber-700 leading-relaxed">
                          <span className="shrink-0">⚠</span>{risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Футер */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100">
          <a
            href={broker?.website ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-sm font-semibold py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Открыть счёт →
          </a>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────────────────────────────────────────
interface BrokerTabProps {
  brokers: BrokerJSON[];
  currentStatus: ResidencyStatus;
}

export function BrokerTab({ brokers, currentStatus }: BrokerTabProps) {
  const [filters, setFilters] = useState<Filters>({ instrument: "all", sort: "fee" });
  const [drawerBroker, setDrawerBroker] = useState<BrokerJSON | null>(null);

  // Опции инструментов — только те, что реально встречаются хотя бы у одного брокера
  const instrumentOptions = useMemo(() => {
    const found = new Set<keyof BrokerInstruments>();
    brokers.forEach(b => {
      (Object.keys(INSTRUMENT_LABEL) as (keyof BrokerInstruments)[]).forEach(key => {
        if (b.instruments[key]) found.add(key);
      });
    });
    return (Object.keys(INSTRUMENT_LABEL) as (keyof BrokerInstruments)[]).filter(k => found.has(k));
  }, [brokers]);

  const filtered = useMemo(() => {
    let list = brokers;
    if (filters.instrument !== "all") {
      list = list.filter(b => b.instruments[filters.instrument as keyof BrokerInstruments]);
    }
    const sorted = [...list];
    if (filters.sort === "fee") {
      sorted.sort((a, b) => {
        const ra = bestRoute(a.funding_routes)?.fee_pct ?? Infinity;
        const rb = bestRoute(b.funding_routes)?.fee_pct ?? Infinity;
        return ra - rb;
      });
    } else {
      sorted.sort((a, b) => a.brand_name.localeCompare(b.brand_name));
    }
    return sorted;
  }, [brokers, filters]);

  if (brokers.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        <h3 className="text-base font-semibold text-slate-700">Нет данных о брокерах</h3>
        <p className="text-sm text-slate-400 mt-1">
          Убедитесь, что файлы размещены в <code className="bg-slate-100 px-1 rounded">data/brokers/</code>
        </p>
      </div>
    );
  }

  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} instrumentOptions={instrumentOptions} />

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
          Нет брокеров по выбранным параметрам
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(broker => (
            <BrokerRow key={broker.broker_id} broker={broker} currentStatus={currentStatus} onInfoClick={setDrawerBroker} />
          ))}
        </div>
      )}

      <BrokerDrawer broker={drawerBroker} currentStatus={currentStatus} onClose={() => setDrawerBroker(null)} />
    </>
  );
}
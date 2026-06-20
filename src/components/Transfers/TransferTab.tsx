// src/components/Transfers/TransferTab.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductDrawer } from "@/components/Accounts/ProductDrawer";
import type { TransformedMatrixItem, Probability } from "@/types/bank";

// ─────────────────────────────────────────────────────────────────────────────
// Вероятность — те же подписи, что и в остальных разделах
// ─────────────────────────────────────────────────────────────────────────────
function probLabel(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "Не открывают";
  if (probability === "high") return "Высокая вероятность";
  if (probability === "medium") return "Сербский рандом";
  return "Сложно открыть";
}

function probBadgeClass(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === "blocked") return "bg-red-50 text-red-700";
  if (probability === "high") return "bg-emerald-50 text-emerald-700";
  if (probability === "medium") return "bg-amber-50 text-amber-700";
  return "bg-orange-50 text-orange-700";
}

// Поштанска хранит валюты в поле `currencies`, остальные банки — в `supported_currencies`.
// Схема несогласована между банками (см. примечание в data/banks/postanska.json,
// поле transfer.currencies стоило бы переименовать в supported_currencies для консистентности) —
// здесь просто читаем оба варианта, ничего не чиним молча.
function getCurrencies(product: TransformedMatrixItem["products"]): string[] {
  return product.supported_currencies ?? product.currencies ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Фильтры
// ─────────────────────────────────────────────────────────────────────────────
type SortKey = "outgoing" | "incoming" | "bank";

interface Filters {
  currency: "all" | string;
  sort: SortKey;
}

function feeOutgoing(item: TransformedMatrixItem): number {
  return item.products.fee_outgoing_pct ?? Infinity;
}
function feeIncoming(item: TransformedMatrixItem): number {
  return item.products.fee_incoming_pct ?? Infinity;
}

function FilterPanel({ filters, onChange, currencyOptions }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  currencyOptions: string[];
}) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 shadow-xs">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <select
          value={filters.currency}
          onChange={e => set("currency", e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800"
        >
          <option value="all">Любая валюта</option>
          {/* Опции строятся из реальных данных всех банков, не хардкод */}
          {currencyOptions.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={e => set("sort", e.target.value as SortKey)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800"
        >
          <option value="outgoing">Дешевле исходящий ↑</option>
          <option value="incoming">Дешевле входящий ↑</option>
          <option value="bank">По банку</option>
        </select>
      </div>
    </div>
  );
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
// Строка продукта
// ─────────────────────────────────────────────────────────────────────────────
function ProductRow({ item, onInfoClick }: {
  item: TransformedMatrixItem;
  onInfoClick: (item: TransformedMatrixItem) => void;
}) {
  const p = item.products;
  const isBlocked = !item.is_available || item.probability === "blocked";
  const logoColor = p.banks.logo_color ?? "#1e293b";
  const logoText  = logoColor === "#FFCC00" ? "#1e293b" : "#ffffff";
  const logoInit  = p.banks.name.slice(0, 2).toUpperCase();
  const currencies = getCurrencies(p).filter(c => c !== "RSD");

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
          <p className="text-xs text-slate-400 mt-0.5">{p.banks.name}</p>
        </div>

        {/* Входящий */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Входящий</p>
          <p className={`text-sm font-semibold ${p.fee_incoming_pct === 0 ? "text-emerald-700" : "text-slate-900"}`}>
            {p.fee_incoming_pct === 0 ? "Бесплатно" : p.fee_incoming_pct != null ? `${p.fee_incoming_pct}%` : "—"}
          </p>
          {p.fee_incoming_min_rsd != null && (
            <p className="text-[10px] text-slate-400">мин {p.fee_incoming_min_rsd.toLocaleString("ru-RU")} RSD</p>
          )}
        </div>

        {/* Исходящий — это то, что обычно болит, выделяем явно */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Исходящий</p>
          <p className="text-sm font-semibold text-slate-900">
            {p.fee_outgoing_pct != null ? `${p.fee_outgoing_pct}%` : "—"}
          </p>
          {(p.fee_outgoing_min_rsd != null || p.fee_outgoing_max_rsd != null) && (
            <p className="text-[10px] text-slate-400">
              {p.fee_outgoing_min_rsd != null ? `мин ${p.fee_outgoing_min_rsd.toLocaleString("ru-RU")}` : ""}
              {p.fee_outgoing_min_rsd != null && p.fee_outgoing_max_rsd != null ? " / " : ""}
              {p.fee_outgoing_max_rsd != null ? `макс ${p.fee_outgoing_max_rsd.toLocaleString("ru-RU")} RSD` : ""}
            </p>
          )}
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
          href={`/accounts/product/${p.product_id}`}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Подробнее
        </Link>
      </div>

      {/* Валюты */}
      {currencies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {currencies.map(c => (
            <Tag key={c} label={c} cls="bg-slate-100 text-slate-600 border-slate-200" />
          ))}
        </div>
      )}

      {/* Ограничение для нерезидентов/новых ВНЖ — полнотекстовое, не помещается в тег */}
      {p.outgoing_resident_restriction && (
        <div className="mt-3 flex gap-2 items-start bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800">
          <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>Для нерезидентов / ВНЖ &lt; 1 года:</strong> {p.outgoing_resident_restriction}
            {p.outgoing_resident_1y_plus && <> · <strong>После 1+ года:</strong> {p.outgoing_resident_1y_plus}</>}
          </span>
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Группа по эмитенту (банку)
// ─────────────────────────────────────────────────────────────────────────────
function IssuerGroup({ bankName, items, onInfoClick }: {
  bankName: string;
  items: TransformedMatrixItem[];
  onInfoClick: (item: TransformedMatrixItem) => void;
}) {
  const logoColor = items[0]?.products.banks.logo_color ?? "#1e293b";
  const logoText  = logoColor === "#FFCC00" ? "#1e293b" : "#ffffff";
  const logoInit  = bankName.slice(0, 2).toUpperCase();

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: logoColor, color: logoText }}
        >
          {logoInit}
        </div>
        <h3 className="font-bold text-slate-900">{bankName}</h3>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <ProductRow key={item.id} item={item} onInfoClick={onInfoClick} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────────────────────────────────────────
interface TransferTabProps {
  items: TransformedMatrixItem[];
}

export function TransferTab({ items }: TransferTabProps) {
  const [filters, setFilters] = useState<Filters>({ currency: "all", sort: "outgoing" });
  const [drawerItem, setDrawerItem] = useState<TransformedMatrixItem | null>(null);

  // Опции валют — строятся из реальных данных всех банков (п.4.1), не хардкод
  const currencyOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => getCurrencies(item.products).forEach(c => {
      if (c !== "RSD") set.add(c);
    }));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filters.currency !== "all") {
      list = list.filter(item => getCurrencies(item.products).includes(filters.currency));
    }
    const sorted = [...list];
    if (filters.sort === "outgoing") sorted.sort((a, b) => feeOutgoing(a) - feeOutgoing(b));
    else if (filters.sort === "incoming") sorted.sort((a, b) => feeIncoming(a) - feeIncoming(b));
    else sorted.sort((a, b) => a.products.banks.name.localeCompare(b.products.banks.name));
    return sorted;
  }, [items, filters]);

  const groupedByBank = useMemo(() => {
    return filtered.reduce((acc, item) => {
      const bankName = item.products.banks.name;
      if (!acc[bankName]) acc[bankName] = [];
      acc[bankName].push(item);
      return acc;
    }, {} as Record<string, TransformedMatrixItem[]>);
  }, [filtered]);

  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} currencyOptions={currencyOptions} />

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
          Нет продуктов по выбранным параметрам
        </div>
      ) : filters.sort === "bank" ? (
        <div className="space-y-8">
          {Object.entries(groupedByBank).map(([bankName, bankItems]) => (
            <IssuerGroup key={bankName} bankName={bankName} items={bankItems} onInfoClick={setDrawerItem} />
          ))}
        </div>
      ) : (
        // При сортировке по цене группировка по банку мешает сравнению — плоский список
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <ProductRow key={item.id} item={item} onInfoClick={setDrawerItem} />
          ))}
        </div>
      )}

      <ProductDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </>
  );
}
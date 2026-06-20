// src/components/Accounts/BusinessAccountTab.tsx
"use client";

import { useMemo, useState, type ReactElement } from "react";
import Link from "next/link";
import { ProductDrawer } from "@/components/Accounts/ProductDrawer";
import type { TransformedMatrixItem, Probability } from "@/types/bank";

// ─────────────────────────────────────────────────────────────────────────────
// Вероятность открытия — те же подписи, что в BankMatrix/ProductDrawer
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

// ─────────────────────────────────────────────────────────────────────────────
// Тег аудитории — из структурного поля product.target, а не из текста названия.
// Это поле заполнено у всех 5 банков (кроме одного продукта Poštanska),
// в отличие от текстового паттерна "za pravna lica/preduzetnike", который
// встречается только у Alta. "sve" (для всех) тегом не помечаем — это база.
// ─────────────────────────────────────────────────────────────────────────────
const TARGET_LABEL: Record<string, string> = {
  preduzetnik: "Для ИП (preduzetnik)",
  malo_privredno_drustvo: "Малый бизнес (ООО)",
  srednje: "Средний бизнес",
};

const TIER_LABEL: Record<string, string> = {
  basic: "Базовый",
  standard: "Стандарт",
  premium: "Премиум",
};

// ─────────────────────────────────────────────────────────────────────────────
// Резидентность — у Alta это закодировано прямо в названии продукта
// ("... - rezidente" / "... - nerezidente"), потому что у банка это
// буквально разные продукты, а не одна и та же запись с разной KYC-вероятностью.
// У остальных банков такого разделения в названии нет — паттерн просто не
// сработает и название останется как есть, без поломок.
// ─────────────────────────────────────────────────────────────────────────────
interface ParsedAccountName {
  shortName: string;
  residencyTag: { label: string; cls: string } | null;
}

function parseAccountName(raw: string): ParsedAccountName {
  const residencyMatch = raw.match(/-\s*(nerezidente|rezidente)\s*$/i);
  if (!residencyMatch) {
    return { shortName: raw, residencyTag: null };
  }

  const isNonResident = residencyMatch[1].toLowerCase() === "nerezidente";
  const residencyTag = isNonResident
    ? { label: "Доступен нерезидентам", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : { label: "Только резидентам", cls: "bg-amber-50 text-amber-700 border-amber-200" };

  let rest = raw.slice(0, residencyMatch.index).trim();
  if (/dinarski i devizni teku[cć]i ra[cč]un/i.test(rest)) {
    rest = "Динарский и валютный текущий счёт";
  }

  return { shortName: rest, residencyTag };
}

// ─────────────────────────────────────────────────────────────────────────────
// Динамические теги из реальных полей продукта
// ─────────────────────────────────────────────────────────────────────────────
function Tag({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-[4px] border ${cls}`}>
      {label}
    </span>
  );
}

function extractTags(product: TransformedMatrixItem["products"], residencyTag: ParsedAccountName["residencyTag"]): ReactElement[] {
  const tags: ReactElement[] = [];

  if (residencyTag) tags.push(<Tag key="res" {...residencyTag} />);

  const target = product.target ?? "";
  if (TARGET_LABEL[target]) {
    tags.push(<Tag key="target" label={TARGET_LABEL[target]} cls="bg-slate-100 text-slate-600 border-slate-200" />);
  }

  const tier = product.package_tier ?? "";
  if (TIER_LABEL[tier]) {
    tags.push(<Tag key="tier" label={`Пакет: ${TIER_LABEL[tier]}`} cls="bg-indigo-50 text-indigo-700 border-indigo-200" />);
  }

  (product.cards?.international ?? []).forEach(c =>
    tags.push(<Tag key={`card-${c}`} label={c} cls="bg-blue-50 text-blue-700 border-blue-200" />)
  );
  tags.push(<Tag key="dina" label="DinaCard" cls="bg-blue-50 text-blue-700 border-blue-200" />);

  if (product.is_multicurrency) {
    tags.push(<Tag key="multi" label="Мультивалютный" cls="bg-purple-50 text-purple-700 border-purple-200" />);
  }

  // Прочие валюты сверх стандартной пары RSD/EUR — интересны, когда их больше одной
  const currencies = product.supported_currencies ?? [];
  const otherForeign = currencies.filter(c => c !== "RSD" && c !== "EUR");
  if (otherForeign.length > 0) {
    tags.push(<Tag key="cur" label={otherForeign.join(" / ")} cls="bg-slate-100 text-slate-600 border-slate-200" />);
  }

  // п.4.2 — Apple/Google Pay схлопнуты в один тег
  if (product.features?.apple_pay || product.features?.google_pay) {
    tags.push(<Tag key="contactless" label="Бесконтактная оплата" cls="bg-emerald-50 text-emerald-700 border-emerald-200" />);
  }

  if (product.features?.prenesi) {
    tags.push(<Tag key="prenesi" label="Prenesi" cls="bg-teal-50 text-teal-700 border-teal-200" />);
  }

  if (product.features?.ips_qr) {
    tags.push(<Tag key="ips" label="IPS QR" cls="bg-teal-50 text-teal-700 border-teal-200" />);
  }

  if (product.swift_in?.pct === 0) {
    tags.push(<Tag key="swift0" label="SWIFT вход 0%" cls="bg-emerald-50 text-emerald-700 border-emerald-200" />);
  }

  if (product.cashback && product.cashback !== "Нет" && product.cashback !== "Нет программы кэшбэка") {
    tags.push(<Tag key="cb" label="Кэшбэк" cls="bg-amber-50 text-amber-700 border-amber-200" />);
  }

  return tags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Строка продукта — стиль FundsTab: лого фиксированной высоты вверху строки,
// метрика + бейдж + кнопки в одну линию, теги отдельной строкой снизу
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
  const parsed = parseAccountName(p.name);
  const tags = extractTags(p, parsed.residencyTag);

  return (
    <article
      className={`bg-white border rounded-2xl px-5 py-4 transition-colors ${
        isBlocked ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Лого — фиксированной высоты, не растягивается на всю строку */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ backgroundColor: logoColor, color: logoText }}
        >
          {logoInit}
        </div>

        {/* Название + банк */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug truncate" title={p.name}>
            {parsed.shortName}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{p.banks.name}</p>
        </div>

        {/* Обслуживание */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Ведение</p>
          <p className="text-sm font-semibold text-slate-900">
            {p.maintenance_fee_rsd === 0
              ? "Бесплатно"
              : p.maintenance_fee_rsd != null
                ? `${p.maintenance_fee_rsd} RSD/мес`
                : "Нет данных"}
          </p>
          {p.maintenance_fee_condition && (
            <p className="text-[10px] text-slate-400 max-w-[140px] leading-tight mt-0.5">{p.maintenance_fee_condition}</p>
          )}
        </div>

        {/* Вероятность */}
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${probBadgeClass(item.probability, item.is_available)}`}>
          {probLabel(item.probability, item.is_available)}
        </span>

        {/* Кнопка ⓘ */}
        <button
          onClick={() => onInfoClick(item)}
          aria-label={`Подробности о ${parsed.shortName}`}
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
        {tags}
      </div>
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
        <span className="text-[11px] bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
          {items.length} {items.length === 1 ? "продукт" : "продукта"}
        </span>
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
interface BusinessAccountTabProps {
  items: TransformedMatrixItem[];
}

export function BusinessAccountTab({ items }: BusinessAccountTabProps) {
  const [drawerItem, setDrawerItem] = useState<TransformedMatrixItem | null>(null);

  const groupedByBank = useMemo(() => {
    return items.reduce((acc, item) => {
      const bankName = item.products.banks.name;
      if (!acc[bankName]) acc[bankName] = [];
      acc[bankName].push(item);
      return acc;
    }, {} as Record<string, TransformedMatrixItem[]>);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-bold text-slate-800">Нет доступных РКО</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Для выбранного статуса резидентства бизнес-счета в базе данных не найдены.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedByBank).map(([bankName, bankItems]) => (
          <IssuerGroup key={bankName} bankName={bankName} items={bankItems} onInfoClick={setDrawerItem} />
        ))}
      </div>

      <ProductDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </>
  );
}
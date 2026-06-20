// src/components/Accounts/BankMatrix.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductDrawer } from "@/components/Accounts/ProductDrawer";
import type { TransformedMatrixItem, Probability } from "@/types/bank";

interface BankMatrixProps {
  initialItems: TransformedMatrixItem[];
}

// ─── Вспомогательные функции ────────────────────────────────────────────────

function probLabel(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === 'blocked') return "Не открывают";
  if (probability === 'high') return "Высокая вероятность";
  if (probability === 'medium') return "Сербский рандом";
  return "Сложно открыть";
}

function probBadgeClass(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === 'blocked') return "bg-red-50 text-red-700";
  if (probability === 'high') return "bg-emerald-50 text-emerald-700";
  if (probability === 'medium') return "bg-amber-50 text-amber-700";
  return "bg-orange-50 text-orange-700";
}

// ─── Типы фильтров ──────────────────────────────────────────────────────────
// "card" хранит конкретный бренд карты (строка из реальных данных), не enum —
// чтобы новый бренд в JSON подхватывался без правки кода (бэклог п.4.1)

type FeatureFilter = 'all' | 'contactless' | 'free_swift_in';

interface Filters {
  card: 'all' | string;
  feature: FeatureFilter;
}

// ─── Компонент тега ─────────────────────────────────────────────────────────

function Tag({ children, variant }: { children: React.ReactNode; variant: 'card' | 'feature' | 'currency' }) {
  const cls = {
    card: 'bg-blue-50 text-blue-800',
    feature: 'bg-emerald-50 text-emerald-800',
    currency: 'bg-slate-100 text-slate-600',
  }[variant];
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-[4px] whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

// ─── Пустое состояние ───────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
      <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-base font-semibold text-slate-700">Нет продуктов под выбранные фильтры</h3>
      <p className="text-sm text-slate-400 mt-1">Измените параметры фильтрации</p>
    </div>
  );
}

// ─── Строка продукта ────────────────────────────────────────────────────────

function ProductRow({ item, onInfoClick }: {
  item: TransformedMatrixItem;
  onInfoClick: (item: TransformedMatrixItem) => void;
}) {
  const p = item.products;
  const isBlocked = !item.is_available || item.probability === 'blocked';
  const logoColor = p.banks.logo_color ?? '#1e293b';
  const logoTextColor = logoColor === '#FFCC00' ? '#1e293b' : '#ffffff';
  const logoInitials = p.banks.name.slice(0, 2).toUpperCase();

  // Теги
  const tags: React.ReactNode[] = [];
  (p.cards?.international ?? []).forEach(c => (
    tags.push(<Tag key={`card-${c}`} variant="card">{c}</Tag>)
  ));
  tags.push(<Tag key="dina" variant="card">DinaCard</Tag>);

  if (p.is_multicurrency) {
    tags.push(<Tag key="multi" variant="currency">Мультивалютный</Tag>);
  } else if ((p.supported_currencies ?? []).includes('CNY')) {
    tags.push(<Tag key="cny" variant="currency">CNY счёт</Tag>);
  }

  // п.4.2 — Apple/Google/Garmin Pay схлопнуты в один тег (слой представления)
  if (p.features?.apple_pay || p.features?.google_pay || p.features?.garmin_pay) {
    tags.push(<Tag key="contactless" variant="feature">Бесконтактная оплата</Tag>);
  }
  if (p.features?.prenesi) tags.push(<Tag key="prenesi" variant="feature">Prenesi</Tag>);
  if (p.features?.ips_qr) tags.push(<Tag key="ips" variant="feature">IPS QR</Tag>);
  if (p.swift_in?.pct === 0) tags.push(<Tag key="swift0" variant="feature">SWIFT in 0%</Tag>);
  if (p.cashback && p.cashback !== 'Нет' && p.cashback !== 'Нет программы кэшбэка') {
    tags.push(<Tag key="cb" variant="feature">Кэшбэк</Tag>);
  }

  return (
    <article
      className={`bg-white border rounded-2xl px-5 py-4 transition-colors ${
        isBlocked ? 'border-slate-100 opacity-60' : 'border-slate-200 hover:border-slate-300'
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

        {/* Название */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{p.name}</p>
        </div>

        {/* Обслуживание */}
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Обслуживание</p>
          <p className="text-sm font-semibold text-slate-900">
            {p.maintenance_fee_rsd === 0
              ? 'Бесплатно'
              : p.maintenance_fee_rsd
                ? `${p.maintenance_fee_rsd} RSD/мес`
                : 'Нет данных'}
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
          href={`/accounts/product/${p.product_id}`}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Подробнее
        </Link>
      </div>

      {/* Теги */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
        {tags}
      </div>
    </article>
  );
}

// ─── Группа по эмитенту (банку) ─────────────────────────────────────────────

function IssuerGroup({ bankName, items, onInfoClick }: {
  bankName: string;
  items: TransformedMatrixItem[];
  onInfoClick: (item: TransformedMatrixItem) => void;
}) {
  const logoColor = items[0]?.products.banks.logo_color ?? '#1e293b';
  const logoTextColor = logoColor === '#FFCC00' ? '#1e293b' : '#ffffff';
  const logoInitials = bankName.slice(0, 2).toUpperCase();

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: logoColor, color: logoTextColor }}
        >
          {logoInitials}
        </div>
        <h3 className="font-bold text-slate-900">{bankName}</h3>
        <span className="text-[11px] bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
          {items.length} {items.length === 1 ? 'продукт' : items.length < 5 ? 'продукта' : 'продуктов'}
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

// ─── Основной компонент ─────────────────────────────────────────────────────

export function BankMatrix({ initialItems }: BankMatrixProps) {
  const [filters, setFilters] = useState<Filters>({ card: 'all', feature: 'all' });
  const [drawerItem, setDrawerItem] = useState<TransformedMatrixItem | null>(null);

  // Бренды карт — строятся из реальных данных, не хардкод (бэклог п.4.1).
  // Раньше список был захардкожен как Visa/Mastercard и не показывал
  // American Express, который реально есть у Intesa Magnifica.
  const cardOptions = useMemo(() => {
    const set = new Set<string>();
    initialItems.forEach(item => (item.products.cards?.international ?? []).forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    return initialItems.filter(({ products: p }) => {
      if (filters.card !== 'all') {
        const cards = p.cards?.international ?? [];
        if (!cards.includes(filters.card)) return false;
      }
      if (filters.feature === 'contactless' && !(p.features?.apple_pay || p.features?.google_pay || p.features?.garmin_pay)) return false;
      if (filters.feature === 'free_swift_in' && p.swift_in?.pct !== 0) return false;
      return true;
    });
  }, [initialItems, filters]);

  const groupedByBank = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const bankName = item.products.banks.name;
      if (!acc[bankName]) acc[bankName] = [];
      acc[bankName].push(item);
      return acc;
    }, {} as Record<string, TransformedMatrixItem[]>);
  }, [filteredItems]);

  function setCard(card: string) {
    setFilters(f => ({ ...f, card }));
  }
  function setFeature(feature: FeatureFilter) {
    setFilters(f => ({ ...f, feature }));
  }

  // ─── Рендер ─────────────────────────────────────────────────────────────

  return (
    <div className="font-sans">

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Карта:</span>
        <button
          onClick={() => setCard('all')}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            filters.card === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          Любая
        </button>
        {cardOptions.map(card => (
          <button
            key={card}
            onClick={() => setCard(card)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              filters.card === card
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {card}
          </button>
        ))}

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Особенности:</span>
        {([
          ['all', 'Любые'],
          ['contactless', 'Бесконтактная оплата'],
          ['free_swift_in', 'SWIFT in 0%'],
        ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFeature(val)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              filters.feature === val
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Счётчик */}
      <p className="text-xs text-slate-400 mb-4">
        Найдено: {filteredItems.length} продукт{filteredItems.length === 1 ? '' : filteredItems.length < 5 ? 'а' : 'ов'}
      </p>

      {filteredItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByBank).map(([bankName, items]) => (
            <IssuerGroup key={bankName} bankName={bankName} items={items} onInfoClick={setDrawerItem} />
          ))}
        </div>
      )}

      {/* Drawer — рендерится вне потока, управляется через стейт */}
      <ProductDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
      />
    </div>
  );
}
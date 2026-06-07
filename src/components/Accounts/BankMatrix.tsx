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

type CardFilter = 'all' | 'visa' | 'mastercard';
type FeatureFilter = 'all' | 'apple_pay' | 'free_swift_in' | 'rub' | 'garmin';

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

// ─── Основной компонент ─────────────────────────────────────────────────────

export function BankMatrix({ initialItems }: BankMatrixProps) {
  const [filterCard, setFilterCard] = useState<CardFilter>('all');
  const [filterFeat, setFilterFeat] = useState<FeatureFilter>('all');
  const [drawerItem, setDrawerItem] = useState<TransformedMatrixItem | null>(null);

  // Фильтрация
  const filteredItems = useMemo(() => {
    return initialItems.filter(({ products: p }) => {
      if (filterCard === 'visa') {
        const cards = (p.cards?.international ?? []).map(c => c.toLowerCase());
        if (!cards.some(c => c.includes('visa'))) return false;
      }
      if (filterCard === 'mastercard') {
        const cards = (p.cards?.international ?? []).map(c => c.toLowerCase());
        if (!cards.some(c => c.includes('mastercard'))) return false;
      }
      if (filterFeat === 'apple_pay' && !p.features?.apple_pay) return false;
      if (filterFeat === 'free_swift_in' && p.swift_in?.pct !== 0) return false;
      if (filterFeat === 'rub' && !(p.supported_currencies ?? []).includes('RUB')) return false;
      if (filterFeat === 'garmin' && !p.features?.garmin_pay) return false;
      return true;
    });
  }, [initialItems, filterCard, filterFeat]);

  const isBusiness = initialItems[0]?.products.category === 'business_account';

  // ─── Рендер ─────────────────────────────────────────────────────────────

  return (
    <div className="font-sans">

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Карта:</span>
        {([ ['all', 'Любая'], ['visa', 'Visa'], ['mastercard', 'Mastercard'] ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterCard(val)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              filterCard === val
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Особенности:</span>
        {([
          ['all', 'Любые'],
          ['apple_pay', 'Apple Pay'],
          ['free_swift_in', 'SWIFT in 0%'],
          ['rub', 'Счёт в рублях'],
          ...(!isBusiness ? [['garmin', 'Garmin Pay']] as const : []),
        ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterFeat(val as FeatureFilter)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              filterFeat === val
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
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => {
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
            } else {
              if ((p.supported_currencies ?? []).includes('RUB')) tags.push(<Tag key="rub" variant="currency">RUB счёт</Tag>);
              if ((p.supported_currencies ?? []).includes('CNY')) tags.push(<Tag key="cny" variant="currency">CNY счёт</Tag>);
            }

            if (p.features?.apple_pay) tags.push(<Tag key="apple" variant="feature">Apple Pay</Tag>);
            if (p.features?.google_pay) tags.push(<Tag key="google" variant="feature">Google Pay</Tag>);
            if (p.features?.garmin_pay) tags.push(<Tag key="garmin" variant="feature">Garmin Pay</Tag>);
            if (p.features?.prenesi) tags.push(<Tag key="prenesi" variant="feature">Prenesi</Tag>);
            if (p.features?.ips_qr) tags.push(<Tag key="ips" variant="feature">IPS QR</Tag>);
            if (p.swift_in?.pct === 0) tags.push(<Tag key="swift0" variant="feature">SWIFT in 0%</Tag>);
            if (p.cashback && p.cashback !== 'Нет' && p.cashback !== 'Нет программы кэшбэка') {
              tags.push(<Tag key="cb" variant="feature">Кэшбэк</Tag>);
            }

            return (
              <article
                key={item.id}
                className={`bg-white border rounded-2xl px-5 py-4 transition-colors ${
                  isBlocked
                    ? 'border-slate-100 opacity-60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Верхняя строка */}
                <div className="flex items-center gap-3">
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
                    <p className="text-xs text-slate-400 mt-0.5">{p.banks.name}</p>
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
                    onClick={() => setDrawerItem(item)}
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
          })}
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
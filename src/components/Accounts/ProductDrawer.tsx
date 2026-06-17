// src/components/Accounts/ProductDrawer.tsx
"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import type { TransformedMatrixItem, Probability } from "@/types/bank";

interface ProductDrawerProps {
  item: TransformedMatrixItem | null;
  onClose: () => void;
}

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

function DrawerRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="text-sm text-slate-500 shrink-0 max-w-[140px] leading-snug">{label}</span>
      <span className={`text-sm font-medium text-right leading-snug ${valueClass ?? 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3 border-b border-slate-100">
        {title}
      </h4>
      <div className="px-5">{children}</div>
    </div>
  );
}

function FeatureItem({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`} />
      <span className={active ? 'text-slate-800' : 'text-slate-400'}>{label}</span>
    </div>
  );
}

// Форматирование SWIFT — вынесено за компонент чтобы не пересоздавать
function fmtSwift(pct: number, min_rsd: number | null): string {
  const base = pct === 0 ? 'Бесплатно' : `${pct}%`;
  return min_rsd ? `${base} (мин ${min_rsd} RSD)` : base;
}

export function ProductDrawer({ item, onClose }: ProductDrawerProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (item) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [item, handleKeyDown]);

  const isOpen = item !== null;
  const p = item?.products;
  const isBlocked = item ? (!item.is_available || item.probability === 'blocked') : false;

  // Инициалы банка для аватара
  const logoInitials = p?.banks.name.slice(0, 2).toUpperCase() ?? '';

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Детали: ${p?.name ?? ''}`}
        className={`fixed top-0 right-0 bottom-0 w-[380px] bg-white z-50 flex flex-col
          border-l border-slate-200 shadow-xl transition-transform duration-250 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Шапка */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-sm font-semibold text-white shrink-0">
            {logoInitials}
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

        {/* Тело — скроллится */}
        <div className="flex-1 overflow-y-auto">

          {/* Блокировка — показываем red_flags вместо blocked_reasons */}
          {item && isBlocked && item.red_flags.length > 0 && (
            <DrawerSection title="Почему счёт недоступен">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 my-3">
                <p className="text-xs font-semibold text-amber-800 mb-2">Причины для вашего профиля</p>
                <ul className="space-y-1.5">
                  {item.red_flags.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-xs text-amber-700 leading-relaxed">
                      <span className="shrink-0 mt-0.5">→</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </DrawerSection>
          )}

          {/* Условия счёта */}
          {p && (
            <DrawerSection title="Условия счёта">
              {/* Обслуживание */}
              <DrawerRow
                label="Обслуживание"
                value={
                  p.maintenance_fee_rsd === 0
                    ? 'Бесплатно'
                    : p.maintenance_fee_rsd != null
                      ? `${p.maintenance_fee_rsd} RSD / мес`
                      : 'Нет данных'
                }
                valueClass={p.maintenance_fee_rsd === 0 ? 'text-emerald-700 font-medium' : 'text-slate-900 font-medium'}
              />

              {/* Входящий SWIFT — только если pct не null */}
              {p.swift_in?.pct != null && (
                <DrawerRow
                  label="Входящий SWIFT"
                  value={fmtSwift(p.swift_in.pct, p.swift_in.min_rsd)}
                  valueClass={
                    p.swift_in.pct === 0
                      ? 'text-emerald-700 font-medium'
                      : p.swift_in.pct >= 0.8
                        ? 'text-amber-700 font-medium'
                        : 'text-slate-900 font-medium'
                  }
                />
              )}

              {/* Исходящий SWIFT — только если pct не null */}
              {p.swift_out?.pct != null && (
                <DrawerRow
                  label="Исходящий SWIFT"
                  value={fmtSwift(p.swift_out.pct, p.swift_out.min_rsd)}
                  valueClass={
                    p.swift_out.pct === 0
                      ? 'text-emerald-700 font-medium'
                      : p.swift_out.pct >= 0.8
                        ? 'text-amber-700 font-medium'
                        : 'text-slate-900 font-medium'
                  }
                />
              )}

              {/* Карты */}
              {p.cards && (
                <DrawerRow
                  label="Карты"
                  value={[...p.cards.international, 'DinaCard'].join(', ')}
                />
              )}

              {/* Валюты */}
              {p.supported_currencies && p.supported_currencies.length > 0 && (
                <DrawerRow
                  label="Валюты счёта"
                  value={p.supported_currencies.join(', ')}
                />
              )}

              {/* Мультивалютный */}
              {p.is_multicurrency != null && (
                <DrawerRow
                  label="Мультивалютный"
                  value={p.is_multicurrency ? 'Да' : 'Нет'}
                  valueClass={p.is_multicurrency ? 'text-emerald-700 font-medium' : 'text-slate-400 font-medium'}
                />
              )}

              {/* Примечания из JSON */}
              {p.notes && (
                <div className="py-3">
                  <p className="text-xs text-slate-500 leading-relaxed">{p.notes}</p>
                </div>
              )}
            </DrawerSection>
          )}

          {/* Цифровые сервисы */}
          {p?.features && (
            <DrawerSection title="Цифровые сервисы">
              <div className="grid grid-cols-2 gap-2 py-3">
                <FeatureItem active={p.features.apple_pay  ?? false} label="Apple Pay" />
                <FeatureItem active={p.features.google_pay ?? false} label="Google Pay" />
                <FeatureItem active={p.features.garmin_pay ?? false} label="Garmin Pay" />
                <FeatureItem active={p.features.prenesi    ?? false} label="Prenesi" />
                <FeatureItem active={p.features.ips_qr     ?? false} label="IPS QR" />
              </div>
            </DrawerSection>
          )}

          {/* KYC */}
          {item && (
            <DrawerSection title="Вероятность открытия">
              <div className="py-3">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold mb-3 ${probBadgeClass(item.probability, item.is_available)}`}>
                  {probLabel(item.probability, item.is_available)}
                </span>
                {item.kyc_requirements.length > 0 && (
                  <ul className="space-y-1.5">
                    {item.kyc_requirements.map((doc, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-600">
                        <span className="text-slate-300 shrink-0">—</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DrawerSection>
          )}

          {/* Красные флаги — для доступных продуктов */}
          {item && item.is_available && item.red_flags.length > 0 && (
            <DrawerSection title="Важно знать">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 my-3">
                <ul className="space-y-1.5">
                  {item.red_flags.map((flag, i) => (
                    <li key={i} className="flex gap-2 text-xs text-red-700 leading-relaxed">
                      <span className="shrink-0 font-semibold">!</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </DrawerSection>
          )}

          {/* DinaCard */}
          {p?.cards?.dina_notes && (
            <DrawerSection title="DinaCard">
              <p className="text-xs text-slate-500 leading-relaxed py-3">{p.cards.dina_notes}</p>
            </DrawerSection>
          )}

        </div>

        {/* Футер */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100">
          <Link
            href={`/accounts/product/${p?.product_id ?? ''}`}
            className="block w-full text-center text-sm font-semibold py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Детальные тарифы →
          </Link>
        </div>
      </aside>
    </>
  );
}
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

// Строка в drawer: label + value
function DrawerRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="text-sm text-slate-500 shrink-0 max-w-[140px] leading-snug">{label}</span>
      <span className={`text-sm font-medium text-right leading-snug ${valueClass ?? 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}

// Секция с заголовком
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

// Индикатор фичи (точка + название)
function FeatureItem({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`} />
      <span className={active ? 'text-slate-800' : 'text-slate-400'}>{label}</span>
    </div>
  );
}

export function ProductDrawer({ item, onClose }: ProductDrawerProps) {
  // Закрытие по Escape
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

  // Логотип банка
  const logoColor = p?.banks.logo_color ?? '#1e293b';
  const logoTextColor = logoColor === '#FFCC00' ? '#1e293b' : '#ffffff';
  const logoInitials = p?.banks.name.slice(0, 2).toUpperCase() ?? '';

  // Форматирование SWIFT
  function fmtSwift(pct: number, min_rsd: number | null): string {
    const base = pct === 0 ? 'Бесплатно' : `${pct}%`;
    return min_rsd ? `${base} (мин ${min_rsd} RSD)` : base;
  }

  // Есть ли реальный кэшбэк
  const hasCashback = p?.cashback && p.cashback !== 'Нет' && p.cashback !== 'Нет программы кэшбэка';

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
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ backgroundColor: logoColor, color: logoTextColor }}
          >
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

        {/* Тело drawer — скроллится */}
        <div className="flex-1 overflow-y-auto">

          {/* Блок причин отказа — только для заблокированных */}
          {item && isBlocked && item.blocked_reasons.length > 0 && (
            <DrawerSection title="Почему счёт недоступен">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 my-3">
                <p className="text-xs font-semibold text-amber-800 mb-2">Причины для вашего профиля</p>
                <ul className="space-y-1.5">
                  {item.blocked_reasons.map((reason, i) => (
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
              <DrawerRow
                label="Обслуживание"
                value={p.maintenance_fee_rsd === 0 ? 'Бесплатно' : p.maintenance_fee_rsd ? `${p.maintenance_fee_rsd} RSD / мес` : 'Нет данных'}
              />
              {p.swift_in !== undefined && (
                <DrawerRow
                  label="Входящий SWIFT"
                  value={fmtSwift(p.swift_in.pct, p.swift_in.min_rsd)}
                  valueClass={p.swift_in.pct === 0 ? 'text-emerald-700 font-medium' : p.swift_in.pct >= 0.8 ? 'text-amber-700 font-medium' : 'text-slate-900 font-medium'}
                />
              )}
              {p.swift_out !== undefined && (
                <DrawerRow
                  label="Исходящий SWIFT"
                  value={fmtSwift(p.swift_out.pct, p.swift_out.min_rsd)}
                  valueClass={p.swift_out.pct >= 0.8 ? 'text-amber-700 font-medium' : 'text-slate-900 font-medium'}
                />
              )}
              <DrawerRow
                label="Срок изготовления карты"
                value={p.card_issue_days ?? 'Уточняйте в банке'}
                valueClass="text-slate-600 font-medium"
              />
              {p.cards && (
                <DrawerRow
                  label="Карты"
                  value={[...p.cards.international, 'DinaCard'].join(', ')}
                />
              )}
              {p.supported_currencies && (
                <DrawerRow
                  label="Валюты счёта"
                  value={p.supported_currencies.join(', ')}
                />
              )}
              <DrawerRow
                label="Бесконтактная оплата"
                value={p.features?.contactless ? 'Поддерживается' : 'Нет'}
                valueClass={p.features?.contactless ? 'text-emerald-700 font-medium' : 'text-slate-400 font-medium'}
              />
              <DrawerRow
                label="Кэшбэк"
                value={p.cashback ?? 'Нет'}
                valueClass={hasCashback ? 'text-emerald-700 font-medium' : 'text-slate-400 font-medium'}
              />
              {p.bonuses && (
                <DrawerRow
                  label="Бонусы и скидки"
                  value={p.bonuses}
                  valueClass="text-slate-600 font-medium"
                />
              )}
            </DrawerSection>
          )}

          {/* Цифровые сервисы */}
          {p?.features && (
            <DrawerSection title="Цифровые сервисы">
              <div className="grid grid-cols-2 gap-2 py-3">
                <FeatureItem active={p.features.apple_pay} label="Apple Pay" />
                <FeatureItem active={p.features.google_pay} label="Google Pay" />
                <FeatureItem active={p.features.garmin_pay} label="Garmin Pay" />
                <FeatureItem active={p.features.prenesi} label="Prenesi" />
                <FeatureItem active={p.features.ips_qr} label="IPS QR" />
                <FeatureItem active={p.features.contactless ?? false} label="Бесконтакт" />
              </div>
            </DrawerSection>
          )}

          {/* KYC — вероятность и документы */}
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

          {/* Красные флаги */}
          {item && item.red_flags.length > 0 && (
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

          {/* DinaCard заметка */}
          {p?.cards?.dina_notes && (
            <DrawerSection title="DinaCard">
              <p className="text-xs text-slate-500 leading-relaxed py-3">{p.cards.dina_notes}</p>
            </DrawerSection>
          )}

        </div>

        {/* Футер — sticky */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 flex gap-3">
          <Link
            href={`/accounts/product/${p?.product_id ?? ''}`}
            className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Детальные тарифы →
          </Link>
        </div>
      </aside>
    </>
  );
}
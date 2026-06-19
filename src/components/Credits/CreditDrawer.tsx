// src/components/Credits/CreditDrawer.tsx
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

export function CreditDrawer({ item, onClose }: ProductDrawerProps) {
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

          {/* Блокировка */}
          {item && isBlocked && item.red_flags.length > 0 && (
            <DrawerSection title="Почему недоступен">
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

          {/* Ставка */}
          {p && (
            <DrawerSection title="Ставка">
              {p.rate_type && (
                <DrawerRow
                  label="Тип ставки"
                  value={
                    p.rate_type === 'fixed'    ? 'Фиксированная' :
                    p.rate_type === 'variable' ? 'Плавающая'     :
                    p.rate_type === 'combined' ? 'Комбинированная' : p.rate_type
                  }
                />
              )}
              {p.rate_base && (
                <DrawerRow
                  label="База"
                  value={`${p.rate_base}${p.rate_margin_pct != null ? ` + ${p.rate_margin_pct}% маржа` : ''}`}
                />
              )}
              {p.rate_fixed_period_years != null && (
                <DrawerRow
                  label="Фикс. период"
                  value={`${p.rate_fixed_period_years} лет, затем плавающая`}
                />
              )}
              {(p.rate_approx_total_pct ?? p.rate_approx_pct) != null && (
                <DrawerRow
                  label="Ставка (примерная)"
                  value={`≈${p.rate_approx_total_pct ?? p.rate_approx_pct}% годовых`}
                  valueClass="text-emerald-700 font-semibold"
                />
              )}
            </DrawerSection>
          )}

          {/* Параметры кредита */}
          {p && (
            <DrawerSection title="Параметры кредита">
              {/* Ипотека */}
              {p.category === 'credit_mortgage' && (
                <>
                  {p.min_down_payment_pct != null && (
                    <DrawerRow label="Первоначальный взнос" value={`от ${p.min_down_payment_pct}%`} />
                  )}
                  {p.max_ltv_pct != null && (
                    <DrawerRow label="Макс. LTV" value={`${p.max_ltv_pct}%`} />
                  )}
                  {p.loan_term_years && p.loan_term_years.length > 0 && (
                    <DrawerRow
                      label="Срок"
                      value={
                        p.loan_term_years.length === 1
                          ? `до ${p.loan_term_years[0]} лет`
                          : `${Math.min(...p.loan_term_years)}–${Math.max(...p.loan_term_years)} лет`
                      }
                    />
                  )}
                  {p.min_amount_eur != null && (
                    <DrawerRow label="Сумма от" value={`€${p.min_amount_eur.toLocaleString('ru-RU')}`} />
                  )}
                  {p.max_amount_eur != null && (
                    <DrawerRow label="Сумма до" value={`€${p.max_amount_eur.toLocaleString('ru-RU')}`} />
                  )}
                  {p.currency && (
                    <DrawerRow label="Валюта" value={p.currency} />
                  )}
                </>
              )}
              {/* Потребкредит / авто */}
              {p.category === 'credit_consumer' && (
                <>
                  {p.loan_term_months && p.loan_term_months.length > 0 && (
                    <DrawerRow
                      label="Срок"
                      value={
                        p.loan_term_months.length <= 2
                          ? `${Math.min(...p.loan_term_months)}–${Math.max(...p.loan_term_months)} мес`
                          : `до ${Math.max(...p.loan_term_months)} мес`
                      }
                    />
                  )}
                  {p.min_amount_rsd != null && (
                    <DrawerRow label="Сумма от" value={`${p.min_amount_rsd.toLocaleString('ru-RU')} RSD`} />
                  )}
                  {p.max_amount_rsd != null && (
                    <DrawerRow label="Сумма до" value={`${p.max_amount_rsd.toLocaleString('ru-RU')} RSD`} />
                  )}
                  {p.min_amount_eur != null && (
                    <DrawerRow label="Сумма от" value={`€${p.min_amount_eur.toLocaleString('ru-RU')}`} />
                  )}
                  {p.max_amount_eur != null && (
                    <DrawerRow label="Сумма до" value={`€${p.max_amount_eur.toLocaleString('ru-RU')}`} />
                  )}
                  {p.currency && (
                    <DrawerRow label="Валюта" value={p.currency} />
                  )}
                  {p.income_requirement && (
                    <DrawerRow label="Требование к доходу" value={p.income_requirement} valueClass="text-amber-700 font-medium" />
                  )}
                </>
              )}
            </DrawerSection>
          )}

          {/* Комиссии */}
          {p && (
            <DrawerSection title="Комиссии">
              <DrawerRow
                label="За выдачу"
                value={p.processing_fee_pct === 0 ? 'Бесплатно' : p.processing_fee_pct != null ? `${p.processing_fee_pct}%` : 'Нет данных'}
                valueClass={p.processing_fee_pct === 0 ? 'text-emerald-700 font-medium' : 'text-slate-900 font-medium'}
              />
              <DrawerRow
                label="Досрочное погашение"
                value={p.early_repayment_fee_pct === 0 ? 'Бесплатно' : p.early_repayment_fee_pct != null ? `${p.early_repayment_fee_pct}%` : 'Нет данных'}
                valueClass={p.early_repayment_fee_pct === 0 ? 'text-emerald-700 font-medium' : 'text-slate-900 font-medium'}
              />
            </DrawerSection>
          )}

          {/* Вероятность открытия */}
          {item && (
            <DrawerSection title="Вероятность одобрения">
              <div className="py-3">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold mb-3 ${probBadgeClass(item.probability, item.is_available)}`}>
                  {probLabel(item.probability, item.is_available)}
                </span>
                {item.kyc_requirements.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Документы</p>
                    <ul className="space-y-1.5">
                      {item.kyc_requirements.map((doc, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-600">
                          <span className="text-slate-300 shrink-0">—</span>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </DrawerSection>
          )}

          {/* Красные флаги */}
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

          {/* Примечания */}
          {p?.notes && (
            <DrawerSection title="Примечания">
              <p className="text-xs text-slate-500 leading-relaxed py-3">{p.notes}</p>
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
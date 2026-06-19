// src/components/Invest/FundDrawer.tsx
"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import type { TransformedFundItem, Probability } from "@/types/fund";

interface FundDrawerProps {
  item: TransformedFundItem | null;
  onClose: () => void;
}

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

function riskLabel(level: number | null): string {
  if (level == null) return "Не указан";
  if (level <= 2) return `${level} / 7 — Низкий риск`;
  if (level <= 4) return `${level} / 7 — Умеренный риск`;
  return `${level} / 7 — Высокий риск`;
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

function DrawerRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="text-sm text-slate-500 shrink-0 max-w-[150px] leading-snug">{label}</span>
      <span className={`text-sm font-medium text-right leading-snug ${valueClass ?? "text-slate-900"}`}>
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

export function FundDrawer({ item, onClose }: FundDrawerProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (item) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, handleKeyDown]);

  const isOpen = item !== null;
  const p = item?.product;
  const isBlocked = item ? (!item.is_available || item.probability === "blocked") : false;
  const logoInitials = p?.company.name.slice(0, 2).toUpperCase() ?? "";

  // Доходность по годам — собираем массив для рендера
  const yearReturns = p ? ([
    ["2021", p.returns.return_2021_pct],
    ["2022", p.returns.return_2022_pct],
    ["2023", p.returns.return_2023_pct],
    ["2024", p.returns.return_2024_pct],
    ["2025", p.returns.return_2025_pct],
  ] as [string, number | null | undefined][]).filter(([, v]) => v != null) : [];

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
        aria-label={`Детали: ${p?.name ?? ""}`}
        className={`fixed top-0 right-0 bottom-0 w-[380px] bg-white z-50 flex flex-col
          border-l border-slate-200 shadow-xl transition-transform duration-250 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Шапка */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold text-white shrink-0"
            style={{ backgroundColor: p?.company.logo_color ?? "#1e293b" }}
          >
            {logoInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{p?.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{p?.company.name}</p>
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

          {p && (
            <DrawerSection title="О фонде">
              <DrawerRow label="Тип" value={fundTypeLabel(p.fund_type)} />
              <DrawerRow label="Уровень риска (SRRI)" value={riskLabel(p.risk_level)} />
              <DrawerRow label="Валюта" value={p.currency} />
              <DrawerRow
                label="Политика дохода"
                value={p.dividend_policy === "accumulating" ? "Накопительная (реинвест)" : "Распределительная"}
              />
              {p.recommended_horizon_months != null && (
                <DrawerRow
                  label="Рекомендуемый горизонт"
                  value={p.recommended_horizon_months >= 12
                    ? `${Math.round(p.recommended_horizon_months / 12)} лет`
                    : `${p.recommended_horizon_months} мес`}
                />
              )}
              {p.inception_date && (
                <DrawerRow label="Дата основания" value={p.inception_date} />
              )}
              {p.investment_focus && (
                <div className="py-3">
                  <p className="text-xs text-slate-500 leading-relaxed">{p.investment_focus}</p>
                </div>
              )}
            </DrawerSection>
          )}

          {p && (p.aum_eur_approx != null || p.nav_per_unit_eur != null) && (
            <DrawerSection title="Размер и стоимость">
              {p.aum_eur_approx != null && (
                <DrawerRow
                  label="Активы фонда (AUM)"
                  value={`€${Math.round(p.aum_eur_approx).toLocaleString("ru-RU")}`}
                />
              )}
              {p.nav_per_unit_eur != null && (
                <DrawerRow label="Цена пая (EUR)" value={`€${p.nav_per_unit_eur}`} />
              )}
              {p.nav_per_unit_rsd != null && (
                <DrawerRow label="Цена пая (RSD)" value={`${p.nav_per_unit_rsd.toLocaleString("ru-RU")} RSD`} />
              )}
              {p.aum_date && (
                <DrawerRow label="Дата оценки" value={p.aum_date} valueClass="text-slate-400 font-normal" />
              )}
            </DrawerSection>
          )}

          {p && (
            <DrawerSection title="Комиссии">
              <DrawerRow
                label="Управление"
                value={p.fees.management_fee_pct != null ? `${p.fees.management_fee_pct}% / год` : "Нет данных"}
              />
              <DrawerRow
                label="За вход"
                value={p.fees.entry_fee_pct === 0 ? "Бесплатно" : p.fees.entry_fee_pct != null ? `${p.fees.entry_fee_pct}%` : "Нет данных"}
                valueClass={p.fees.entry_fee_pct === 0 ? "text-emerald-700 font-medium" : undefined}
              />
              <DrawerRow
                label="За выход"
                value={p.fees.exit_fee_pct === 0 ? "Бесплатно" : p.fees.exit_fee_pct != null ? `${p.fees.exit_fee_pct}%` : "Нет данных"}
                valueClass={p.fees.exit_fee_pct === 0 ? "text-emerald-700 font-medium" : undefined}
              />
              {p.fees.ter_approx_pct != null && (
                <DrawerRow label="TER (общие расходы)" value={`≈${p.fees.ter_approx_pct}%`} valueClass="font-semibold" />
              )}
              {p.fees.notes && (
                <div className="py-3">
                  <p className="text-xs text-slate-500 leading-relaxed">{p.fees.notes}</p>
                </div>
              )}
            </DrawerSection>
          )}

          {p && yearReturns.length > 0 && (
            <DrawerSection title="Доходность по годам">
              {yearReturns.map(([year, value]) => (
                <DrawerRow
                  key={year}
                  label={year}
                  value={`${(value as number) >= 0 ? "+" : ""}${value}%`}
                  valueClass={(value as number) >= 0 ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold"}
                />
              ))}
              {p.returns.return_since_inception_annualized_pct != null && (
                <DrawerRow
                  label="С основания (годовых)"
                  value={`${p.returns.return_since_inception_annualized_pct}%`}
                  valueClass="font-semibold"
                />
              )}
              <p className="text-[10px] text-slate-400 py-2 leading-relaxed">
                Исторические данные не являются гарантией будущих результатов.
              </p>
            </DrawerSection>
          )}

          {item && (
            <DrawerSection title="Доступность для вашего статуса">
              <div className="py-3">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold mb-2 ${probBadgeClass(item.probability, item.is_available)}`}>
                  {probLabel(item.probability, item.is_available)}
                </span>
                {item.availability_notes && (
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">{item.availability_notes}</p>
                )}
              </div>
            </DrawerSection>
          )}

          {p?.company.access_methods && (
            <DrawerSection title="Как купить">
              <DrawerRow
                label="Онлайн"
                value={p.company.access_methods.online ? "Доступно" : "Нет"}
                valueClass={p.company.access_methods.online ? "text-emerald-700 font-medium" : "text-slate-400"}
              />
              <DrawerRow
                label="В отделении"
                value={p.company.access_methods.offline_branch ? "Доступно" : "Нет"}
                valueClass={p.company.access_methods.offline_branch ? "text-emerald-700 font-medium" : "text-slate-400"}
              />
              {p.company.access_methods.notes && (
                <div className="py-3">
                  <p className="text-xs text-slate-500 leading-relaxed">{p.company.access_methods.notes}</p>
                </div>
              )}
            </DrawerSection>
          )}

          {p?.company.risks && p.company.risks.length > 0 && (
            <DrawerSection title="Риски">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 my-3">
                <ul className="space-y-1.5">
                  {p.company.risks.map((risk, i) => (
                    <li key={i} className="flex gap-2 text-xs text-red-700 leading-relaxed">
                      <span className="shrink-0 font-semibold">!</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </DrawerSection>
          )}

          {p?.notes && (
            <DrawerSection title="Примечания">
              <p className="text-xs text-slate-500 leading-relaxed py-3">{p.notes}</p>
            </DrawerSection>
          )}

        </div>

        {/* Футер */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100">
          <Link
            href={`/funds/product/${p?.fund_product_id ?? ""}`}
            className="block w-full text-center text-sm font-semibold py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Подробная страница фонда →
          </Link>
        </div>
      </aside>
    </>
  );
}
// src/components/Accounts/BankMatrix.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useResidency } from "@/components/ResidencyProvider";
import type { TransformedMatrixItem, Probability } from "@/types/bank";

interface BankMatrixProps {
  initialItems: TransformedMatrixItem[];
}

function translateProbability(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === 'blocked') return "Отказ (Не открывают)";
  if (probability === 'high') return "Высокая вероятность";
  if (probability === 'medium') return "50/50 (Сербский рандом)";
  if (probability === 'low') return "Сложно (Нужен помогатор)";
  return "Уточняйте в банке";
}

function getBadgeStyles(probability: Probability, isAvailable: boolean): string {
  if (!isAvailable || probability === 'blocked') return "bg-red-50 text-red-700 border-red-200";
  if (probability === 'high') return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (probability === 'medium') return "bg-amber-50 text-amber-700 border-amber-200";
  if (probability === 'low') return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function BankMatrix({ initialItems }: BankMatrixProps) {
  const { legalType } = useResidency(); 

  // Сортировка и группировка по банку на основе строго типизированного массива
  const groupedByBank = useMemo(() => {
    return initialItems.reduce((acc, item) => {
      const bankName = item.products.banks.name;
      if (!acc[bankName]) {
        acc[bankName] = [];
      }
      acc[bankName].push(item);
      return acc;
    }, {} as Record<string, TransformedMatrixItem[]>);
  }, [initialItems]);

  if (initialItems.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-bold text-slate-800">Нет доступных предложений</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Для выбранных критериев продукты в базе данных не найдены. Измените фильтр резидентства.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 font-sans">
      {Object.entries(groupedByBank).map(([bankName, items]) => (
        <section key={bankName} className="border border-slate-100 rounded-2xl p-6 bg-white shadow-xs">
          
          {/* Шапка Банка */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                {bankName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{bankName}</h2>
                <span className="text-xs font-medium text-slate-400">
                  Официальный сайт: {items[0]?.products.banks.official_site || "NBS регистр"}
                </span>
              </div>
            </div>
            
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'продукт' : 'продукта'}
            </span>
          </div>

          {/* Карточки доступных продуктов внутри банка */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const product = item.products;
              const isBlocked = !item.is_available || item.probability === 'blocked';

              return (
                <div 
                  key={item.id} 
                  className={`flex flex-col border rounded-xl overflow-hidden transition-all duration-200 bg-white ${
                    isBlocked ? 'border-red-100 bg-red-50/20 opacity-75' : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Контент тарифа */}
                  <div className="p-5 flex-grow space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{product.name}</h3>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">
                          {product.category === 'business_account' ? 'Для бизнеса / ИП' : 'Личный счет'}
                        </p>
                      </div>
                    </div>

                    {/* Статус KYC бейджа */}
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${getBadgeStyles(item.probability, item.is_available)}`}>
                        {translateProbability(item.probability, item.is_available)}
                      </span>
                    </div>

                    {/* Краткие метрики */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ведение счета:</span>
                        <span className="font-bold text-slate-800">
                          {product.maintenance_fee_rsd === 0 
                            ? "Бесплатно" 
                            : product.maintenance_fee_rsd 
                              ? `${product.maintenance_fee_rsd} RSD` 
                              : "Нет данных"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Входящий SWIFT:</span>
                        <span className="font-bold text-slate-800">
                          {product.swift_in?.pct !== undefined ? `${product.swift_in.pct}%` : "Нет данных"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ссылка на динамический роут продукта */}
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                    <Link 
                      href={`/accounts/product/${product.product_id}`}
                      className={`flex w-full justify-center items-center py-2 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                        isBlocked 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isBlocked ? 'Смотреть причины ограничений' : 'Детальные тарифы и документы'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </section>
      ))}
    </div>
  );
}
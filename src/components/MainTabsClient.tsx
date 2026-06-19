// src/components/MainTabsClient.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BankMatrix } from "@/components/Accounts/BankMatrix";
import { InvestTab } from "@/components/Invest/InvestTab";
import { SavingsTab } from "@/components/Savings/SavingsTab";
import { TaxOptimizer } from "@/components/Taxes/TaxOptimizer";
import { VerifiedExperts } from "@/components/Services/VerifiedExperts";
import { CalculatorsTab } from "@/components/Calculators/CalculatorsTab";
import { StatusBanner } from "@/components/StatusBanner";
import { CreditTab } from "@/components/Credits/CreditTab";
import type { TransformedMatrixItem, ResidencyStatus, BankProduct } from "@/types/bank";
import type { TaxRuleWithCategory, ServiceProvider } from "@/types/database";
import type { BrokerJSON } from "@/types/broker";
import type { TransformedFundItem } from "@/types/fund";

type TabId = BankProduct['category'] | 'accounts' | 'taxes' | 'services' | 'calculators';

// ─────────────────────────────────────────
// Конфиг табов
// ─────────────────────────────────────────
const TABS: { id: TabId; label: string }[] = [
  { id: 'accounts',         label: 'Счета и карты'     },
  { id: 'savings_deposit',  label: 'Сбережения'        },
  { id: 'investment_bonds', label: 'Инвестиции'        },
  { id: 'credit_mortgage',  label: 'Кредиты / Ипотека' },
  { id: 'transfer',         label: 'Переводы'          },
  { id: 'business_account', label: 'РКО для бизнеса'  },
  { id: 'taxes',            label: 'Налоги'            },
  { id: 'calculators',      label: 'Калькуляторы'      },
  { id: 'services',         label: 'Услуги'            },
];

interface MainTabsClientProps {
  allItems: TransformedMatrixItem[];
  businessItems: TransformedMatrixItem[];
  currentStatus: ResidencyStatus;
  taxRules: TaxRuleWithCategory[];
  serviceProviders: ServiceProvider[];
  brokers: BrokerJSON[];
  fundItems: TransformedFundItem[];
}

export function MainTabsClient({
  allItems,
  businessItems,
  currentStatus,
  taxRules,
  serviceProviders,
  brokers,
  fundItems,
}: MainTabsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get('tab') as TabId) || 'accounts';

  function setActiveTab(tab: TabId) {
    router.push(`/?tab=${tab}`, { scroll: false });
  }

  const visibleItems = allItems.filter(item => {
    const cat = item.products.category;
    if (activeTab === 'accounts') return cat === 'personal_account';
    return cat === activeTab;
  });

  const creditItems = allItems.filter(item =>
    item.products.category === 'credit_mortgage' || item.products.category === 'credit_consumer'
  );

  const visibleBusinessItems = businessItems.filter(
    item => item.products.category === 'business_account'
  );

  return (
    <div>
      {/* StatusBanner — заменяет старую плашку */}
      <StatusBanner status={currentStatus} />

      {/* Таб-навигация */}
      <div className="flex gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors font-medium ${
              activeTab === tab.id
                ? "border-emerald-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент таба */}
      {activeTab === 'taxes' ? (
        <TaxOptimizer initialRules={taxRules} />
      ) : activeTab === 'calculators' ? (
        <CalculatorsTab />
      ) : activeTab === 'services' ? (
        <VerifiedExperts providers={serviceProviders} />
      ) : activeTab === 'investment_bonds' ? (
        <InvestTab
          bondItems={allItems.filter(i => i.products.category === 'investment_bonds')}
          brokers={brokers}
          fundItems={fundItems}
          currentStatus={currentStatus}
        />
      ) : activeTab === 'credit_mortgage' ? (
        <CreditTab items={allItems} />
      ) : activeTab === 'savings_deposit' ? (
        <SavingsTab items={allItems} />
      ) : activeTab === 'business_account' ? (
        visibleBusinessItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">Нет данных для выбранного статуса</p>
          </div>
        ) : (
          <BankMatrix initialItems={visibleBusinessItems} />
        )
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-400 text-sm">Нет данных для выбранного статуса</p>
        </div>
      ) : activeTab === 'accounts' ? (
        <BankMatrix initialItems={visibleItems} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleItems.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Карточка продукта
// ─────────────────────────────────────────
function ProductCard({ item }: { item: TransformedMatrixItem }) {
  const product = item.products;
  const isBlocked = !item.is_available || item.probability === 'blocked';

  return (
    <div className={`bg-white border rounded-xl overflow-hidden flex flex-col transition-all ${
      isBlocked
        ? 'border-red-100 opacity-75'
        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
    }`}>
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {product.banks.name}
            </p>
            <h3 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
              {product.name}
            </h3>
          </div>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
            isBlocked
              ? 'bg-red-50 text-red-700'
              : item.probability === 'high'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
          }`}>
            {isBlocked ? 'Недоступен' : item.probability === 'high' ? 'Доступен' : '50/50'}
          </span>
        </div>
      </div>

      <div className="px-5 py-4 flex-1 space-y-2 text-sm">
        <ProductFields product={product} />
      </div>

      <div className="px-5 pb-5">
        <Link
          href={`/accounts/product/${product.product_id}`}
          className={`block w-full text-center text-xs font-bold py-2.5 rounded-lg transition-colors ${
            isBlocked
              ? 'bg-red-50 text-red-800 hover:bg-red-100'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isBlocked ? 'Смотреть причины ограничений' : 'Подробнее'}
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Поля карточки — narrowing по category
// ─────────────────────────────────────────
type ProductWithBank = TransformedMatrixItem['products'];

function ProductFields({ product }: { product: ProductWithBank }) {
  switch (product.category) {
    case 'savings_deposit':
      return (
        <>
          {product.terms?.slice(0, 3).map((t) => (
            <div key={t.term_months} className="flex justify-between">
              <span className="text-slate-500">{t.term_months} мес</span>
              <span className="font-bold text-emerald-700">{t.rate_pct}% год.</span>
            </div>
          ))}
          <div className="flex justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500">Налог на %</span>
            <span className={`font-bold ${product.tax_on_interest_pct === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {product.tax_on_interest_pct === 0 ? '0% — Tax Free' : `${product.tax_on_interest_pct}%`}
            </span>
          </div>
        </>
      );

    case 'investment_bonds':
      return (
        <>
          {product.yield_eur_approx_pct != null && (
            <div className="flex justify-between">
              <span className="text-slate-500">Доходность EUR</span>
              <span className="font-bold text-emerald-700">~{product.yield_eur_approx_pct}%</span>
            </div>
          )}
          {product.yield_rsd_approx_pct != null && (
            <div className="flex justify-between">
              <span className="text-slate-500">Доходность RSD</span>
              <span className="font-bold text-emerald-700">~{product.yield_rsd_approx_pct}%</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Налог на купон</span>
            <span className="font-bold text-emerald-600">0% — Tax Free</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500">Комиссия за вход</span>
            <span className={`font-bold ${(product.entry_fee_pct ?? 0) > 1 ? 'text-amber-600' : 'text-slate-700'}`}>
              {product.entry_fee_pct ?? '—'}%
            </span>
          </div>
        </>
      );

    case 'credit_mortgage':
      return (
        <>
          <div className="flex justify-between">
            <span className="text-slate-500">Ставка от</span>
            <span className="font-bold text-slate-900">~{product.rate_approx_total_pct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Взнос от</span>
            <span className="font-bold text-slate-900">{product.min_down_payment_pct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Макс. LTV</span>
            <span className="font-bold text-slate-900">{product.max_ltv_pct}%</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500">Сумма до</span>
            <span className="font-bold text-slate-900">
              €{(product.max_amount_eur ?? 0).toLocaleString('ru-RU')}
            </span>
          </div>
        </>
      );

    case 'credit_consumer':
      return (
        <>
          <div className="flex justify-between">
            <span className="text-slate-500">Ставка от</span>
            <span className="font-bold text-slate-900">~{product.rate_approx_pct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Сумма до</span>
            <span className="font-bold text-slate-900">
              €{(product.max_amount_eur ?? 0).toLocaleString('ru-RU')}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500">Срок до</span>
            <span className="font-bold text-slate-900">
              {product.loan_term_months ? Math.max(...product.loan_term_months) : '—'} мес
            </span>
          </div>
        </>
      );

    case 'transfer':
      return (
        <>
          <div className="flex justify-between">
            <span className="text-slate-500">Входящий SWIFT</span>
            <span className="font-bold text-slate-900">
              {product.fee_incoming_pct === 0 ? 'Бесплатно' : `${product.fee_incoming_pct}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Исходящий SWIFT</span>
            <span className="font-bold text-slate-900">{product.fee_outgoing_pct}%</span>
          </div>
          {product.outgoing_resident_restriction != null && (
            <div className="pt-1 border-t border-slate-100">
              <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1 leading-relaxed">
                ⚠️ {product.outgoing_resident_restriction}
              </p>
            </div>
          )}
        </>
      );

    default:
      return null;
  }
}
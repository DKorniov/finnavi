// src/components/Invest/InvestTab.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FundsTab } from "@/components/Invest/FundsTab";
import type { TransformedMatrixItem, ResidencyStatus } from "@/types/bank";
import type { BrokerJSON } from "@/types/broker";
import type { TransformedFundItem } from "@/types/fund";

// ─────────────────────────────────────────
// Подвкладки раздела Инвестиции
// ─────────────────────────────────────────
type InvestSubTab = 'bonds' | 'brokers' | 'etf' | 'funds';

const INVEST_TABS: { id: InvestSubTab; label: string }[] = [
  { id: 'brokers', label: '📈 Брокеры'      },
  { id: 'funds',   label: '🏦 Инвестфонды'  },
];

interface InvestTabProps {
  bondItems: TransformedMatrixItem[];
  brokers: BrokerJSON[];
  fundItems: TransformedFundItem[];
  currentStatus: ResidencyStatus;
}

export function InvestTab({ bondItems, brokers = [], fundItems = [], currentStatus }: InvestTabProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeSubTab = (searchParams.get('invest') as InvestSubTab) || 'brokers';

  function setSubTab(sub: InvestSubTab) {
    router.push(`/?tab=investment_bonds&invest=${sub}`, { scroll: false });
  }

  return (
    <div>
      {/* Подвкладки */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {INVEST_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSubTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент подвкладки */}
      {activeSubTab === 'bonds'   && <BondsContent items={bondItems} />}
      {activeSubTab === 'brokers' && <BrokersContent brokers={brokers} currentStatus={currentStatus} />}
      {activeSubTab === 'etf'     && <EtfContent />}
      {activeSubTab === 'funds'   && <FundsTab items={fundItems} />}
    </div>
  );
}

// ─────────────────────────────────────────
// Гособлигации
// ─────────────────────────────────────────
function BondsContent({ items }: { items: TransformedMatrixItem[] }) {
  return (
    <div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 text-sm text-emerald-800">
        <span className="font-bold block mb-1">Гособлигации Сербии — Tax Free</span>
        Купоны и прирост капитала по государственным облигациям Сербии освобождены от налога (0%) для физических лиц. Покупка только офлайн через банк-агент (OTP, Raiffeisen, Intesa и др.).
        Актуальные аукционы Минфина:{" "}
        <a
          href="https://www.mfin.gov.rs"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold"
        >
          mfin.gov.rs
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(item => (
          <BondCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Брокеры
// ─────────────────────────────────────────
function BrokersContent({ brokers, currentStatus }: { brokers: BrokerJSON[]; currentStatus: ResidencyStatus }) {
  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-sm text-slate-700">
        <span className="font-bold block mb-1">Международные брокеры из Сербии</span>
        Доступность и маршруты пополнения для держателей РФ/РБ паспортов. Данные основаны на отзывах экспат-комьюнити.
      </div>
      {brokers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-400 text-sm">
            Нет данных о брокерах. Убедитесь что файлы размещены в{" "}
            <code className="bg-slate-100 px-1 rounded">data/brokers/</code>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {brokers.map(broker => (
            <BrokerCard key={broker.broker_id} broker={broker} currentStatus={currentStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// ETF-фонды
// ─────────────────────────────────────────
const ETF_INFO = [
  {
    id: 'vwce',
    name: 'VWCE',
    full_name: 'Vanguard FTSE All-World UCITS ETF',
    description: 'Глобальный индексный фонд — акции 3700+ компаний из 47 стран. Самый популярный выбор для долгосрочного инвестора.',
    ter_pct: 0.22,
    available_via: ['Interactive Brokers', 'Trading 212'],
    tax_serbia_pct: 15,
  },
  {
    id: 'cspx',
    name: 'CSPX',
    full_name: 'iShares Core S&P 500 UCITS ETF',
    description: 'Топ-500 компаний США. Исторически один из лучших инструментов по соотношению доходность/риск.',
    ter_pct: 0.07,
    available_via: ['Interactive Brokers', 'Trading 212', 'XTB'],
    tax_serbia_pct: 15,
  },
  {
    id: 'aggh',
    name: 'AGGH',
    full_name: 'iShares Core Global Aggregate Bond UCITS ETF',
    description: 'Глобальный облигационный ETF. Альтернатива прямой покупке облигаций — диверсификация без офлайн-визита в банк.',
    ter_pct: 0.10,
    available_via: ['Interactive Brokers', 'Trading 212'],
    tax_serbia_pct: 15,
  },
];

function EtfContent() {
  return (
    <div>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 text-sm text-amber-800">
        <span className="font-bold block mb-1">ETF как альтернатива ПИФам</span>
        В Сербии нет развитого рынка паевых фондов. ETF через международного брокера — ближайший аналог с низкими комиссиями и глобальной диверсификацией. Налог 15% на прирост капитала и дивиденды.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ETF_INFO.map(etf => (
          <div key={etf.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-black text-xl text-slate-900">{etf.name}</span>
                <span className="text-[11px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                  TER {etf.ter_pct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{etf.full_name}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{etf.description}</p>
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Налог в Сербии</span>
                <span className="font-bold text-slate-700">{etf.tax_serbia_pct}% CGT</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500">Доступен через</span>
                <span className="font-medium text-slate-700 text-right">{etf.available_via.join(', ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Карточка гособлигации
// ─────────────────────────────────────────
function BondCard({ item }: { item: TransformedMatrixItem }) {
  const p = item.products;
  const isBlocked = !item.is_available || item.probability === 'blocked';

  return (
    <div className={`bg-white border rounded-xl p-5 flex flex-col gap-3 ${
      isBlocked ? 'border-red-100 opacity-75' : 'border-slate-200'
    }`}>
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{p.banks.name}</p>
        <h3 className="font-bold text-slate-900 mt-0.5">{p.name}</h3>
      </div>
      <div className="space-y-1.5 text-xs">
        {p.yield_eur_approx_pct != null && (
          <div className="flex justify-between">
            <span className="text-slate-500">Доходность EUR</span>
            <span className="font-bold text-emerald-700">~{p.yield_eur_approx_pct}%</span>
          </div>
        )}
        {p.yield_rsd_approx_pct != null && (
          <div className="flex justify-between">
            <span className="text-slate-500">Доходность RSD</span>
            <span className="font-bold text-emerald-700">~{p.yield_rsd_approx_pct}%</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Налог на купон</span>
          <span className="font-bold text-emerald-600">0% — Tax Free</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-100">
          <span className="text-slate-500">Комиссия за вход</span>
          <span className={`font-bold ${(p.entry_fee_pct ?? 0) > 1 ? 'text-amber-600' : 'text-slate-700'}`}>
            {p.entry_fee_pct ?? '—'}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Карточка брокера
// ─────────────────────────────────────────
function BrokerCard({ broker, currentStatus }: { broker: BrokerJSON; currentStatus: ResidencyStatus }) {
  const availability = broker.availability.find(a => a.status === currentStatus);
  const isAvailable = availability?.is_available ?? true;
  const probability = availability?.probability ?? 'medium';

  const bestRoute = broker.funding_routes.find(r => r.success_rate === 'high')
    ?? broker.funding_routes[0];

  return (
    <div className={`bg-white border rounded-xl overflow-hidden flex flex-col ${
      isAvailable ? 'border-slate-200 hover:border-slate-300 hover:shadow-sm' : 'border-red-100 opacity-75'
    } transition-all`}>

      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
              style={{ backgroundColor: broker.logo_color }}
            >
              {broker.brand_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{broker.brand_name}</h3>
              <p className="text-[10px] text-slate-400">Международный брокер</p>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
            !isAvailable
              ? 'bg-red-50 text-red-700'
              : probability === 'high'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
          }`}>
            {!isAvailable ? 'Недоступен' : probability === 'high' ? 'Стабилен' : '⚠ Нестабилен'}
          </span>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex flex-wrap gap-1.5">
          {broker.instruments.stocks      && <Tag label="Акции" />}
          {broker.instruments.etf         && <Tag label="ETF" />}
          {broker.instruments.bonds_world && <Tag label="Облигации мира" />}
          {broker.instruments.options     && <Tag label="Опционы" />}
          {broker.instruments.crypto      && <Tag label="Крипто" />}
        </div>
      </div>

      {bestRoute && (
        <div className="px-5 py-3 border-b border-slate-100 text-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Лучший маршрут пополнения
          </p>
          <div className="flex justify-between items-center">
            <span className="text-slate-700 font-medium">{bestRoute.bank_name}</span>
            <span className="font-bold text-slate-900">{bestRoute.fee_pct}%</span>
          </div>
          <p className="text-slate-400 mt-1 leading-relaxed">{bestRoute.notes}</p>
        </div>
      )}

      <div className="px-5 py-3 flex-1 text-xs space-y-1">
        {broker.pros.slice(0, 2).map((pro, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
            <span className="text-slate-600">{pro}</span>
          </div>
        ))}
        {broker.risks.length > 0 && (
          <div className="flex items-start gap-1.5 mt-1">
            <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
            <span className="text-slate-500">{broker.risks[0]}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 pt-2">
        <a
          href={broker.website}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-xs font-bold py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Открыть счёт →
        </a>
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
      {label}
    </span>
  );
}
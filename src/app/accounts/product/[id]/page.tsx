// src/app/accounts/product/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { getProductWithBankData } from "@/lib/data/banks";
import { ProductTabsClient } from "@/components/Accounts/ProductTabsClient";
import type { ResidencyStatus, LegalType, KYCRule, BankProduct } from "@/types/bank";

export const dynamic = 'force-dynamic';

// ─── Расширенные типы — поля из обновлённого bank.ts ────────────────────────
type ExtBankProduct = BankProduct & {
  package_tier?: string | null;
  maintenance_fee_condition?: string | null;
  sepa_in?: { pct: number | null; min_rsd: number | null; notes?: string | null };
  sepa_out?: { pct: number | null; min_rsd: number | null; max_rsd?: number | null; notes?: string | null };
  card_issue_days?: string | null;
  cashback?: string | null;
  bonuses?: string | null;
  atm_withdrawal_own_bank?: string | null;
  // ипотека
  rate_margin_pct?: number | null;
  rate_base?: string | null;
  rate_fixed_period_years?: number | null;
  processing_fee_pct?: number | null;
  early_repayment_fee_pct?: number | null;
  insurance_required?: string[];
  // потреб
  purpose?: string | null;
  min_amount_rsd?: number | null;
  max_amount_rsd?: number | null;
};

type ExtKycRule = KYCRule & { blocked_reasons?: string[] };
type ExtBankJSON = {
  bank_id: string;
  brand_name: string;
  website: string;
  logo_color?: string;
  kyc_matrix: ExtKycRule[];
  products: ExtBankProduct[];
  last_updated: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtStatus(status: ResidencyStatus): string {
  const m: Record<ResidencyStatus, string> = {
    non_resident: 'Нерезидент',
    resident_less_1y: 'ВНЖ до 1 года',
    resident_more_1y: 'Резидент 1г+',
    permanent_resident: 'ПМЖ',
    citizen: 'Гражданин',
  };
  return m[status];
}

function categoryLabel(cat: BankProduct['category']): string {
  const m: Record<BankProduct['category'], string> = {
    personal_account: 'Личный счёт',
    business_account: 'РКО / Бизнес',
    savings_deposit: 'Срочный вклад',
    investment_bonds: 'Гособлигации',
    credit_mortgage: 'Ипотека',
    credit_consumer: 'Потребкредит',
    transfer: 'Переводы',
  };
  return m[cat];
}

function probLabel(prob: string, avail: boolean): string {
  if (!avail || prob === 'blocked') return 'Не открывают';
  if (prob === 'high') return 'Высокая вероятность';
  if (prob === 'medium') return 'Сербский рандом';
  return 'Сложно открыть';
}

function probBadgeClass(prob: string, avail: boolean): string {
  if (!avail || prob === 'blocked') return 'bg-red-50 text-red-700 border-red-200';
  if (prob === 'high') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (prob === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-orange-50 text-orange-700 border-orange-200';
}

function fmtFee(pct: number | null | undefined, min?: number | null): string {
  if (pct === null || pct === undefined) return '—';
  if (pct === 0) return 'Бесплатно';
  return min ? `${pct}% (мин ${min.toLocaleString('ru-RU')} RSD)` : `${pct}%`;
}

// ─── Компоненты шапки по категориям ─────────────────────────────────────────

// Метрика-анкор в шапке
function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3">
      <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
      <p className={`text-base font-medium ${valueClass ?? 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

// Тег-строка под метриками
function TagRow({ p }: { p: ExtBankProduct }) {
  const tags: { label: string; color: string }[] = [];
  (p.cards?.international ?? []).forEach(c => tags.push({ label: c, color: 'bg-blue-50 text-blue-800 border-blue-200' }));
  if ((p.cards?.international ?? []).length > 0) tags.push({ label: 'DinaCard', color: 'bg-blue-50 text-blue-800 border-blue-200' });
  if (p.is_multicurrency) tags.push({ label: 'Мультивалютный', color: 'bg-slate-100 text-slate-600 border-slate-200' });
  if (p.features?.apple_pay) tags.push({ label: 'Apple Pay', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' });
  if (p.features?.google_pay) tags.push({ label: 'Google Pay', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' });
  if (p.features?.garmin_pay) tags.push({ label: 'Garmin Pay', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' });
  if (p.features?.prenesi) tags.push({ label: 'Prenesi', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' });
  if (p.features?.ips_qr) tags.push({ label: 'IPS QR', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' });
  if (p.swift_in?.pct === 0) tags.push({ label: 'SWIFT in 0%', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' });
  if ((p as ExtBankProduct & { sepa_in?: { pct: number | null } }).sepa_in?.pct === 0) {
    tags.push({ label: 'SEPA in 0%', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' });
  }
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
      {tags.map((t, i) => (
        <span key={i} className={`text-[11px] px-2 py-0.5 rounded border ${t.color}`}>{t.label}</span>
      ))}
    </div>
  );
}

// Метрики для личного/бизнес счёта
function AccountMetrics({ p }: { p: ExtBankProduct }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      <Metric
        label="Обслуживание"
        value={p.maintenance_fee_rsd === 0 ? 'Бесплатно' : p.maintenance_fee_rsd ? `${p.maintenance_fee_rsd} RSD/мес` : '—'}
        valueClass={p.maintenance_fee_rsd === 0 ? 'text-emerald-700' : 'text-slate-900'}
      />
      <Metric
        label="SWIFT входящий"
        value={fmtFee(p.swift_in?.pct, p.swift_in?.min_rsd)}
        valueClass={p.swift_in?.pct === 0 ? 'text-emerald-700' : (p.swift_in?.pct ?? 0) >= 0.8 ? 'text-amber-700' : 'text-slate-900'}
      />
      <Metric
        label="SEPA входящий"
        value={fmtFee((p as ExtBankProduct & { sepa_in?: { pct: number | null; min_rsd: number | null } }).sepa_in?.pct)}
        valueClass={(p as ExtBankProduct & { sepa_in?: { pct: number | null } }).sepa_in?.pct === 0 ? 'text-emerald-700' : 'text-slate-900'}
      />
      <Metric
        label="Карты"
        value={[...(p.cards?.international ?? []), 'DinaCard'].join(' · ')}
      />
    </div>
  );
}

// Метрики для вклада
function SavingsMetrics({ p }: { p: ExtBankProduct }) {
  const bestRate = p.terms?.length
    ? Math.max(...p.terms.map(t => t.rate_pct))
    : null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
      <Metric
        label="Макс. ставка"
        value={bestRate !== null ? `${bestRate}% годовых` : 'Уточняется'}
        valueClass="text-emerald-700"
      />
      <Metric
        label="Налог на доход"
        value={p.tax_on_interest_pct === 0 ? '0% — Tax Free' : `${p.tax_on_interest_pct}%`}
        valueClass={p.tax_on_interest_pct === 0 ? 'text-emerald-700' : 'text-slate-900'}
      />
      <Metric
        label="Доступен нерезидентам"
        value={p.is_available_non_resident ? 'Да' : 'Нет'}
        valueClass={p.is_available_non_resident ? 'text-emerald-700' : 'text-red-600'}
      />
    </div>
  );
}

// Метрики для ипотеки
function MortgageMetrics({ p }: { p: ExtBankProduct }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      <Metric label="Ставка от" value={p.rate_approx_total_pct ? `~${p.rate_approx_total_pct}%` : '—'} />
      <Metric label="LTV макс" value={p.max_ltv_pct ? `${p.max_ltv_pct}%` : '—'} />
      <Metric label="Взнос от" value={p.min_down_payment_pct ? `${p.min_down_payment_pct}%` : '—'} />
      <Metric
        label="Досрочное погашение"
        value={(p as ExtBankProduct).early_repayment_fee_pct === 0 ? 'Бесплатно' : '—'}
        valueClass={(p as ExtBankProduct).early_repayment_fee_pct === 0 ? 'text-emerald-700' : 'text-slate-900'}
      />
    </div>
  );
}

// Метрики для потребкредита
function ConsumerMetrics({ p }: { p: ExtBankProduct }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
      <Metric label="Ставка от" value={p.rate_approx_pct ? `~${p.rate_approx_pct}%` : '—'} />
      <Metric label="Срок до" value={p.loan_term_months?.length ? `${Math.max(...p.loan_term_months)} мес` : '—'} />
      <Metric label="Валюта" value={p.currency ?? 'RSD'} />
    </div>
  );
}

// Метрики для облигаций
function BondsMetrics({ p }: { p: ExtBankProduct }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      {p.yield_eur_approx_pct != null && (
        <Metric label="Доходность EUR" value={`~${p.yield_eur_approx_pct}%`} valueClass="text-emerald-700" />
      )}
      {p.yield_rsd_approx_pct != null && (
        <Metric label="Доходность RSD" value={`~${p.yield_rsd_approx_pct}%`} valueClass="text-emerald-700" />
      )}
      <Metric label="Налог на купоны" value="0% — Tax Free" valueClass="text-emerald-700" />
      <Metric label="Комиссия за вход" value={p.entry_fee_pct != null ? `${p.entry_fee_pct}%` : '—'} valueClass={(p.entry_fee_pct ?? 0) > 1 ? 'text-amber-700' : 'text-slate-900'} />
    </div>
  );
}

// Метрики для переводов
function TransferMetrics({ p }: { p: ExtBankProduct }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
      <Metric
        label="SWIFT входящий"
        value={fmtFee(p.fee_incoming_pct, p.fee_incoming_min_rsd)}
        valueClass={p.fee_incoming_pct === 0 ? 'text-emerald-700' : 'text-slate-900'}
      />
      <Metric
        label="SWIFT исходящий"
        value={fmtFee(p.fee_outgoing_pct, p.fee_outgoing_min_rsd)}
        valueClass={(p.fee_outgoing_pct ?? 0) >= 0.5 ? 'text-amber-700' : 'text-slate-900'}
      />
      <Metric label="Направления" value={(p.available_directions ?? []).join(' / ')} />
    </div>
  );
}

// ─── Главный экспорт ─────────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const productId = decodeURIComponent(resolvedParams.id);

  const cookieStore = await cookies();
  const userStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const userLegalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  const data = await getProductWithBankData(productId);
  if (!data) notFound();

  const bank = data.bank as unknown as ExtBankJSON;
  const product = data.product as unknown as ExtBankProduct;

  const kyc = bank.kyc_matrix?.find(
    (rule) => rule.status === userStatus && rule.legal_type === userLegalType
  );

  const isBlocked = kyc ? (!kyc.is_available || kyc.probability === 'blocked') : false;

  const logoColor = bank.logo_color ?? '#1e293b';
  const logoTextColor = logoColor === '#FFCC00' ? '#1e293b' : '#ffffff';

  const isAccount = product.category === 'personal_account' || product.category === 'business_account';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans antialiased">

      {/* Кнопка назад */}
      <BackButton />

      {/* ── Шапка страницы ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-xs">

        {/* Строка 1: логотип + название + бейджи */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ backgroundColor: logoColor, color: logoTextColor }}
            >
              {bank.brand_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-slate-900 leading-snug">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-[11px] px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200">
                  {bank.brand_name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200">
                  {categoryLabel(product.category)}
                </span>
                {product.package_tier && (
                  <span className="text-[11px] px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200">
                    {product.package_tier}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KYC-бейдж — главный элемент, видно без скролла */}
          {kyc && (
            <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border ${probBadgeClass(kyc.probability, kyc.is_available)}`}>
              {probLabel(kyc.probability, kyc.is_available)}
            </span>
          )}
        </div>

        {/* Строка 2: метрики-анкоры по категории */}
        {isAccount && <AccountMetrics p={product} />}
        {product.category === 'savings_deposit' && <SavingsMetrics p={product} />}
        {product.category === 'credit_mortgage' && <MortgageMetrics p={product} />}
        {product.category === 'credit_consumer' && <ConsumerMetrics p={product} />}
        {product.category === 'investment_bonds' && <BondsMetrics p={product} />}
        {product.category === 'transfer' && <TransferMetrics p={product} />}

        {/* Строка 3: теги (только для счетов/карт) */}
        {isAccount && <TagRow p={product} />}
      </div>

      {/* ── Блок причин отказа — если заблокирован ── */}
      {isBlocked && (kyc?.blocked_reasons?.length ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Причины недоступности для вашего профиля
          </h3>
          <ul className="space-y-2">
            {kyc!.blocked_reasons!.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-red-800 leading-relaxed">
                <span className="shrink-0 mt-0.5">→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Основной блок — таб-навигация с контентом ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mb-5">
        {/* Заголовок блока */}
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {product.category === 'savings_deposit' ? 'Параметры вклада'
              : product.category === 'credit_mortgage' ? 'Об ипотеке'
              : product.category === 'credit_consumer' ? 'О кредите'
              : product.category === 'investment_bonds' ? 'Об инструменте'
              : product.category === 'transfer' ? 'О переводах'
              : `О счёте «${product.name}»`}
          </h2>
          {product.notes && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{product.notes}</p>
          )}
        </div>

        {/* Клиентский компонент с табами */}
        <div className="px-5 pt-1 pb-5">
          <ProductTabsClient
            product={product as Parameters<typeof ProductTabsClient>[0]['product']}
            kyc={kyc as Parameters<typeof ProductTabsClient>[0]['kyc']}
            bankName={bank.brand_name}
            website={bank.website}
            lastUpdated={bank.last_updated}
            userStatus={userStatus}
            userLegalType={userLegalType}
          />
        </div>
      </div>

      {/* ── Профиль пользователя ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Условия отображены для:{' '}
          <span className="font-semibold text-slate-800">
            {fmtStatus(userStatus)} · {userLegalType === 'business' ? 'ИП / Юрлицо' : 'Физическое лицо'}
          </span>
        </span>
        <Link href="/" className="text-blue-600 hover:underline">
          Изменить профиль →
        </Link>
      </div>

      {/* ── Футер ── */}
      <div className="flex flex-wrap gap-3">
        <a
          href={bank.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Официальный сайт банка →
        </a>
        <Link
          href="/?tab=accounts"
          className="flex-1 text-center py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          ← Все счета
        </Link>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Данные на основе официальных тарифов банка. Актуально на {bank.last_updated}.
        <span className="block mt-0.5">Уточняйте актуальные условия на сайте банка или в отделении.</span>
      </p>

    </div>
  );
}
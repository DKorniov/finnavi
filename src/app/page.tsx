import { createClient } from '@supabase/supabase-js';
import { ResidencyTabs } from "../components/ResidencyTabs";
import { TaxOptimizer } from "../components/Taxes/TaxOptimizer";
import { BrokerCards } from "../components/Invest/BrokerCards";
import { YieldComparator } from "../components/Calculators/YieldComparator";
import { VerifiedExperts } from "../components/Services/VerifiedExperts"; // <--- КОМПОНЕНТ ФАЗЫ 4
import { 
  AvailabilityItem, 
  TaxRuleWithCategory, 
  BrokerWithRelations, 
  ResidencyStatus,
  DepositRate,
  BondYield,
  CurrencySpread,
  ServiceProvider // <--- ТИП ФАЗЫ 4
} from "../types/database";

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Требование Next.js 15/16: Асинхронное разворачивание параметров URL
  const resolvedParams = await searchParams;
  const status = (resolvedParams?.status || "non_resident") as ResidencyStatus;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Высокопроизводительный пул параллельного фетчинга всей экосистемы хаба
  const [
    availabilityResponse, 
    taxesResponse, 
    brokersResponse,
    depositsResponse,
    bondsResponse,
    spreadsResponse,
    providersResponse // <--- Запрос Фазы 4
  ] = await Promise.all([
    // Фаза 1: Доступность банковских продуктов
    supabase
      .from('product_availability')
      .select(`
        id,
        is_available,
        approval_probability,
        notes,
        products (
          name,
          category,
          banks (
            name,
            official_site
          )
        )
      `)
      .eq('status', status),
    // Фаза 2: Фискальная налоговая матрица
    supabase
      .from("tax_rules")
      .select(`
        id,
        asset_category_id,
        user_legal_status,
        tax_type,
        tax_rate_percent,
        is_tax_free,
        notes,
        asset_categories (
          id,
          code,
          name,
          description
        )
      `)
      .returns<TaxRuleWithCategory[]>(),
    // Фаза 2: Международные брокеры и шлюзы пополнения
    supabase
      .from("brokers")
      .select(`
        id,
        name,
        broker_type,
        has_p2p_risk,
        website_url,
        referral_url,
        broker_availability (
          id,
          broker_id,
          residency_status,
          is_available,
          requirements_notes
        ),
        broker_funding_routes (
          id,
          broker_id,
          bank_name,
          method,
          success_rate,
          user_reports_summary
        )
      `)
      .returns<BrokerWithRelations[]>() ,
    // Фаза 3: Ставки по банковским депозитам
    supabase
      .from("deposit_rates")
      .select("*")
      .returns<DepositRate[]>(),
    // Фаза 3: Кривая доходности гособлигаций Сербии
    supabase
      .from("bond_yields")
      .select("*")
      .returns<BondYield[]>(),
    // Фаза 3: Мониторинг коммерческих валютных спредов
    supabase
      .from("currency_spreads")
      .select("*")
      .returns<CurrencySpread[]>(),
    // Фаза 4: Витрина верифицированных сервис-провайдеров
    supabase
      .from("service_providers")
      .select("*")
      .order("category", { ascending: true })
      .returns<ServiceProvider[]>()
  ]);

  // Защитное логирование инфраструктуры Supabase API без падения рантайма страницы
  if (availabilityResponse.error) console.error("Ошибка кэша банков:", availabilityResponse.error);
  if (taxesResponse.error) console.error("Ошибка матрицы налогов:", taxesResponse.error);
  if (brokersResponse.error) console.error("Ошибка реестра брокеров:", brokersResponse.error);
  if (depositsResponse.error) console.error("Ошибка пула депозитов:", depositsResponse.error);
  if (bondsResponse.error) console.error("Ошибка доходности облигаций:", bondsResponse.error);
  if (spreadsResponse.error) console.error("Ошибка валютных спредов:", spreadsResponse.error);
  if (providersResponse.error) console.error("Ошибка витрины экспертов (Phase 4):", providersResponse.error);

  const availability = (availabilityResponse.data || []) as unknown as AvailabilityItem[];
  const taxRules = taxesResponse.data || [];
  const brokers = brokersResponse.data || [];
  const deposits = depositsResponse.data || [];
  const bonds = bondsResponse.data || [];
  const spreads = spreadsResponse.data || [];
  const providers = providersResponse.data || [];

  // Исходная бизнес-логика группировки Фазы 1 (Разделение карт по 3-м колонкам)
  const groupedData = {
    current_account: availability.filter(item => item.products.category === 'current_account'),
    savings: availability.filter(item => item.products.category === 'savings'),
    business_account: availability.filter(item => item.products.category === 'business_account'),
  };

  const columns = [
    { id: 'current', title: 'Личный счет', items: groupedData.current_account },
    { id: 'savings', title: 'Сбережения', items: groupedData.savings },
    { id: 'business', title: 'Счет ИП', items: groupedData.business_account },
  ];

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
      {/* Главный заголовок финансового маркетплейса */}
      <div className="text-center md:text-left border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          ExpatFinance Navigator
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          Главный финансовый маркетплейс с экспортным фильтром для экспатов в Сербии
        </p>
      </div>

      {/* Глобальный URL-переключатель статуса резидентства */}
      <ResidencyTabs />

      {/* ========================================================== */}
      {/* СЕКЦИЯ 1: МАТРИЦА ДОСТУПНОСТИ БАНКОВ (ФАЗА 1 - СОХРАНЕНО)     */}
      {/* ========================================================== */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Банковские продукты</h2>
          <p className="text-sm text-slate-500 mt-1">Доступность счетов и карт на основе отзывов комьюнити</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 px-2 flex items-center justify-between">
                {col.title}
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-normal">
                  {col.items.length}
                </span>
              </h3>

              {col.items.length > 0 ? (
                col.items.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col min-h-[180px] hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{item.products.banks.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{item.products.name}</p>
                      </div>
                      <div className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        !item.is_available ? 'bg-rose-100 text-rose-700' :
                        item.approval_probability === 'High' ? 'bg-emerald-100 text-emerald-700' :
                        item.approval_probability === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {!item.is_available ? 'Нет доступа' :
                         item.approval_probability === 'High' ? 'Высокий шанс' : 
                         item.approval_probability === 'Medium' ? 'Рандом 50/50' : 'Мало шансов'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.is_available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-sm font-medium text-slate-700">
                        {item.is_available ? 'Доступно для открытия' : 'Официально не открывают'}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="mt-auto pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          <span className="font-semibold text-slate-700">Инсайд: </span> 
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-sm text-slate-500">Нет данных для этого статуса</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================== */}
      {/* СЕКЦИЯ 2: ИНВЕСТ-НАВИГАТОР (ФАЗА 2 - КАРТОЧКИ БРОКЕРОВ)    */}
      {/* ========================================================== */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Доступные Брокеры и Шлюзы</h2>
          <p className="text-sm text-slate-500 mt-1">Как и через какие банки легально пополнять инвестиционные счета</p>
        </div>
        
        <BrokerCards brokers={brokers} currentStatus={status} />
      </div>

      {/* ========================================================== */}
      {/* СЕКЦИЯ 3: ИНСТРУМЕНТЫ СБЕРЕЖЕНИЯ И КАЛЬКУЛЯТОР (ФАЗА 3)    */}
      {/* ========================================================== */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Инструменты Сбережения</h2>
          <p className="text-sm text-slate-500 mt-1">Интерактивное сопоставление инструментов с учетом скрытых издержек</p>
        </div>

        <YieldComparator deposits={deposits} bonds={bonds} spreads={spreads} />
      </div>

      {/* ========================================================== */}
      {/* СЕКЦИЯ 4: ХАБ УСЛУГ / ЛИД-ГЕН ВИТРИНА ЭКСПЕРТОВ (ФАЗА 4)   */}
      {/* ========================================================== */}
      <div className="space-y-6 pt-4">
        <VerifiedExperts providers={providers} />
      </div>

      {/* ========================================================== */}
      {/* СЕКЦИЯ 5: НАЛОГОВЫЙ НАВИГАТОР (ФАЗА 2 - НАЛОГОВАЯ МАТРИЦА) */}
      {/* ========================================================== */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Налоговый Навигатор</h2>
          <p className="text-sm text-slate-500 mt-1">Фискальная нагрузка на мировой доход налогового резидента Сербии</p>
        </div>
        
        <TaxOptimizer initialRules={taxRules} />
      </div>
    </main>
  );
}
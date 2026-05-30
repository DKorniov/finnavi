import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { ResidencyStatus } from "../types/database";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 1. Извлекаем глобальный стейт резидентства прямо на сервере (без мигания UI)
  const cookieStore = await cookies();
  const status = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;

  // 2. Инициализируем Supabase для легких запросов монетизации (Phase 2 / Lead-gen)
  // Тянем на главную только промоутируемых экспертов или экспресс-офферы
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: promoProviders } = await supabase
    .from("service_providers")
    .select("id, name, title, description, telegram_handle, rating")
    .limit(2); // Точечный лимит только для промо-блока на главной

  // 3. Слой опережающего риск-менеджмента: кастомные информеры под тип ВНЖ
  const getStatusDashboardData = (currentStatus: ResidencyStatus) => {
    switch (currentStatus) {
      case "non_resident":
        return {
          badge: "Критические ограничения",
          title: "🚨 Режим Нерезидента (РФ/РБ паспорт)",
          alertText: "Доступны только базовые счета (Alta, Poštanska) без полноценного e-banking. Любые входящие переводы из-за рубежа или P2P транзакции находятся под максимальным комплаенс-риском. Валютные переводы внутри Сербии законодательно запрещены.",
          nextStep: "Получить боравак (ВНЖ) или открыть счет под контракт найма/ИП.",
          actionLink: "/accounts"
        };
      case "resident_less_1y":
        return {
          badge: "Валютный контроль",
          title: "⏳ ВНЖ < 12 месяцев («Стена 12 месяцев»)",
          alertText: "Вы обладатель ВНЖ, но по Закону о валютном регулировании (Zakon o deviznom poslovanju) для банков вы всё еще нерезидент. Полноценный e-banking заблокирован. Для отправки SWIFT-переводов за рубеж банки потребуют бумажные инвойсы, контракты и обоснование происхождения средств.",
          nextStep: "Изучить легальные шлюзы пополнения брокеров и дождаться налогового резидентства.",
          actionLink: "/invest"
        };
      case "resident_more_1y":
        return {
          badge: "Резидент разблокирован",
          title: "✅ Полноценный Резидент (12 месяцев+ с ВНЖ)",
          alertText: "Поздравляем, вы стали полноценным валютным резидентом Сербии! Ограничения на e-banking сняты. Доступны внутренние онлайн-платежи. Внимание: теперь вы обязаны отчитываться в налоговую Сербии обо всех зарубежных счетах (IBKR, Т212, зарубежные карты) и платить 15% налога на дивиденды.",
          nextStep: "Оптимизировать налоги и запустить калькулятор доходности гособлигаций.",
          actionLink: "/taxes"
        };
    }
  };

  const dashboardData = getStatusDashboardData(status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* ГЛАВНЫЙ СТРАТЕГИЧЕСКИЙ БАННЕР ХАБА */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-radial-at-t from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
            ExpatFinance Navigator v2.0
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-none text-white">
            Главный финансовый хаб для экспатов в Сербии
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
            Первый маркетплейс с жестким «экспортным фильтром». Мы автоматически фильтруем банковские, инвестиционные и налоговые инструменты под ваш реальный юридический статус в стране.
          </p>
        </div>
      </div>

      {/* АВТОМАТИЧЕСКИЙ ИНФОРМЕР РИСКОВ (КОМПЛАЕНС-ФИЛЬТР) */}
      <div className="bg-amber-50/60 backdrop-blur-xs border border-amber-200/80 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {dashboardData.badge}
              </span>
              <h4 className="font-bold text-slate-900 text-sm md:text-base">{dashboardData.title}</h4>
            </div>
            <p className="text-slate-600 text-xs md:text-sm mt-1.5 leading-relaxed max-w-4xl">
              {dashboardData.alertText}
            </p>
          </div>
        </div>
        <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200 flex flex-col items-start md:items-end gap-1">
          <span className="text-[11px] text-slate-400">Рекомендуемый шаг:</span>
          <Link href={dashboardData.actionLink} className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
            {dashboardData.nextStep}
          </Link>
        </div>
      </div>

      {/* СЕТКА УПРАВЛЕНИЯ МОДУЛЯМИ (ФИНАНСОВЫЕ ДОРОЖНЫЕ КАРТЫ) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Финансовые Архитектурные Модули</h2>
          <p className="text-xs text-slate-400 mt-0.5">Выберите целевое направление для глубокого аудита условий</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* МОДУЛЬ 1: БАНКИ */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors group">
            <div className="space-y-3">
              <div className="text-3xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-between shadow-inner px-2.5">🏦</div>
              <h3 className="font-bold text-base text-slate-900">Банковский Навигатор</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Матрица открытия личных и бизнес-счетов (ИП/ДОО) в Raiffeisen, OTP, Alta, Poštanska с поправкой на фактор «сербского рандома» и паспорта РФ.
              </p>
            </div>
            <Link href="/accounts" className="mt-5 text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
              Открыть матрицу банков →
            </Link>
          </div>

          {/* МОДУЛЬ 2: ИНВЕСТИЦИИ */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors group">
            <div className="space-y-3">
              <div className="text-3xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-between shadow-inner px-2.5">📈</div>
              <h3 className="font-bold text-base text-slate-900">Инвест-Навигатор</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Интеграция с международными брокерами (IBKR, Trading212). Маршруты пополнения без блокировок, SWIFT-шлюзы и покупка сербских еврооблигаций через банки.
              </p>
            </div>
            <Link href="/invest" className="mt-5 text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
              Проверить брокеров и шлюзы →
            </Link>
          </div>

          {/* МОДУЛЬ 3: СБЕРЕЖЕНИЯ */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors group">
            <div className="space-y-3">
              <div className="text-3xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-between shadow-inner px-2.5">💰</div>
              <h3 className="font-bold text-base text-slate-900">Вклады и Облигации</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Сравнение доходности динарских депозитов и гособлигаций в EUR. Изоморфный калькулятор скрытых издержек, банковских спредов и комиссий.
              </p>
            </div>
            <Link href="/savings" className="mt-5 text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
              Запустить Yield Comparator →
            </Link>
          </div>

          {/* МОДУЛЬ 4: НАЛОГИ */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors group">
            <div className="space-y-3">
              <div className="text-3xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-between shadow-inner px-2.5">⚖️</div>
              <h3 className="font-bold text-base text-slate-900">Налоговый Оптимизатор</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Справочник по ставкам: 15% на иностранные дивиденды, 0% на сербские ОФЗ. Сравнение режимов Фрилансер vs Паушал vs Книгаш для IT-предпринимателей.
              </p>
            </div>
            <Link href="/taxes" className="mt-5 text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
              Рассчитать налоговую нагрузку →
            </Link>
          </div>

          {/* МОДУЛЬ 5: ЗОНА ВЫСОКИХ РИСКОВ (КРИПТА) */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors group">
            <div className="space-y-3">
              <div className="text-3xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-between shadow-inner px-2.5">🪙</div>
              <h3 className="font-bold text-base text-slate-900">Крипта и P2P</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Инструкции по легализации цифровых активов в Сербии. Списки верифицированных оффлайн-обменников в Белграде и Нови-Саде, риски блокировок карт.
              </p>
            </div>
            <span className="mt-5 text-xs font-bold text-amber-600 flex items-center gap-1">
              В разработке (Phase 2)
            </span>
          </div>

          {/* МОДУЛЬ 6: СЕРВИСНЫЙ ХАБ */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors group">
            <div className="space-y-3">
              <div className="text-3xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-between shadow-inner px-2.5">🤝</div>
              <h3 className="font-bold text-base text-slate-900">Проверенные Эксперты</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Прямой выход на русскоязычных бухгалтеров, юристов по ВНЖ/ПМЖ и финансовых консультантов с прозрачными кейсами прохождения сербского KYC.
              </p>
            </div>
            <Link href="/services" className="mt-5 text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
              Связаться со специалистами →
            </Link>
          </div>

        </div>
      </div>

      {/* LEAD-GEN БЛОК МОНЕТИЗАЦИИ (FREEMIUM / EXPERTS TELEGRAM HOOK) */}
      {promoProviders && promoProviders.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Рекомендуемые специалисты недели</h3>
              <p className="text-slate-400 text-xs">Проверенный комьюнити ручной комплаенс</p>
            </div>
            <Link href="/services" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Посмотреть всю витрину экспертов ({promoProviders.length}+) →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promoProviders.map((provider) => (
              <div key={provider.id} className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs md:text-sm">{provider.name}</span>
                    <span className="text-amber-500 text-xs font-bold">★ {provider.rating || '5.0'}</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider block mt-0.5">{provider.title}</span>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-2">{provider.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-end">
                  <Link href="/services" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    Оставить заявку
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
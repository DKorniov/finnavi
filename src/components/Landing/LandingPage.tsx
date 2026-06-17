// src/components/Landing/LandingPage.tsx
import Link from "next/link";

const PAIN_CARDS = [
  {
    icon: "🏦",
    iconBg: "bg-emerald-50",
    title: "Какой банк откроет счёт?",
    body: "Условия различаются для каждого типа ВНЖ. То что работает для одного — отказ для другого. Сербский рандом реален.",
    answer: "Матрица 5 банков по вашему статусу",
    href: "/?tab=accounts",
  },
  {
    icon: "📈",
    iconBg: "bg-blue-50",
    title: "Куда вложить деньги выгодно?",
    body: "Купоны по гособлигациям Сербии освобождены от налога. Вклады в динарах дают 4–5% годовых. ETF через IBKR — 15% CGT.",
    answer: "Сравнение брокеров, вкладов, облигаций",
    href: "/?tab=investment_bonds",
  },
  {
    icon: "🧾",
    iconBg: "bg-amber-50",
    title: "Сколько налогов платить?",
    body: "Соглашение РФ–Сербия об избежании двойного налогообложения действует. Налоговый резидент Сербии платит только здесь.",
    answer: "Справочник ставок для физлиц и ИП",
    href: "/?tab=taxes",
  },
] as const;

const STATS = [
  { n: "5",  label: "банков с тарифами из Cenovnik PDF" },
  { n: "31", label: "продукт: счета, вклады, облигации, кредиты" },
  { n: "3",  label: "брокера с маршрутами пополнения" },
  { n: "5",  label: "статусов ВНЖ — от туриста до гражданина" },
] as const;

const SECTIONS = [
  {
    emoji: "💳",
    iconBg: "bg-emerald-50",
    title: "Счета и карты",
    sub: "KYC-матрица · 5 банков · SWIFT тарифы",
    href: "/?tab=accounts",
  },
  {
    emoji: "🏦",
    iconBg: "bg-amber-50",
    title: "Вклады и депозиты",
    sub: "Ставки RSD/EUR · налог 0% на RSD-вклады",
    href: "/?tab=savings_deposit",
  },
  {
    emoji: "📊",
    iconBg: "bg-blue-50",
    title: "Инвестиции",
    sub: "Брокеры · гособлигации · ETF",
    href: "/?tab=investment_bonds",
  },
  {
    emoji: "📄",
    iconBg: "bg-purple-50",
    title: "Налоги",
    sub: "Физлица · ИП-паушал · фрилансеры",
    href: "/?tab=taxes",
  },
] as const;

const MINI_BANKS = [
  { name: "Raiffeisen Bank", sub: "Личный счёт · SWIFT · Мультивалютный", badge: "Высокая вер.", color: "bg-emerald-50 text-emerald-800" },
  { name: "Alta Banka",      sub: "Личный счёт · Apple Pay · IPS QR",     badge: "Высокая вер.", color: "bg-emerald-50 text-emerald-800" },
  { name: "OTP Banka",       sub: "Личный счёт · SWIFT · DinaCard",       badge: "50 / 50",      color: "bg-amber-50 text-amber-800"   },
  { name: "Banca Intesa",    sub: "Личный счёт · нерезидент-ограничения", badge: "Отказ",        color: "bg-red-50 text-red-800"       },
] as const;

export function LandingPage() {
  return (
    <div className="font-sans antialiased">

      {/* ── Навбар ─────────────────────────────────────────── */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight text-slate-900">
            Expat<span className="text-emerald-500">Finance</span>
          </span>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/?tab=accounts"          className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Банки</Link>
            <Link href="/?tab=investment_bonds"  className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Инвестиции</Link>
            <Link href="/?tab=taxes"             className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Налоги</Link>
            <Link href="/?tab=services"          className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Эксперты</Link>
            <Link
              href="/?tab=accounts"
              className="text-sm font-semibold px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Открыть навигатор
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Левая колонка */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Для экспатов в Сербии
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
            Финансы в Сербии —<br />
            без месяца поиска<br />
            <span className="text-emerald-500">по форумам</span>
          </h1>

          <p className="text-base text-slate-500 leading-relaxed mb-7 max-w-md">
            Матрица банков по вашему ВНЖ, сравнение вкладов и брокеров, справочник по налогам. На основе официальных тарифов и реального опыта экспат-сообщества.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/?tab=accounts"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Открыть навигатор
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
            </Link>
            <span className="text-sm text-slate-400">Бесплатно · Без регистрации</span>
          </div>

          {/* Строка доверия */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-400">
            {["Данные из PDF банков", "Июнь 2026", "Паспорта РФ / РБ / UA"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Правая колонка — мини-превью матрицы */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900">Expat<span className="text-emerald-500">Finance</span> Navigator</span>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-0.5">
              ВНЖ до 1 года
            </span>
          </div>

          {/* Таб-полоска */}
          <div className="flex border-b border-slate-200 mb-3 text-[11px]">
            {["Счета и карты", "Вклады", "Инвестиции", "Налоги"].map((tab, i) => (
              <div
                key={tab}
                className={`px-3 py-2 border-b-2 whitespace-nowrap ${
                  i === 0
                    ? "border-emerald-500 text-slate-900 font-semibold"
                    : "border-transparent text-slate-400"
                }`}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Строки банков */}
          <div className="space-y-2">
            {MINI_BANKS.map((b) => (
              <div
                key={b.name}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-900">{b.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{b.sub}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${b.color}`}>
                  {b.badge}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            5 банков · фильтр: ВНЖ до 1 года · Физлицо
          </div>
        </div>
      </section>

      {/* ── Статы ──────────────────────────────────────────── */}
      <div className="border-t border-b border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{s.n}</div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Три боли ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Для чего это нужно</div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8 tracking-tight">
          Три вопроса, на которые сложно найти ответ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PAIN_CARDS.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group block bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl mb-4`}>
                {c.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{c.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{c.body}</p>
              <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {c.answer}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Разделы навигатора ─────────────────────────────── */}
      <div className="border-t border-slate-100 bg-slate-50">
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Что внутри</div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8 tracking-tight">Разделы навигатора</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECTIONS.map((s) => (
              <Link
                key={s.title}
                href={s.href}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div className={`w-8 h-8 ${s.iconBg} rounded-lg flex items-center justify-center text-base shrink-0`}>
                  {s.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{s.sub}</div>
                </div>
                <svg className="ml-auto shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── Цитата основателя ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Почему это существует</div>
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
              ДК
            </div>
            <div>
              <blockquote className="text-base text-slate-600 leading-relaxed mb-4 italic">
                «Я переехал в Сербию в 2022 году. На то чтобы разобраться в банковской системе, найти брокера который откроет счёт с российским паспортом и понять налоги — ушло несколько месяцев. FinNavi — это то, что я хотел иметь тогда.»
              </blockquote>
              <div className="text-sm text-slate-400">
                <span className="font-semibold text-slate-700">Дмитрий К.</span>
                {" "}— основатель · Нови Сад · ВНЖ 3 года · торгует облигациями на BELEX
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Финальный CTA ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <div className="bg-slate-900 rounded-2xl px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Готовы разобраться с финансами в Сербии?
            </h2>
            <p className="text-sm text-slate-400">Бесплатно · Без регистрации · Данные из официальных PDF банков</p>
          </div>
          <Link
            href="/?tab=accounts"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Открыть навигатор
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </Link>
        </div>
      </div>

      {/* ── Футер ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">© 2026 ExpatFinance Navigator</span>
          <p className="text-xs text-slate-400 text-right max-w-md leading-relaxed">
            Данные носят информационный характер. Актуальны на июнь 2026.
            Верифицируйте у специалиста перед финансовыми решениями.
          </p>
        </div>
      </footer>

    </div>
  );
}
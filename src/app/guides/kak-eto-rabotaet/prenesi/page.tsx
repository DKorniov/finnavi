// src/app/guides/kak-eto-rabotaet/prenesi/page.tsx
import Link from "next/link";
import { getAllBanks } from "@/lib/data/banks";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prenesi — перевод по номеру телефона в Сербии: какие банки поддерживают | ExpatFinance Navigator",
  description: "Таблица поддержки сервиса Prenesi (мгновенный перевод по номеру телефона через IPS НБС) по личным и бизнес-счетам Alta, Banca Intesa, OTP, Poštanska Štedionica, Raiffeisen.",
};

function SupportBadge({ value }: { value: boolean | null | undefined }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Поддерживается
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Нет
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 border-dashed px-2.5 py-1 rounded-full">
      Нет данных
    </span>
  );
}

const TOC = [
  { id: "zachem",        label: "Зачем это нужно экспату" },
  { id: "glavnoe",       label: "Главное, что нужно знать" },
  { id: "lichnye",       label: "Личные счета" },
  { id: "biznes",        label: "Бизнес-счета (РКО)" },
];

export default async function PrenesiGuidePage() {
  const banks = await getAllBanks();

  const rows = banks.flatMap(bank =>
    bank.products
      .filter(p => p.category === "personal_account" || p.category === "business_account")
      .map(p => ({
        bankName: bank.brand_name,
        logoColor: bank.logo_color ?? "#1e293b",
        product: p,
      }))
  );

  const personalRows = rows.filter(r => r.product.category === "personal_account");
  const businessRows = rows.filter(r => r.product.category === "business_account");

  const personalSupported = personalRows.filter(r => r.product.features?.prenesi === true).length;
  const businessSupported = businessRows.filter(r => r.product.features?.prenesi === true).length;

  // Честная дата обновления — берём из реальных JSON, не выдумываем "дату публикации"
  const lastUpdated = banks
    .map(b => b.last_updated)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* Хлебные крошки — Гайды и Как это работает пока без ссылок:
          листинг-страниц категорий ещё нет, рабочая ссылка появится, когда наберётся контент */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-slate-700 transition-colors">Главная</Link>
        <span>/</span>
        <span>Гайды</span>
        <span>/</span>
        <span>Как это работает</span>
        <span>/</span>
        <span className="text-slate-600 font-medium">Prenesi</span>
      </nav>

      {/* Шапка */}
      <header className="mb-6">
        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full mb-3">
          Как это работает
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
          Что такое Prenesi и какие банки его поддерживают
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Prenesi — сервис мгновенного перевода по номеру телефона, часть{" "}
          <a href="https://ips.nbs.rs/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            системы инстант-платежей НБС (IPS НБС)
          </a>. Получателю не нужно знать номер счёта — достаточно номера телефона,
          который он зарегистрировал в приложении своего банка. Перевод приходит за секунды,
          в любое время суток, 365 дней в году.
        </p>
      </header>

      {/* Источник данных — честно, без выдуманного "автора-эксперта":
          контент собран из реальных тарифов банков, а не написан редакцией */}
      {lastUpdated && (
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-8 pb-6 border-b border-slate-200">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Источник: тарифы банков (Cenovnik) · обновлено {lastUpdated}
        </div>
      )}

      {/* Содержание статьи */}
      <nav className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Содержание статьи</p>
        <ul className="space-y-1.5">
          {TOC.map(item => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-blue-700 hover:underline">{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Зачем это экспату */}
      <div id="zachem" className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-900 scroll-mt-20">
        <span className="font-bold block mb-1">Зачем это нужно экспату</span>
        Поделить счёт в кафе, перевести деньги знакомому, получить возврат от частного лица —
        всё это делается за секунды, без необходимости диктовать номер счёта (IBAN) и без комиссии
        внутри системы. Это бытовой, повседневный инструмент, а не банковский продукт в строгом смысле —
        но доступен он не у всех банков и не у всех типов счетов.
      </div>

      {/* Главная находка */}
      <div id="glavnoe" className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 text-sm text-amber-900 scroll-mt-20">
        <span className="font-bold block mb-1">Главное, что нужно знать</span>
        Среди отслеживаемых банков Prenesi подключён у {personalSupported} из {personalRows.length} личных
        счетов, но только у {businessSupported} из {businessRows.length} бизнес-счетов — по факту это
        преимущественно сервис для физлиц. Если тебе нужен Prenesi на бизнес-счёт — уточняй в банке
        отдельно, в данных это пока не подтверждено ни у одного из отслеживаемых банков.
      </div>

      {/* Таблица — личные счета */}
      <section id="lichnye" className="mb-10 scroll-mt-20">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Личные счета</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500">
                <th className="px-5 py-3">Банк</th>
                <th className="px-5 py-3">Продукт</th>
                <th className="px-5 py-3">Prenesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {personalRows.map(({ bankName, logoColor, product }) => (
                <tr key={product.product_id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: logoColor }} />
                      <span className="text-slate-700">{bankName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{product.name}</td>
                  <td className="px-5 py-3"><SupportBadge value={product.features?.prenesi} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Таблица — бизнес-счета */}
      <section id="biznes" className="mb-10 scroll-mt-20">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Бизнес-счета (РКО)</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500">
                <th className="px-5 py-3">Банк</th>
                <th className="px-5 py-3">Продукт</th>
                <th className="px-5 py-3">Prenesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {businessRows.map(({ bankName, logoColor, product }) => (
                <tr key={product.product_id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: logoColor }} />
                      <span className="text-slate-700">{bankName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{product.name}</td>
                  <td className="px-5 py-3"><SupportBadge value={product.features?.prenesi} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Данные основаны на тарифах банков и могут устаревать — перед открытием счёта уточняй
        актуальную поддержку Prenesi в приложении банка.{" "}
        <Link href="/?tab=accounts" className="text-blue-600 underline">Смотреть все счета</Link>
      </p>
    </div>
  );
}
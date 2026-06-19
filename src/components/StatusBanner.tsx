// src/components/StatusBanner.tsx
"use client";

import type { ResidencyStatus } from "@/types/bank";

interface StatusBannerProps {
  status: ResidencyStatus;
}

// ─────────────────────────────────────────
// Данные по статусам
// ─────────────────────────────────────────
const STATUS_DATA: Record<ResidencyStatus, {
  badge: string;
  badgeColor: string;
  title: string;
  titleAccent: string;
  description: string;
  pills: { label: string; color: 'red' | 'yellow' | 'green' }[];
  iconBg: string;
  icon: React.ReactNode;
}> = {
  non_resident: {
    badge: "Нерезидент",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    title: "Финансы в Сербии",
    titleAccent: "с нуля",
    description: "Большинство банков требуют трудовой контракт или ВНЖ. Исходящие SWIFT ограничены или требуют личного визита в кассу.",
    pills: [
      { label: "Большинство SWIFT заблокированы", color: "red" },
      { label: "Нужен контракт или инвойс", color: "yellow" },
      { label: "Постанска и Alta Banka лояльны", color: "green" },
    ],
    iconBg: "bg-red-50",
    icon: (
      <svg className="w-16 h-16 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  resident_less_1y: {
    badge: "ВНЖ < 1 года",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    title: "Базовый доступ",
    titleAccent: "открыт",
    description: "Доступны личные и бизнес-счета в лояльных банках. Исходящие SWIFT могут потребовать инвойс или договор.",
    pills: [
      { label: "SWIFT на вывод — с ограничениями", color: "yellow" },
      { label: "Счёт открыть реально", color: "green" },
      { label: "Кредиты и ипотека — не доступны", color: "red" },
    ],
    iconBg: "bg-amber-50",
    icon: (
      <svg className="w-16 h-16 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
  resident_more_1y: {
    badge: "ВНЖ 1г+",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    title: "Переводы",
    titleAccent: "без ограничений",
    description: "Сняты ограничения на исходящие SWIFT-переводы. Комплаенс становится мягче, появляются кредитные продукты.",
    pills: [
      { label: "Исходящий SWIFT открыт", color: "green" },
      { label: "Часть кредитных продуктов доступна", color: "green" },
      { label: "Ипотека — только с поручителем", color: "yellow" },
    ],
    iconBg: "bg-blue-50",
    icon: (
      <svg className="w-16 h-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  permanent_resident: {
    badge: "ПМЖ",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    title: "Привилегированный",
    titleAccent: "доступ",
    description: "Полное доверие со стороны комплаенса. Доступны кредитные продукты и ипотека без поручителей.",
    pills: [
      { label: "Ипотека без поручителей", color: "green" },
      { label: "Все виды переводов", color: "green" },
      { label: "Полный доступ к кредитам", color: "green" },
    ],
    iconBg: "bg-emerald-50",
    icon: (
      <svg className="w-16 h-16 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  citizen: {
    badge: "Гражданин",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    title: "Полный доступ",
    titleAccent: "ко всей экосистеме",
    description: "Никаких инфраструктурных ограничений. Вся финансовая экосистема страны доступна в штатном режиме.",
    pills: [
      { label: "Вся экосистема без ограничений", color: "green" },
      { label: "Все виды кредитов и ипотека", color: "green" },
      { label: "Инвестиции и облигации", color: "green" },
    ],
    iconBg: "bg-slate-50",
    icon: (
      <svg className="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
};

const PILL_STYLES: Record<'red' | 'yellow' | 'green', string> = {
  red:    "bg-red-50 text-red-700 border-red-100",
  yellow: "bg-amber-50 text-amber-700 border-amber-100",
  green:  "bg-emerald-50 text-emerald-700 border-emerald-100",
};

// ─────────────────────────────────────────
// Компонент
// ─────────────────────────────────────────
export function StatusBanner({ status }: StatusBannerProps) {
  const d = STATUS_DATA[status];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mb-5 flex">

      {/* Левая часть */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-3">

        {/* Бейдж */}
        <span className={`inline-flex self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${d.badgeColor}`}>
          {d.badge}
        </span>

        {/* Заголовок */}
        <div className="leading-tight">
          <span className="text-lg font-extrabold text-slate-900">{d.title} </span>
          <span className="text-lg font-extrabold text-emerald-500">{d.titleAccent}</span>
        </div>

        {/* Описание */}
        <p className="text-sm text-slate-500 leading-relaxed">{d.description}</p>

        {/* Факты-пилюли */}
        <div className="flex flex-wrap gap-1.5">
          {d.pills.map((pill, i) => (
            <span
              key={i}
              className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${PILL_STYLES[pill.color]}`}
            >
              {pill.label}
            </span>
          ))}
        </div>
      </div>

      {/* Правая часть — иконка */}
      <div className={`hidden sm:flex w-28 flex-shrink-0 items-center justify-center ${d.iconBg} border-l border-slate-100`}>
        {d.icon}
      </div>
    </div>
  );
}
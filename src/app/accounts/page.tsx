import { cookies } from "next/headers";
import { BankMatrix } from "@/components/Accounts/BankMatrix";
import { getMatrixItemsForStatus } from "@/lib/data/banks";
import type { ResidencyStatus, LegalType } from "@/types/bank";

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  // 1. Извлекаем глобальные статусы пользователя из кук (Next.js 14+ требует await)
  const cookieStore = await cookies();
  const currentStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const currentLegalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  // 2. Получаем готовые и строго типизированные данные из нашей JSON-базы
  const items = await getMatrixItemsForStatus(currentStatus, currentLegalType);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      
      {/* Хедер секции */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Матрица Доступности Банков
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl">
            Сводка условий комплаенса и тарифов для паспортов РФ/РБ. Данные основаны на официальных тарифах (Cenovnik) и верифицированных логах экспат-сообществ.
          </p>
        </div>
        
        {/* Информер Сербского Рандома */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs max-w-sm border border-slate-800 shadow-xs shrink-0">
          <div className="flex items-center gap-2 font-bold text-amber-400 mb-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Внимание: Сербский рандом
          </div>
          <p className="text-slate-400 leading-relaxed">
            Условия открытия счетов могут меняться в зависимости от конкретного отделения, города и даже настроения менеджера.
          </p>
        </div>
      </div>

      {/* Рендерим матрицу (Компонент сам сгруппирует банки и продукты) */}
      <BankMatrix initialItems={items} />
      
    </main>
  );
}
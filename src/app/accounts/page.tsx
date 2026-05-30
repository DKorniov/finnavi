import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { BankMatrix } from "@/components/Accounts/BankMatrix";
import type { ResidencyStatus, AvailabilityItem } from "@/types/database";

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  // 1. Извлекаем глобальный статус резидентства из кук хедера
  const cookieStore = await cookies();
  const currentStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;

  // 2. Инициализируем серверный клиент Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 3. Выполняем точечный JOIN-запрос с фильтрацией по статусу на уровне СУБД
  const { data: rawItems, error } = await supabase
    .from("availability_items")
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
    .eq("residency_status", currentStatus); // 🔥 Фильтр: тянем только нужный статус ВНЖ

  if (error) {
    // Детальное логирование ошибок комплаенса в терминал
    console.error("Supabase Fetch Error:", JSON.stringify(error, null, 2));
  }

  // Безопасное приведение типов
  const items = (rawItems as unknown as AvailabilityItem[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Хедер секции */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Матрица Доступности Банков
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl">
            Таблица прохождения комплаенса для паспортов РФ/РБ на основе логов экспат-чатов. 
            Показаны условия под статус: 
            <span className="ml-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {currentStatus === 'non_resident' ? 'Нерезидент' : currentStatus === 'resident_less_1y' ? 'ВНЖ < 1 года' : 'ПМЖ / 12 мес+'}
            </span>
          </p>
        </div>
        
        {/* Информер Сербского Рандома */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs max-w-sm border border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
            <span>⚡ Factor: Srpsko Polako</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Даже если статус «Высокий», решение в Сербии принимает конкретный директор конкретной филиялы. Имейте запасной план.
          </p>
        </div>
      </div>

      <BankMatrix initialItems={items} />
    </div>
  );
}
import { createClient } from "@supabase/supabase-js";
import { TaxOptimizer } from "@/components/Taxes/TaxOptimizer";
import type { TaxRuleWithCategory } from "@/types/database";

export const dynamic = 'force-dynamic';

export default async function TaxesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Фетчим правила со строгим JOIN-запросом связанной таблицы категорий активов
  const { data: rawRules, error } = await supabase
    .from("tax_rules")
    .select(`
      id,
      category_id,
      user_legal_status,
      tax_type,
      tax_rate_percent,
      is_tax_free,
      notes,
      legal_reference,
      asset_categories (
        id,
        name,
        code
      )
    `);

  if (error) {
    console.error("Supabase Tax Fetch Error:", error);
  }

  // Приведение типов и защита от пустой базы
  const rules = (rawRules as unknown as TaxRuleWithCategory[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Шапка модуля */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Налоговый Оптимизатор
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl">
            Интерактивный справочник по налогообложению локальных и зарубежных активов для резидентов Сербии. На основе Закона о подоходном налоге граждан (Zakon o porezu na dohodak građana).
          </p>
        </div>

        {/* Слой опережающего риск-менеджмента */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs max-w-md text-blue-800">
          <span className="font-bold block mb-1">⚖️ Налоговое резидентство (183 дня vs 12 месяцев)</span>
          <p className="leading-relaxed text-blue-900/80">
            Не путайте статус в банке и налоговый статус. Вы становитесь налоговым резидентом Сербии, если проведете в стране суммарно более 183 дней в календарном году. С этого момента возникает обязанность декларировать мировой доход.
          </p>
        </div>
      </div>

      {/* Интерактивная клиентская матрица оптимизации */}
      <TaxOptimizer initialRules={rules} />
    </div>
  );
}
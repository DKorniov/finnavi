import { createClient } from '@supabase/supabase-js';
import { ResidencyTabs } from "../components/ResidencyTabs";
import { AvailabilityItem } from "../types/database";

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const resolvedParams = await searchParams;
  const status = resolvedParams?.status || "non_resident";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
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
    .eq('status', status);

  if (error) console.error("Ошибка при получении данных:", error);

  const availability = (data || []) as unknown as AvailabilityItem[];

  // Группируем данные по категориям продуктов для колонок
  const groupedData = {
    current_account: availability.filter(item => item.products.category === 'current_account'),
    savings: availability.filter(item => item.products.category === 'savings'),
    business_account: availability.filter(item => item.products.category === 'business_account'),
  };

  const columns = [
    { id: 'current', title: 'Личный счет', items: groupedData.current_account },
    { id: 'savings', title: 'Сберегательный вклад', items: groupedData.savings },
    { id: 'business', title: 'Счет ИП (Preduzetnik)', items: groupedData.business_account },
  ];

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          ExpatFinance Navigator
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Сравнение банковских продуктов в Сербии
        </p>
      </header>
      
      <div className="flex justify-center mb-10">
        <ResidencyTabs />
      </div>

      {/* Вывод результатов в 3 колонки (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-4">
            {/* Заголовок колонки */}
            <h2 className="text-xl font-bold text-slate-800 border-b-2 border-slate-200 pb-3 mb-2 flex items-center justify-between">
              {column.title}
              <span className="bg-slate-100 text-slate-500 text-sm py-1 px-2 rounded-full">
                {column.items.length}
              </span>
            </h2>

            {/* Карточки банков */}
            {column.items.length > 0 ? (
              column.items.map((item: AvailabilityItem) => (
                <div key={item.id} className="group relative p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.products.banks.name}
                    </h3>
                    
                    {/* ИСПРАВЛЕНИЕ: Защитная логика "Светофора" */}
                    <div className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${
                      !item.is_available ? 'bg-rose-100 text-rose-700' :
                      item.approval_probability === 'High' ? 'bg-emerald-100 text-emerald-700' : 
                      item.approval_probability === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                      'bg-rose-100 text-rose-700'
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
    </main>
  );
}
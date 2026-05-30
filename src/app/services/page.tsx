import { createClient } from "@supabase/supabase-js";
import { VerifiedExperts } from "@/components/Services/VerifiedExperts";
import type { ServiceProvider } from "@/types/database";

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Фетчим провайдеров. Сначала платные (is_promoted), потом по убыванию рейтинга
  const { data: rawProviders, error } = await supabase
    .from("service_providers")
    .select("*")
    .order("is_promoted", { ascending: false })
    .order("rating", { ascending: false });

  if (error) {
    // Выводим детальную ошибку в терминал VS Code для легкого дебага
    console.error("Supabase Services Fetch Error:", JSON.stringify(error, null, 2));
  }

  // Строго типизируем ответ для передачи в клиентский компонент
  const providers = (rawProviders as ServiceProvider[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Проверенные Эксперты
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl">
            Витрина русскоязычных и локальных специалистов в Сербии (бухгалтеры, юристы, консультанты), проверенных комьюнити на реальных кейсах.
          </p>
        </div>
        
        {/* Информер доверия */}
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs max-w-sm text-emerald-800">
          <span className="font-bold block mb-1">🛡️ ExpatFinance Verified</span>
          <p className="leading-relaxed text-emerald-900/80">
            Специалисты с бейджем Verified прошли проверку нашими редакторами: мы запрашивали реальные успешные кейсы прохождения банковского комплаенса и открытия ИП.
          </p>
        </div>
      </div>

      <VerifiedExperts providers={providers} />
    </div>
  );
}
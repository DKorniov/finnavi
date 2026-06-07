// src/app/savings/page.tsx

import { createClient } from "@supabase/supabase-js";
import { YieldComparator } from "@/components/Calculators/YieldComparator";

export const dynamic = 'force-dynamic';

export default async function SavingsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Параллельный запрос 3 таблиц для калькулятора (Вклады, Облигации, Спреды)
  const [depositsRes, bondsRes, spreadsRes] = await Promise.all([
    supabase.from("deposit_rates").select("*"),
    supabase.from("bond_yields").select("*"),
    supabase.from("currency_spreads").select("*")
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Вклады и Облигации</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          Сравнение реальной доходности динарских депозитов и сербских гособлигаций (ОФЗ) в евро с учетом скрытых банковских спредов и брокерских комиссий.
        </p>
      </div>

      <YieldComparator 
        deposits={depositsRes.data || []} 
        bonds={bondsRes.data || []} 
        spreads={spreadsRes.data || []} 
      />
    </div>
  );
}
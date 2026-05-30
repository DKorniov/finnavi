import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { BrokerCards } from "@/components/Invest/BrokerCards";
import type { ResidencyStatus } from "../../types/database";

export const dynamic = 'force-dynamic';

export default async function InvestPage() {
  const cookieStore = await cookies();
  const currentStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Фетчим брокеров с маршрутами пополнения (relation: funding_routes)
  const { data: brokers, error } = await supabase
    .from("brokers")
    .select(`
      *,
      broker_availability (*),
      funding_routes (*)
    `);

  if (error) console.error("Brokers Fetch Error:", error);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Инвест-Навигатор</h1>
        <p className="text-slate-500 mt-2">
          Маршрутизация по брокерам и шлюзам пополнения. Фильтр активен для статуса: 
          <span className="font-semibold text-blue-600 ml-1">
            {currentStatus === 'non_resident' ? 'Нерезидент' : currentStatus === 'resident_less_1y' ? 'ВНЖ < 1 года' : 'ПМЖ / 12 мес+'}
          </span>
        </p>
      </div>

      <BrokerCards brokers={brokers || []} currentStatus={currentStatus} />
    </div>
  );
}
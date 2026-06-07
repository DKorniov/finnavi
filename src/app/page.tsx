// src/app/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getMatrixItemsForStatus } from "@/lib/data/banks";
import { getAllBrokers } from "@/lib/data/brokers";
import { MainTabsClient } from "@/components/MainTabsClient";
import type { ResidencyStatus, LegalType } from "@/types/bank";
import type { TaxRuleWithCategory, ServiceProvider } from "@/types/database";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const status = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const legalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  // JSON-данные банков и брокеров
  const [allItems, brokers] = await Promise.all([
    getMatrixItemsForStatus(status, legalType),
    getAllBrokers(),
  ]);

  // Supabase-данные для вкладок Налоги и Услуги
  let taxRules: TaxRuleWithCategory[] = [];
  let serviceProviders: ServiceProvider[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const [taxRes, servicesRes] = await Promise.all([
      supabase.from("tax_rules").select(`
        id, category_id, user_legal_status, tax_type,
        tax_rate_percent, is_tax_free, notes, legal_reference,
        asset_categories ( id, name, code )
      `),
      supabase
        .from("service_providers")
        .select("*")
        .order("is_promoted", { ascending: false })
        .order("rating", { ascending: false }),
    ]);

    taxRules = (taxRes.data as unknown as TaxRuleWithCategory[]) || [];
    serviceProviders = (servicesRes.data as ServiceProvider[]) || [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <MainTabsClient
        allItems={allItems}
        currentStatus={status}
        taxRules={taxRules}
        serviceProviders={serviceProviders}
        brokers={brokers}
      />
    </div>
  );
}
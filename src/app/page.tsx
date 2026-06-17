// src/app/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getMatrixItemsForStatus } from "@/lib/data/banks";
import { getAllBrokers } from "@/lib/data/brokers";
import { MainTabsClient } from "@/components/MainTabsClient";
import { LandingPage } from "@/components/Landing/LandingPage"; // ← новый импорт
import type { ResidencyStatus, LegalType } from "@/types/bank";
import type { TaxRuleWithCategory, ServiceProvider } from "@/types/database";

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;

  // ── Вариант Б: лендинг когда нет ?tab в URL ────────────
  if (!resolvedParams.tab) {
    return <LandingPage />;
  }
  // ───────────────────────────────────────────────────────

  const cookieStore = await cookies();
  const status = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const legalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  const [allItems, brokers] = await Promise.all([
    getMatrixItemsForStatus(status, legalType),
    getAllBrokers(),
  ]);

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
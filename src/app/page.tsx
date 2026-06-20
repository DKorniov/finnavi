// src/app/page.tsx
import { cookies } from "next/headers";
import { getMatrixItemsForStatus, getAllBanks } from "@/lib/data/banks";
import { getAllBrokers } from "@/lib/data/brokers";
import { getFundItemsForStatus } from "@/lib/data/funds";
import { getTaxRules } from "@/lib/data/taxes";
import { MainTabsClient } from "@/components/MainTabsClient";
import { LandingPage } from "@/components/Landing/LandingPage";
import type { ResidencyStatus, LegalType } from "@/types/bank";
import type { ServiceProvider } from "@/types/database";

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;

  // ── Вариант Б: лендинг когда нет ?tab в URL ────────────
  if (!resolvedParams.tab) {
    const banks = await getAllBanks();
    const landingBanks = banks.map(b => ({
      bankId: b.bank_id,
      name: b.brand_name,
      logoColor: b.logo_color ?? null,
      website: b.website,
    }));
    return <LandingPage banks={landingBanks} />;
  }
  // ───────────────────────────────────────────────────────

  const cookieStore = await cookies();
  const status = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const legalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  // businessItems запрашиваем всегда с legalType='business' —
  // вкладка РКО не зависит от глобального cookie пользователя
  const [allItems, businessItems, brokers, fundItems, taxRules] = await Promise.all([
    getMatrixItemsForStatus(status, legalType),
    getMatrixItemsForStatus(status, 'business'),
    getAllBrokers(),
    getFundItemsForStatus(status),
    getTaxRules(),
  ]);

  // Эксперты/лиды пока сознательно не подключены — Supabase не используется,
  // пока не появятся реальные специалисты и работающая отправка формы.
  // См. манифест: решение зафиксировано, не забыть и не путать с багом.
  const serviceProviders: ServiceProvider[] = [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <MainTabsClient
        allItems={allItems}
        businessItems={businessItems}
        currentStatus={status}
        taxRules={taxRules}
        serviceProviders={serviceProviders}
        brokers={brokers}
        fundItems={fundItems}
      />
    </div>
  );
}
// src/app/accounts/product/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getProductWithBankData } from "@/lib/data/banks";
import { ProductPageClient } from "@/components/Product/ProductPageClient";

import type { ResidencyStatus, LegalType, KYCRule } from "@/types/bank";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const productId = decodeURIComponent(resolvedParams.id);

  const cookieStore = await cookies();
  const userStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const userLegalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  const data = await getProductWithBankData(productId);
  if (!data) notFound();

  const { bank, product } = data;

  const kycRule = bank.kyc_matrix?.find(
    (r: KYCRule) => r.status === userStatus && r.legal_type === userLegalType
  ) ?? null;

  return (
    <ProductPageClient
      bank={bank}
      product={product}
      kycRule={kycRule}
      userStatus={userStatus}
      userLegalType={userLegalType}
    />
  );
}
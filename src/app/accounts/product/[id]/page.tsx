// src/app/accounts/product/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getProductWithBankData } from "@/lib/data/banks";
import { ProductPageClient } from "@/components/Product/ProductPageClient";
import type { Metadata } from "next";
import type { ResidencyStatus, LegalType, KYCRule, BankProduct } from "@/types/bank";

export const dynamic = "force-dynamic";

// ── Человекочитаемые названия категорий для title/description ─────────────
function getCategoryLabel(category: BankProduct['category']): string {
  const map: Record<BankProduct['category'], string> = {
    personal_account:  'Личный счёт',
    business_account:  'Бизнес-счёт (РКО)',
    savings_deposit:   'Вклад',
    investment_bonds:  'Гособлигации',
    credit_mortgage:   'Ипотека',
    credit_consumer:   'Потребительский кредит',
    transfer:          'Переводы',
  };
  return map[category] ?? 'Продукт';
}

// ── generateMetadata ───────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const productId = decodeURIComponent(resolvedParams.id);

  const data = await getProductWithBankData(productId);
  if (!data) return {};

  const { bank, product } = data;
  const categoryLabel = getCategoryLabel(product.category);
  const title = `${product.name} — ${bank.brand_name} | ExpatFinance`;
  const description = `${categoryLabel} в ${bank.brand_name} для экспатов в Сербии. Тарифы, KYC-документы и условия открытия по вашему статусу ВНЖ.`;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://finnavi.rs';
  const url = `${BASE_URL}/accounts/product/${productId}`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'ExpatFinance Navigator',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────
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
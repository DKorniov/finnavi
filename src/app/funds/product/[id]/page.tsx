// src/app/funds/product/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getFundProductById } from "@/lib/data/funds";
import { FundProductClient } from "@/components/Product/FundProductClient";
import type { Metadata } from "next";
import type { ResidencyStatus } from "@/types/bank";

export const dynamic = "force-dynamic";

// ── generateMetadata ───────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const fundProductId = decodeURIComponent(resolvedParams.id);

  const item = await getFundProductById(fundProductId);
  if (!item) return {};

  const { product } = item;
  const title = `${product.name} — ${product.company.name} | ExpatFinance`;
  const description = `Инвестиционный фонд ${product.name} от ${product.company.name}. Доходность, комиссии и доступность для экспатов в Сербии.`;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://finnavi.rs";
  const url = `${BASE_URL}/funds/product/${fundProductId}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "ExpatFinance Navigator",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function FundProductPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const fundProductId = decodeURIComponent(resolvedParams.id);

  const cookieStore = await cookies();
  const userStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;

  const item = await getFundProductById(fundProductId, userStatus);
  if (!item) notFound();

  return <FundProductClient item={item} userStatus={userStatus} />;
}
// src/app/sitemap.ts
import { getAllBanks } from "@/lib/data/banks";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://finnavi.rs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const banks = await getAllBanks();

  // Статичные страницы приложения
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/?tab=accounts`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/?tab=savings_deposit`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/?tab=investment_bonds`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/?tab=credit_mortgage`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/?tab=transfer`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/?tab=business_account`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/?tab=taxes`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/?tab=services`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // Динамические страницы продуктов из JSON
  const productRoutes: MetadataRoute.Sitemap = banks.flatMap((bank) =>
    bank.products.map((product) => ({
      url: `${BASE_URL}/accounts/product/${product.product_id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      lastModified: bank.last_updated,
    }))
  );

  return [...staticRoutes, ...productRoutes];
}
// src/lib/data/funds.ts
import fs from "fs";
import path from "path";
import type { FundCompanyJSON, TransformedFundItem } from "@/types/fund";
import type { ResidencyStatus } from "@/types/bank";

const fundsDirectory = path.join(process.cwd(), "data/funds");
let fundsCache: FundCompanyJSON[] | null = null;

export async function getAllFundCompanies(): Promise<FundCompanyJSON[]> {
  if (fundsCache) return fundsCache;
  if (!fs.existsSync(fundsDirectory)) return [];

  const fileNames = fs.readdirSync(fundsDirectory);

  const companies = fileNames
    .filter(fileName => fileName.endsWith(".json"))
    .map(fileName => {
      const fullPath = path.join(fundsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      try {
        if (!fileContents.trim()) return null;
        return JSON.parse(fileContents) as FundCompanyJSON;
      } catch (error) {
        console.error(`🚨 Ошибка JSON в ${fileName}:`, error);
        return null;
      }
    })
    .filter((company): company is FundCompanyJSON => company !== null);

  fundsCache = companies;
  return companies;
}

// Разворачивает все УК в плоский список фондов для текущего статуса резидентства
export async function getFundItemsForStatus(
  status: ResidencyStatus
): Promise<TransformedFundItem[]> {
  const companies = await getAllFundCompanies();
  const items: TransformedFundItem[] = [];

  for (const company of companies) {
    const availabilityRule = company.availability?.find(a => a.status === status);

    const isAvailable = availabilityRule?.is_available ?? true;
    const probability = availabilityRule?.probability ?? "medium";
    const availabilityNotes = availabilityRule?.notes ?? null;

    for (const product of company.products) {
      items.push({
        id: `${company.fund_company_id}_${product.fund_product_id}`,
        fund_product_id: product.fund_product_id,
        is_available: isAvailable,
        probability,
        availability_notes: availabilityNotes,
        product: {
          ...product,
          company: {
            name: company.brand_name,
            official_name: company.official_name,
            website: company.website,
            logo_color: company.logo_color ?? null,
            regulator: company.regulator,
            depozitar: company.depozitar,
            access_methods: company.access_methods,
            pros: company.pros ?? [],
            risks: company.risks ?? [],
          },
        },
      });
    }
  }

  return items;
}

export async function getFundProductById(
  fundProductId: string,
  status: ResidencyStatus = "non_resident"
): Promise<TransformedFundItem | null> {
  const items = await getFundItemsForStatus(status);
  return items.find(i => i.fund_product_id === fundProductId) ?? null;
}
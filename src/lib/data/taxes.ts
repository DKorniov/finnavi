// src/lib/data/taxes.ts
import fs from "fs";
import path from "path";
import type { TaxRuleWithCategory, AssetCategory } from "@/types/database";

interface TaxesJSON {
  asset_categories: AssetCategory[];
  tax_rules: Array<Omit<TaxRuleWithCategory, "asset_categories"> & { category_id: string }>;
}

const taxesFilePath = path.join(process.cwd(), "data/taxes.json");
let taxesCache: TaxRuleWithCategory[] | null = null;

export async function getTaxRules(): Promise<TaxRuleWithCategory[]> {
  if (taxesCache) return taxesCache;
  if (!fs.existsSync(taxesFilePath)) return [];

  const fileContents = fs.readFileSync(taxesFilePath, "utf8");
  let data: TaxesJSON;
  try {
    data = JSON.parse(fileContents) as TaxesJSON;
  } catch (error) {
    console.error("🚨 Ошибка JSON в taxes.json:", error);
    return [];
  }

  const categoryById = new Map(data.asset_categories.map(c => [c.id, c]));

  const rules: TaxRuleWithCategory[] = data.tax_rules
    .map(rule => {
      const category = categoryById.get(rule.category_id);
      if (!category) {
        console.error(`🚨 taxes.json: category_id "${rule.category_id}" не найден в asset_categories`);
        return null;
      }
      return { ...rule, asset_categories: category };
    })
    .filter((r): r is TaxRuleWithCategory => r !== null);

  taxesCache = rules;
  return rules;
}